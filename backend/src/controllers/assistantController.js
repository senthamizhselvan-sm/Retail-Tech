const { GoogleGenerativeAI } = require('@google/generative-ai');
const InventoryItem = require('../models/InventoryItem');
const BusinessProfile = require('../models/BusinessProfile');
const MemoryDatabase = require('../config/memoryDb');
const mongoose = require('mongoose');

// Check if MongoDB is connected
const isMongoConnected = () => {
  return mongoose.connection.readyState === 1;
};

// @desc    Chat with personal AI assistant
// @route   POST /api/assistant/chat
// @access  Private
exports.chatWithAssistant = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid message',
      });
    }

    // Fetch vendor-specific data
    let vendorData;
    
    if (isMongoConnected()) {
      vendorData = await getVendorDataFromMongo(userId);
    } else {
      vendorData = getVendorDataFromMemory(userId);
    }

    // Step 3: Detect intent
    const intent = detectIntent(message.trim());
    console.log(`🧠 Detected intent: ${intent} for message: "${message.trim()}"`);

    // Step 4A: Handle action commands first (NO GEMINI)
    if (['ADD_STOCK', 'ADD_PRODUCT', 'REMOVE_STOCK'].includes(intent)) {
      const command = parseInventoryCommand(message.trim());
      const actionResponse = await executeInventoryCommand(command, userId);
      
      console.log('✅ Action command executed');
      return res.json({
        success: true,
        data: {
          userMessage: message.trim(),
          aiResponse: actionResponse,
          timestamp: new Date().toISOString(),
          intent: intent,
          action: command.action
        },
      });
    }

    // Step 4B: Handle factual intents without Gemini
    const factualResponse = await handleFactualIntent(intent, vendorData);
    
    if (factualResponse) {
      console.log('✅ Direct factual response provided');
      return res.json({
        success: true,
        data: {
          userMessage: message.trim(),
          aiResponse: factualResponse,
          timestamp: new Date().toISOString(),
          intent: intent
        },
      });
    }

    // Step 5: Use Gemini only for reasoning intents (OFFER_SUGGESTION, BUSINESS_ADVICE, UNKNOWN)
    let aiResponse;

    // Try Gemini for reasoning questions only
    if (process.env.GEMINI_API_KEY && ['OFFER_SUGGESTION', 'BUSINESS_ADVICE', 'UNKNOWN'].includes(intent)) {
      try {
        aiResponse = await getGeminiResponse(vendorData, message.trim());
        console.log('✅ Gemini response received for reasoning intent');
      } catch (geminiError) {
        console.log('⚠️ Using fallback response due to Gemini error');
        aiResponse = generateFallbackResponse(vendorData, message.trim());
      }
    } else {
      console.log('⚠️ No Gemini API key or non-reasoning intent, using fallback response');
      aiResponse = generateFallbackResponse(vendorData, message.trim());
    }

    // Always return success with meaningful response
    res.json({
      success: true,
      data: {
        userMessage: message.trim(),
        aiResponse: aiResponse,
        timestamp: new Date().toISOString(),
        intent: intent
      },
    });

  } catch (error) {
    console.error('❌ Critical assistant error:', error);
    
    // Emergency fallback if everything fails
    let emergencyResponse;
    try {
      emergencyResponse = generateFallbackResponse(vendorData, req.body.message || 'help');
    } catch (fallbackError) {
      // Only use generic error if both Gemini and fallback completely fail
      emergencyResponse = "I'm having trouble right now. Try asking about your inventory, offers, or business insights.";
    }
    
    res.json({
      success: true,
      data: {
        userMessage: req.body.message || '',
        aiResponse: emergencyResponse,
        timestamp: new Date().toISOString(),
      },
    });
  }
};

// Intent detection function
function detectIntent(message) {
  const msg = message.toLowerCase().trim();
  
  // ACTION COMMANDS - Check these first
  // ADD_STOCK
  if (msg.match(/add \d+|increase stock|sold \d+/) || 
      (msg.includes('add') && msg.match(/\d+/) && !msg.includes('new product'))) {
    return 'ADD_STOCK';
  }
  
  // ADD_PRODUCT
  if (msg.includes('add new product') || msg.includes('create product') || 
      (msg.includes('new') && msg.includes('product'))) {
    return 'ADD_PRODUCT';
  }
  
  // REMOVE_STOCK
  if (msg.includes('remove') || msg.includes('sold') || msg.includes('decrease')) {
    return 'REMOVE_STOCK';
  }
  
  // FACTUAL QUESTIONS
  // GREETING
  if (msg.match(/^(hi|hello|hey|good morning|good afternoon|good evening|namaste)$/i)) {
    return 'GREETING';
  }
  
  // SHOP_INFO
  if (msg.includes('shop name') || msg.includes('store name') || msg.includes('business name') || 
      msg.includes('what is my shop') || msg.includes('name of my shop')) {
    return 'SHOP_INFO';
  }
  
  // INVENTORY_STATUS
  if ((msg.includes('inventory') || msg.includes('stock') || msg.includes('items')) && 
      (msg.includes('how many') || msg.includes('total') || msg.includes('status') || msg.includes('summary'))) {
    return 'INVENTORY_STATUS';
  }
  
  // LOW_STOCK
  if (msg.includes('low stock') || msg.includes('out of stock') || msg.includes('which items are low') ||
      msg.includes('what is low') || msg.includes('low inventory')) {
    return 'LOW_STOCK';
  }
  
  // EXPIRY
  if (msg.includes('expir') || msg.includes('old items') || msg.includes('fresh') ||
      msg.includes('soon to expire') || msg.includes('expiring soon')) {
    return 'EXPIRY';
  }
  
  // ADVISORY QUESTIONS - These use Gemini
  // OFFER_SUGGESTION
  if (msg.includes('promote') || msg.includes('offer') || msg.includes('sale') || 
      msg.includes('discount') || msg.includes('what should i') || msg.includes('suggest')) {
    return 'OFFER_SUGGESTION';
  }
  
  // BUSINESS_ADVICE
  if (msg.includes('why') || msg.includes('should i') || msg.includes('best way') ||
      msg.includes('tips') || msg.includes('advice') || msg.includes('help me') ||
      msg.includes('how to') || msg.includes('when to')) {
    return 'BUSINESS_ADVICE';
  }
  
  return 'UNKNOWN';
}

// Parse inventory command details
function parseInventoryCommand(message) {
  const msg = message.toLowerCase().trim();
  
  // Extract quantity
  const quantityMatch = msg.match(/\d+/);
  const quantity = quantityMatch ? parseInt(quantityMatch[0]) : 1;
  
  // Extract product name - more flexible parsing
  let productName = '';
  
  if (msg.includes('add new product') || msg.includes('create product')) {
    // "add new product milk with 5 quantity"
    const productMatch = msg.match(/(?:add new product|create product)\s+(\w+)/);
    productName = productMatch ? productMatch[1] : '';
    return { action: 'add_product', productName, quantity };
  }
  
  if (msg.includes('add') && !msg.includes('new')) {
    // "add 5 battery in stock"
    const addMatch = msg.match(/add\s+\d+\s+(\w+)/) || msg.match(/add\s+(\w+)/);
    productName = addMatch ? addMatch[1] : '';
    return { action: 'add_stock', productName, quantity };
  }
  
  if (msg.includes('sold') || msg.includes('remove')) {
    // "sold 2 soap" or "remove 3 biscuit"
    const removeMatch = msg.match(/(?:sold|remove)\s+\d+\s+(\w+)/) || 
                       msg.match(/(?:sold|remove)\s+(\w+)/);
    productName = removeMatch ? removeMatch[1] : '';
    return { action: 'remove_stock', productName, quantity };
  }
  
  if (msg.includes('increase stock')) {
    // "increase stock of sugar by 10"
    const increaseMatch = msg.match(/increase stock of\s+(\w+)/);
    productName = increaseMatch ? increaseMatch[1] : '';
    return { action: 'add_stock', productName, quantity };
  }
  
  return { action: 'unknown', productName: '', quantity: 0 };
}

// Execute inventory commands
async function executeInventoryCommand(command, userId) {
  const { action, productName, quantity } = command;
  
  if (!productName || quantity <= 0) {
    return "❌ Please specify a valid product name and quantity.";
  }
  
  try {
    if (isMongoConnected()) {
      return await executeInventoryCommandMongo(action, productName, quantity, userId);
    } else {
      return executeInventoryCommandMemory(action, productName, quantity, userId);
    }
  } catch (error) {
    console.error('❌ Inventory command error:', error);
    return "❌ Unable to execute command. Please try again.";
  }
}

// MongoDB inventory operations
async function executeInventoryCommandMongo(action, productName, quantity, userId) {
  switch (action) {
    case 'add_stock':
      const existingItem = await InventoryItem.findOne({
        businessId: userId,
        productName: { $regex: new RegExp(`^${productName}$`, 'i') }
      });
      
      if (existingItem) {
        existingItem.quantity += quantity;
        await existingItem.save();
        return `✅ Added ${quantity} ${productName}. New stock: ${existingItem.quantity}`;
      } else {
        return `❌ Product ${productName} not found. Say 'add new product ${productName}' to create it.`;
      }
      
    case 'add_product':
      const newItem = new InventoryItem({
        businessId: userId,
        productName: productName,
        quantity: quantity,
        unit: 'piece',
        minStockLevel: 5
      });
      await newItem.save();
      return `✅ Product ${productName} added with quantity ${quantity}.`;
      
    case 'remove_stock':
      const itemToReduce = await InventoryItem.findOne({
        businessId: userId,
        productName: { $regex: new RegExp(`^${productName}$`, 'i') }
      });
      
      if (itemToReduce) {
        if (itemToReduce.quantity >= quantity) {
          itemToReduce.quantity -= quantity;
          await itemToReduce.save();
          return `✅ Sold ${quantity} ${productName}. Remaining stock: ${itemToReduce.quantity}`;
        } else {
          return `❌ Insufficient stock. Only ${itemToReduce.quantity} ${productName} available.`;
        }
      } else {
        return `❌ Product ${productName} not found in inventory.`;
      }
      
    default:
      return "❌ Unknown command.";
  }
}

// Memory database inventory operations
function executeInventoryCommandMemory(action, productName, quantity, userId) {
  switch (action) {
    case 'add_stock':
      const existingItems = MemoryDatabase.findInventoryByBusinessId(userId);
      const existingItem = existingItems.find(item => 
        item.productName.toLowerCase() === productName.toLowerCase()
      );
      
      if (existingItem) {
        existingItem.quantity += quantity;
        return `✅ Added ${quantity} ${productName}. New stock: ${existingItem.quantity}`;
      } else {
        return `❌ Product ${productName} not found. Say 'add new product ${productName}' to create it.`;
      }
      
    case 'add_product':
      const newItem = MemoryDatabase.createInventoryItem({
        businessId: userId,
        productName: productName,
        quantity: quantity,
        unit: 'piece',
        minStockLevel: 5
      });
      return `✅ Product ${productName} added with quantity ${quantity}.`;
      
    case 'remove_stock':
      const itemsToReduce = MemoryDatabase.findInventoryByBusinessId(userId);
      const itemToReduce = itemsToReduce.find(item => 
        item.productName.toLowerCase() === productName.toLowerCase()
      );
      
      if (itemToReduce) {
        if (itemToReduce.quantity >= quantity) {
          itemToReduce.quantity -= quantity;
          return `✅ Sold ${quantity} ${productName}. Remaining stock: ${itemToReduce.quantity}`;
        } else {
          return `❌ Insufficient stock. Only ${itemToReduce.quantity} ${productName} available.`;
        }
      } else {
        return `❌ Product ${productName} not found in inventory.`;
      }
      
    default:
      return "❌ Unknown command.";
  }
}

// Handle factual intents without Gemini
async function handleFactualIntent(intent, vendorData) {
  switch (intent) {
    case 'GREETING':
      return `Hello! I'm your business assistant for ${vendorData.shopName}. How can I help you today?`;
      
    case 'SHOP_INFO':
      return `Your shop name is ${vendorData.shopName}.`;
      
    case 'INVENTORY_STATUS':
      return `You have ${vendorData.inventorySummary.totalItems} items in your inventory. ${vendorData.inventorySummary.lowStockItems.length > 0 ? 
        `${vendorData.inventorySummary.lowStockItems.length} items need restocking.` : 'All items are well stocked.'} ${vendorData.inventorySummary.expiringItems.length > 0 ?
        `${vendorData.inventorySummary.expiringItems.length} items are expiring soon.` : 'No items are expiring soon.'}`;
        
    case 'LOW_STOCK':
      if (vendorData.inventorySummary.lowStockItems.length > 0) {
        const lowItems = vendorData.inventorySummary.lowStockItems.slice(0, 3)
          .map(item => `${item.name} (${item.quantity} ${item.unit})`)
          .join(', ');
        return `You have low stock on: ${lowItems}.${vendorData.inventorySummary.lowStockItems.length > 3 ? ` And ${vendorData.inventorySummary.lowStockItems.length - 3} more items.` : ''}`;
      } else {
        return "All items are sufficiently stocked.";
      }
      
    case 'EXPIRY':
      if (vendorData.inventorySummary.expiringItems.length > 0) {
        const expiringItems = vendorData.inventorySummary.expiringItems.slice(0, 3)
          .map(item => `${item.name} (expires ${item.expiryDate})`)
          .join(', ');
        return `Items expiring soon: ${expiringItems}.${vendorData.inventorySummary.expiringItems.length > 3 ? ` And ${vendorData.inventorySummary.expiringItems.length - 3} more items.` : ''}`;
      } else {
        return "No items are expiring soon.";
      }
      
    default:
      return null; // Let Gemini handle this
  }
}

// Helper function to get Gemini response (same pattern as image enhancement)
async function getGeminiResponse(vendorData, userMessage) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = buildAssistantPrompt(vendorData, userMessage);
    const result = await model.generateContent(prompt);
    const response = result.response;
    
    // Safely extract response text (same as image enhancement)
    if (response && typeof response.text === 'function') {
      const geminiText = response.text();
      if (geminiText && geminiText.trim().length > 0) {
        return geminiText.trim();
      } else {
        throw new Error('Empty Gemini response');
      }
    } else {
      throw new Error('Invalid Gemini response format');
    }
    
  } catch (error) {
    console.error('❌ Gemini assistant failed:', error.message);
    // Throw error to trigger fallback (same pattern as image enhancement)
    throw error;
  }
}

// Helper function to fetch vendor data from MongoDB
async function getVendorDataFromMongo(userId) {
  try {
    // Get business profile
    const profile = await BusinessProfile.findOne({ userId });
    
    // Get inventory items
    const inventoryItems = await InventoryItem.find({ businessId: userId });
    
    // Process inventory data
    const inventorySummary = processInventoryData(inventoryItems);
    
    return {
      shopName: profile?.shopName || 'Your Shop',
      vendorType: profile?.vendorType || 'general_store',
      inventorySummary,
      currentDate: new Date().toLocaleDateString('en-IN'),
      currentDay: new Date().toLocaleDateString('en-IN', { weekday: 'long' }),
    };
  } catch (error) {
    console.error('Error fetching vendor data from MongoDB:', error);
    return getDefaultVendorData();
  }
}

// Helper function to fetch vendor data from Memory Database
function getVendorDataFromMemory(userId) {
  try {
    const user = MemoryDatabase.findUserById(userId);
    const profile = MemoryDatabase.findBusinessProfile(userId);
    const inventoryItems = MemoryDatabase.findInventoryItems(userId);
    
    const inventorySummary = processInventoryData(inventoryItems || []);
    
    return {
      shopName: profile?.shopName || 'Your Shop',
      vendorType: profile?.vendorType || 'general_store',
      inventorySummary,
      currentDate: new Date().toLocaleDateString('en-IN'),
      currentDay: new Date().toLocaleDateString('en-IN', { weekday: 'long' }),
    };
  } catch (error) {
    console.error('Error fetching vendor data from Memory:', error);
    return getDefaultVendorData();
  }
}

// Helper function to process inventory data
function processInventoryData(inventoryItems) {
  if (!inventoryItems || inventoryItems.length === 0) {
    return {
      totalItems: 0,
      lowStockItems: [],
      expiringItems: [],
      summary: "No inventory data available",
    };
  }

  const lowStockItems = [];
  const expiringItems = [];
  const currentDate = new Date();
  const oneWeekFromNow = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);

  inventoryItems.forEach(item => {
    // Check for low stock
    if (item.quantity <= item.minStockLevel) {
      lowStockItems.push({
        name: item.productName,
        quantity: item.quantity,
        unit: item.unit,
        status: item.quantity === 0 ? 'OUT_OF_STOCK' : 'LOW',
      });
    }

    // Check for expiring items
    if (item.expiryDate && new Date(item.expiryDate) <= oneWeekFromNow) {
      expiringItems.push({
        name: item.productName,
        expiryDate: new Date(item.expiryDate).toLocaleDateString('en-IN'),
        daysLeft: Math.ceil((new Date(item.expiryDate) - currentDate) / (24 * 60 * 60 * 1000)),
      });
    }
  });

  // Create summary text
  let summary = `Total items: ${inventoryItems.length}`;
  if (lowStockItems.length > 0) {
    summary += `\nLow stock items (${lowStockItems.length}): ${lowStockItems.map(item => 
      `${item.name} (${item.quantity} ${item.unit}${item.status === 'OUT_OF_STOCK' ? ' - OUT OF STOCK' : ' - LOW'})`
    ).join(', ')}`;
  } else {
    summary += '\nAll items are well stocked';
  }

  if (expiringItems.length > 0) {
    summary += `\nExpiring soon (${expiringItems.length}): ${expiringItems.map(item => 
      `${item.name} (expires ${item.expiryDate})`
    ).join(', ')}`;
  } else {
    summary += '\nNo items expiring soon';
  }

  return {
    totalItems: inventoryItems.length,
    lowStockItems,
    expiringItems,
    summary,
  };
}

// Helper function to get default vendor data
function getDefaultVendorData() {
  return {
    shopName: 'Your Shop',
    vendorType: 'general_store',
    inventorySummary: {
      totalItems: 0,
      lowStockItems: [],
      expiringItems: [],
      summary: "No inventory data available",
    },
    currentDate: new Date().toLocaleDateString('en-IN'),
    currentDay: new Date().toLocaleDateString('en-IN', { weekday: 'long' }),
  };
}

// Helper function to build the Gemini prompt
function buildAssistantPrompt(vendorData, userMessage) {
  // Clean and sanitize the user message
  const cleanUserMessage = userMessage.replace(/[""'']/g, '"').trim();
  
  const prompt = `You are a personal AI assistant for a small shop owner in India.

Shop Context:
Shop Name: ${vendorData.shopName}
Shop Type: ${vendorData.vendorType}
Today: ${vendorData.currentDay}, ${vendorData.currentDate}

Inventory Summary:
${vendorData.inventorySummary.summary}

Offers:
- Weekend offers work well for family items
- Sunday is typically good for household essentials
- Saturday attracts more foot traffic
- Status: Based on inventory and day analysis

Rules:
- Use simple, clear business language
- Provide practical advice only
- Do not make financial promises or predictions
- Do not auto-execute any actions
- Keep responses under 120 words
- Focus on actionable insights
- If asked "why", explain in simple business terms
- Address the shop owner directly

User Question: ${cleanUserMessage}`;

  return prompt;
}

// Generate fallback response using business logic when Gemini is not available
function generateFallbackResponse(vendorData, userMessage) {
  const message = userMessage.toLowerCase();
  
  // Offer/promotion questions
  if (message.includes('promote') || message.includes('offer') || message.includes('sale')) {
    const day = vendorData.currentDay;
    if (day === 'Saturday' || day === 'Sunday') {
      return "Weekends are great for family-focused promotions. Consider bundling household items or offering family packs to attract more customers.";
    } else {
      return "Weekday promotions work well for quick purchases. Consider offering discounts on daily essentials or items people need regularly.";
    }
  }
  
  // Business advice/reasoning questions
  if (message.includes('why') || message.includes('should i') || message.includes('best') || message.includes('tips')) {
    if (message.includes('sunday') || message.includes('weekend')) {
      return "Sundays work well for family shopping. Families plan weekly purchases and stock up on household essentials, making it ideal for bundled offers.";
    } else if (message.includes('sell') || message.includes('popular')) {
      return `In ${vendorData.vendorType} shops, daily essentials and household items typically sell well. Focus on items people need regularly.`;
    } else {
      return `Based on your shop type (${vendorData.vendorType}), focus on understanding customer buying patterns. ${vendorData.currentDay} is good for targeting regular customers.`;
    }
  }
  
  // Generic business insight for unclear questions
  return `Today is ${vendorData.currentDay}. You have ${vendorData.inventorySummary.totalItems} items in inventory. ${vendorData.inventorySummary.lowStockItems.length > 0 ? 
    `Consider restocking ${vendorData.inventorySummary.lowStockItems.length} items that are running low.` : 
    'Your stock levels look good.'} How can I help you grow your business?`;
}