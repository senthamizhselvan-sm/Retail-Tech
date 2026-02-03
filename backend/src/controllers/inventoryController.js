const InventoryItem = require('../models/InventoryItem');
const InventoryService = require('../services/inventoryService');
const MemoryDatabase = require('../config/memoryDb');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// In-memory storage for activity logs and undo actions (per business)
const activityLogs = new Map(); // businessId -> Array of activities (last 10)
const undoActions = new Map(); // businessId -> last undo action

// Helper function to add activity log
const addActivityLog = (businessId, activity) => {
  if (!activityLogs.has(businessId)) {
    activityLogs.set(businessId, []);
  }

  const logs = activityLogs.get(businessId);
  logs.unshift(activity); // Add to beginning

  // Keep only last 10 activities
  if (logs.length > 10) {
    logs.splice(10);
  }

  activityLogs.set(businessId, logs);
};

// Helper function to store undo action
const storeUndoAction = (businessId, productId, productName, quantityDelta, source) => {
  undoActions.set(businessId, {
    productId,
    productName,
    quantityDelta: -quantityDelta, // Reverse the action
    source,
    timestamp: new Date()
  });
};

// Check if MongoDB is connected
const isMongoConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Add a new product to inventory
exports.addProduct = async (req, res) => {
  try {
    const {
      productName,
      category,
      quantity,
      unit,
      minStockLevel,
      expiryDate,
      costPrice,
      sellingPrice,
      mrp
    } = req.body;
    const businessId = req.user.id;

    // Validate and prepare pricing fields (optional, safe)
    const pricingData = {};
    if (costPrice !== undefined && !isNaN(Number(costPrice))) {
      pricingData.costPrice = Number(costPrice);
    }
    if (sellingPrice !== undefined && !isNaN(Number(sellingPrice))) {
      pricingData.sellingPrice = Number(sellingPrice);
    }
    if (mrp !== undefined && !isNaN(Number(mrp))) {
      pricingData.mrp = Number(mrp);
    }

    // Validate pricing logic (skip if invalid, don't throw error)
    if (pricingData.costPrice !== undefined && pricingData.sellingPrice !== undefined) {
      if (pricingData.sellingPrice < pricingData.costPrice) {
        // Skip pricing update silently if invalid
        delete pricingData.costPrice;
        delete pricingData.sellingPrice;
      } else {
        pricingData.lastPriceUpdatedAt = new Date();
      }
    }

    if (isMongoConnected()) {
      // Use MongoDB
      const existingProduct = await InventoryItem.findOne({
        businessId,
        productName: { $regex: new RegExp(`^${productName.trim()}$`, 'i') }
      });

      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'Product with this name already exists'
        });
      }

      const inventoryItem = new InventoryItem({
        businessId,
        productName: productName.trim(),
        category: category?.trim(),
        quantity: Number(quantity) || 0,
        unit,
        minStockLevel: Number(minStockLevel) || 5,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        ...pricingData
      });

      await inventoryItem.save();

      // Add activity log for product creation
      addActivityLog(businessId, {
        type: 'create',
        productName: inventoryItem.productName,
        quantityChange: inventoryItem.quantity,
        source: 'manual',
        timestamp: new Date(),
        unit: inventoryItem.unit
      });

      const responseItem = {
        _id: inventoryItem._id,
        productName: inventoryItem.productName,
        category: inventoryItem.category,
        quantity: inventoryItem.quantity,
        unit: inventoryItem.unit,
        minStockLevel: inventoryItem.minStockLevel,
        expiryDate: inventoryItem.expiryDate,
        stockStatus: InventoryService.calculateStockStatus(inventoryItem),
        expiryStatus: InventoryService.calculateExpiryStatus(inventoryItem.expiryDate),
        createdAt: inventoryItem.createdAt,
        updatedAt: inventoryItem.updatedAt
      };

      res.status(201).json({
        success: true,
        message: 'Product added successfully',
        data: responseItem,
        activityLogs: activityLogs.get(businessId) || []
      });
    } else {
      // Use Memory Database
      const existingItems = MemoryDatabase.findInventoryByBusinessId(businessId);
      const existingProduct = existingItems.find(item =>
        item.productName.toLowerCase() === productName.trim().toLowerCase()
      );

      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'Product with this name already exists'
        });
      }

      const inventoryItem = MemoryDatabase.createInventoryItem({
        businessId,
        productName: productName.trim(),
        category: category?.trim(),
        quantity: Number(quantity) || 0,
        unit,
        minStockLevel: Number(minStockLevel) || 5,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined
      });

      // Add activity log for product creation (memory storage)
      addActivityLog(businessId, {
        type: 'create',
        productName: inventoryItem.productName,
        quantityChange: inventoryItem.quantity,
        source: 'manual',
        timestamp: new Date(),
        unit: inventoryItem.unit
      });

      const responseItem = {
        _id: inventoryItem._id,
        productName: inventoryItem.productName,
        category: inventoryItem.category,
        quantity: inventoryItem.quantity,
        unit: inventoryItem.unit,
        minStockLevel: inventoryItem.minStockLevel,
        expiryDate: inventoryItem.expiryDate,
        stockStatus: InventoryService.calculateStockStatus(inventoryItem),
        expiryStatus: InventoryService.calculateExpiryStatus(inventoryItem.expiryDate),
        createdAt: inventoryItem.createdAt,
        updatedAt: inventoryItem.updatedAt
      };

      res.status(201).json({
        success: true,
        message: 'Product added successfully (using memory storage)',
        data: responseItem,
        activityLogs: activityLogs.get(businessId) || []
      });
    }
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add product',
      error: error.message
    });
  }
};

// Update product details including pricing
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      productName,
      category,
      unit,
      minStockLevel,
      expiryDate,
      costPrice,
      sellingPrice,
      mrp
    } = req.body;
    const businessId = req.user.id;

    // Prepare update data
    const updateData = {};
    if (productName !== undefined) updateData.productName = productName.trim();
    if (category !== undefined) updateData.category = category?.trim();
    if (unit !== undefined) updateData.unit = unit;
    if (minStockLevel !== undefined) updateData.minStockLevel = Number(minStockLevel);
    if (expiryDate !== undefined) updateData.expiryDate = expiryDate ? new Date(expiryDate) : null;

    // Handle pricing fields safely
    let pricingUpdate = false;
    if (costPrice !== undefined && !isNaN(Number(costPrice))) {
      updateData.costPrice = Number(costPrice);
      pricingUpdate = true;
    }
    if (sellingPrice !== undefined && !isNaN(Number(sellingPrice))) {
      updateData.sellingPrice = Number(sellingPrice);
      pricingUpdate = true;
    }
    if (mrp !== undefined && !isNaN(Number(mrp))) {
      updateData.mrp = Number(mrp);
      pricingUpdate = true;
    }

    // Validate pricing logic before update
    if (updateData.costPrice !== undefined && updateData.sellingPrice !== undefined) {
      if (updateData.sellingPrice < updateData.costPrice) {
        // Skip pricing update if invalid, but allow other fields
        delete updateData.costPrice;
        delete updateData.sellingPrice;
        pricingUpdate = false;
      }
    }

    if (pricingUpdate) {
      updateData.lastPriceUpdatedAt = new Date();
    }

    if (isMongoConnected()) {
      const item = await InventoryItem.findOneAndUpdate(
        { _id: id, businessId },
        updateData,
        { new: true, runValidators: true }
      );

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      const responseItem = {
        _id: item._id,
        productName: item.productName,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        minStockLevel: item.minStockLevel,
        expiryDate: item.expiryDate,
        costPrice: item.costPrice,
        sellingPrice: item.sellingPrice,
        mrp: item.mrp,
        lastPriceUpdatedAt: item.lastPriceUpdatedAt,
        stockStatus: InventoryService.calculateStockStatus(item),
        expiryStatus: InventoryService.calculateExpiryStatus(item.expiryDate),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      };

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: responseItem
      });
    } else {
      // Use Memory Database
      const updatedItem = MemoryDatabase.updateInventoryItem(id, businessId, updateData);

      if (!updatedItem) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      const responseItem = {
        _id: updatedItem._id,
        productName: updatedItem.productName,
        category: updatedItem.category,
        quantity: updatedItem.quantity,
        unit: updatedItem.unit,
        minStockLevel: updatedItem.minStockLevel,
        expiryDate: updatedItem.expiryDate,
        costPrice: updatedItem.costPrice,
        sellingPrice: updatedItem.sellingPrice,
        mrp: updatedItem.mrp,
        lastPriceUpdatedAt: updatedItem.lastPriceUpdatedAt,
        stockStatus: InventoryService.calculateStockStatus(updatedItem),
        expiryStatus: InventoryService.calculateExpiryStatus(updatedItem.expiryDate),
        createdAt: updatedItem.createdAt,
        updatedAt: updatedItem.updatedAt
      };

      res.json({
        success: true,
        message: 'Product updated successfully (using memory storage)',
        data: responseItem
      });
    }
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
};

// Get all inventory items for the business with enhanced features
exports.getInventory = async (req, res) => {
  try {
    const businessId = req.user.id;

    if (isMongoConnected()) {
      const inventoryData = await InventoryService.getInventory(businessId);
      res.json({
        success: true,
        data: inventoryData.items,
        healthScore: inventoryData.healthScore,
        healthSummary: inventoryData.healthSummary,
        todaysTasks: inventoryData.todaysTasks,
        dayHint: inventoryData.dayHint,
        count: inventoryData.count
      });
    } else {
      // Use Memory Database with basic enhanced features
      const items = MemoryDatabase.findInventoryByBusinessId(businessId);
      const enhancedItems = items.map(item => ({
        _id: item._id,
        productName: item.productName,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        minStockLevel: item.minStockLevel,
        expiryDate: item.expiryDate,
        stockStatus: InventoryService.calculateStockStatus(item),
        expiryStatus: InventoryService.calculateExpiryStatus(item.expiryDate),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        // Basic enhanced features for memory storage
        margin: InventoryService.calculateMargin(item),
        priceWarnings: InventoryService.getPriceWarnings(item),
        goodForOffer: InventoryService.isGoodForOffer(item),
        fastMoving: false
      })).sort((a, b) => a.productName.localeCompare(b.productName));

      const healthScore = InventoryService.calculateHealthScore(items);
      const healthSummary = InventoryService.generateHealthSummary(items);
      const todaysTasks = InventoryService.generateTodaysTasks(items);
      const dayHint = InventoryService.getDayAwareHint();

      res.json({
        success: true,
        data: enhancedItems,
        healthScore,
        healthSummary,
        todaysTasks,
        dayHint,
        count: enhancedItems.length,
        source: 'memory'
      });
    }
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory',
      error: error.message
    });
  }
};

// Update product quantity (with delta) - Enhanced with activity logging and undo
exports.updateQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { delta, source = 'manual' } = req.body; // source: 'manual' or 'voice'
    const businessId = req.user.id;

    if (typeof delta !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Delta must be a number'
      });
    }

    if (isMongoConnected()) {
      const item = await InventoryItem.findOne({ _id: id, businessId });

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      const oldQuantity = item.quantity;
      const newQuantity = item.quantity + delta;

      if (newQuantity < 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity cannot be negative'
        });
      }

      item.quantity = newQuantity;
      await item.save();

      // Add activity log
      const actionType = delta > 0 ? 'add' : 'reduce';
      addActivityLog(businessId, {
        type: actionType,
        productName: item.productName,
        quantityChange: delta,
        source,
        timestamp: new Date(),
        unit: item.unit
      });

      // Store undo action
      storeUndoAction(businessId, item._id, item.productName, delta, source);

      const responseItem = {
        _id: item._id,
        productName: item.productName,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        minStockLevel: item.minStockLevel,
        expiryDate: item.expiryDate,
        stockStatus: InventoryService.calculateStockStatus(item),
        expiryStatus: InventoryService.calculateExpiryStatus(item.expiryDate),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      };

      res.json({
        success: true,
        message: 'Quantity updated successfully',
        data: responseItem,
        activityLogs: activityLogs.get(businessId) || [],
        hasUndoAction: undoActions.has(businessId)
      });
    } else {
      // Use Memory Database
      const item = MemoryDatabase.findInventoryById(id, businessId);

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      const oldQuantity = item.quantity;
      const newQuantity = item.quantity + delta;

      if (newQuantity < 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity cannot be negative'
        });
      }

      const updatedItem = MemoryDatabase.updateInventoryItem(id, businessId, { quantity: newQuantity });

      // Add activity log
      const actionType = delta > 0 ? 'add' : 'reduce';
      addActivityLog(businessId, {
        type: actionType,
        productName: updatedItem.productName,
        quantityChange: delta,
        source,
        timestamp: new Date(),
        unit: updatedItem.unit
      });

      // Store undo action
      storeUndoAction(businessId, updatedItem._id, updatedItem.productName, delta, source);

      const responseItem = {
        _id: updatedItem._id,
        productName: updatedItem.productName,
        category: updatedItem.category,
        quantity: updatedItem.quantity,
        unit: updatedItem.unit,
        minStockLevel: updatedItem.minStockLevel,
        expiryDate: updatedItem.expiryDate,
        stockStatus: InventoryService.calculateStockStatus(updatedItem),
        expiryStatus: InventoryService.calculateExpiryStatus(updatedItem.expiryDate),
        createdAt: updatedItem.createdAt,
        updatedAt: updatedItem.updatedAt
      };

      res.json({
        success: true,
        message: 'Quantity updated successfully (using memory storage)',
        data: responseItem,
        activityLogs: activityLogs.get(businessId) || [],
        hasUndoAction: undoActions.has(businessId)
      });
    }
  } catch (error) {
    console.error('Error updating quantity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update quantity',
      error: error.message
    });
  }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const businessId = req.user.id;

    if (isMongoConnected()) {
      const item = await InventoryItem.findOneAndDelete({ _id: id, businessId });

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      res.json({
        success: true,
        message: 'Product deleted successfully'
      });
    } else {
      // Use Memory Database
      const item = MemoryDatabase.deleteInventoryItem(id, businessId);

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      res.json({
        success: true,
        message: 'Product deleted successfully (using memory storage)'
      });
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
};

// Get low stock alerts
exports.getLowStockAlerts = async (req, res) => {
  try {
    const businessId = req.user.id;

    if (isMongoConnected()) {
      const alerts = await InventoryService.getLowStockAlerts(businessId);
      res.json({
        success: true,
        data: alerts,
        count: alerts.length
      });
    } else {
      // Use Memory Database
      const items = MemoryDatabase.findInventoryByBusinessId(businessId);
      const alerts = items.filter(item => {
        const status = InventoryService.calculateStockStatus(item);
        return status === 'LOW_STOCK' || status === 'OUT_OF_STOCK';
      }).map(item => ({
        _id: item._id,
        productName: item.productName,
        quantity: item.quantity,
        unit: item.unit,
        stockStatus: InventoryService.calculateStockStatus(item)
      }));

      res.json({
        success: true,
        data: alerts,
        count: alerts.length,
        source: 'memory'
      });
    }
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts',
      error: error.message
    });
  }
};

// Get inventory insights
exports.getInventoryInsights = async (req, res) => {
  try {
    const businessId = req.user.id;

    if (isMongoConnected()) {
      const insights = await InventoryService.getInventoryInsights(businessId);
      res.json({
        success: true,
        data: insights
      });
    } else {
      // Use Memory Database - Generate insights from memory data
      const items = MemoryDatabase.findInventoryByBusinessId(businessId);
      const insights = [];

      if (items.length === 0) {
        insights.push('No inventory items found. Start adding products to get insights.');
      } else {
        const lowStockItems = items.filter(item => InventoryService.calculateStockStatus(item) === 'LOW_STOCK');
        const outOfStockItems = items.filter(item => InventoryService.calculateStockStatus(item) === 'OUT_OF_STOCK');

        if (outOfStockItems.length > 0) {
          insights.push(`${outOfStockItems.length} item(s) are completely out of stock.`);
        }

        if (lowStockItems.length > 0) {
          insights.push(`${lowStockItems.length} item(s) are running low on stock.`);
        }

        if (insights.length === 0) {
          insights.push('Your inventory looks healthy! All items are well-stocked.');
        }

        insights.push('📱 Using demo mode - data is stored temporarily.');
      }

      res.json({
        success: true,
        data: insights,
        source: 'memory'
      });
    }
  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch insights',
      error: error.message
    });
  }
};

// @desc    Process voice command in English/Tamil using Gemini
// @route   POST /api/inventory/voice-command
// @access  Private
exports.processVoiceCommand = async (req, res) => {
  console.log('🎙️ Voice command endpoint HIT!');

  try {
    console.log('📝 Request body:', req.body);
    console.log('👤 User:', req.user);

    // Validate request
    if (!req.body || !req.body.command) {
      return res.status(400).json({
        success: false,
        message: 'Command is required in request body'
      });
    }

    const { command } = req.body;

    // Get business ID from authenticated user
    let businessId = req.user?.id || req.user?._id;

    if (!businessId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    console.log(`🎯 Processing voice command: "${command}" | Business: ${businessId}`);

    // Step 1: Get user's current inventory for context
    let inventoryItems = [];
    let inventoryMap = {};

    try {
      if (isMongoConnected()) {
        inventoryItems = await InventoryItem.find({ businessId })
          .select('productName quantity unit category costPrice sellingPrice mrp')
          .lean();
      } else {
        const memoryDb = MemoryDatabase.getInstance();
        inventoryItems = (memoryDb.get('inventory') || []).filter(item => item.businessId === businessId);
      }

      // Create lookup map with English and Tamil variations
      inventoryItems.forEach(item => {
        const name = item.productName.toLowerCase().trim();
        inventoryMap[name] = item;

        // Add common Tamil-English mappings for existing products
        const productMappings = {
          'soap': ['soap', 'soaps', 'சோப்', 'சோப', 'சோப்பு', 'soft', 'so'],
          'rice': ['rice', 'அரிசி', 'அரிச்சி', 'rais', 'rise'],
          'milk': ['milk', 'பால்', 'பாலு', 'mik', 'melk'],
          'battery': ['battery', 'batteries', 'பேட்டரி', 'பட்டரி', 'batri', 'batery'],
          'sugar': ['sugar', 'சர்க்கரை', 'suger', 'sugr'],
          'salt': ['salt', 'உப்பு', 'solt'],
          'oil': ['oil', 'எண்ணெய்', 'oyl'],
          'masala': ['masala', 'மசாலா', 'மசால', 'massala'],
          'diary': ['diary', 'டெய்ரி', 'டைரி', 'dairy', 'dairi'],
          'biscuit': ['biscuit', 'பிஸ்கட்', 'biscut', 'biskit']
        };

        // Map all variations to this product
        Object.entries(productMappings).forEach(([englishName, variations]) => {
          if (name.includes(englishName)) {
            variations.forEach(variant => {
              inventoryMap[variant.toLowerCase()] = item;
            });
          }
        });
      });

      console.log(`📦 Found ${inventoryItems.length} inventory items in database`);
    } catch (dbError) {
      console.log('⚠️ Database error, continuing with empty inventory:', dbError.message);
    }

    // Step 2: Auto-detect language from command
    const hasTamilChars = /[\u0B80-\u0BFF]/.test(command);
    const detectedLanguage = hasTamilChars ? 'tamil' : 'english';
    console.log(`🌐 Auto-detected language: ${detectedLanguage}`);

    // Step 3: Format inventory context for Gemini
    const inventoryContext = inventoryItems.length > 0
      ? inventoryItems.map(item =>
        `"${item.productName}" (Current stock: ${item.quantity} ${item.unit})`
      ).join(', ')
      : 'No products in inventory yet (system will create new products when needed)';

    // Step 4: Call Gemini AI for intelligent parsing with auto-correction
    let geminiResponse;

    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY not configured - check .env file');
      }

      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.1, // Lower temperature for more accurate parsing
          maxOutputTokens: 600,
        }
      });

      const enhancedPrompt = `You are an intelligent inventory voice command parser for a small business in India. Your job is to understand voice commands in ENGLISH or TAMIL, correct speech recognition errors, and extract the intended action.

===== USER'S CURRENT INVENTORY =====
${inventoryContext}

===== VOICE COMMAND (may contain recognition errors) =====
"${command}"

===== LANGUAGE AUTO-DETECTION =====
Detected: ${detectedLanguage.toUpperCase()}
(But the user might mix languages or the speech recognition might be wrong)

===== YOUR TASK =====
1. **Auto-detect** the actual language (English, Tamil, or mixed)
2. **Correct common speech recognition errors**
3. **Extract**: ACTION, PRODUCT NAME, QUANTITY
4. **Match** product to existing inventory (use fuzzy matching)
5. **Return ONLY valid JSON** (no markdown, no backticks)

===== COMMON SPEECH RECOGNITION ERRORS TO FIX =====

**ENGLISH ERRORS:**
- "to" → "two" (2) or "too"
- "for" → "four" (4)
- "ate" → "eight" (8)
- "won" → "one" (1)
- "add" → sometimes heard as "at", "ad", "had"
- "sold" → sometimes heard as "old", "soul"
- "soft" → usually means "soap"
- "rice" → sometimes "rise", "rais"
- "battery" → sometimes "batri", "batery"

**TAMIL ERRORS:**
- "230" → Often misheard Tamil number "இரண்டு" (2) or "மூன்று" (3)
- "soft" → Voice recognition mishearing "சோப்" (soap)
- Random numbers → Usually Tamil number words misrecognized
- "to" in Tamil context → Usually "இரண்டு" (2)

**NUMBER MAPPING:**
- Tamil words: ஒன்று=1, இரண்டு=2, மூன்று=3, நான்கு=4, ஐந்து=5, ஆறு=6, ஏழு=7, எட்டு=8, ஒன்பது=9, பத்து=10, இருபது=20, முப்பது=30, நாற்பது=40, ஐம்பது=50
- English words: one=1, two=2, three=3, four=4, five=5, six=6, seven=7, eight=8, nine=9, ten=10

**PRODUCT NAME MAPPING (Tamil → English):**
- சோப், சோப், சோப்பு, soft → "soap"
- அரிசி, அரிச்சி → "rice"
- பால், பாலு → "milk"
- சர்க்கரை → "sugar"
- உப்பு → "salt"
- எண்ணெய் → "oil"
- மசாலா, மசால → "masala"
- பேட்டரி, பட்டரி, batri → "battery"
- டெய்ரி, டைரி, dairy → "diary"
- பிஸ்கட் → "biscuit"

**ACTION WORDS:**
- English: add, plus, put, stock, new → ACTION: "add"
- English: sold, sell, sale, reduce, minus, remove, out → ACTION: "reduce"
- Tamil: சேர், சேர்க்க, போடு, புதிய → ACTION: "add"
- Tamil: விற்பனை, விற்ற, குறை, குறைக்க → ACTION: "reduce"

===== INTELLIGENT CORRECTION EXAMPLES =====

**Example 1 - English with errors:**
Input: "to soft"
Thought: "to" = "two" (2), "soft" = "soap" (common mishearing)
Output: {"action": "reduce", "product": "soap", "quantity": 2, "confidence": "high", "correction": "Corrected 'to soft' to '2 soap sold'", "detectedLanguage": "english"}

**Example 2 - Tamil:**
Input: "இரண்டு சோப் விற்பனை"
Output: {"action": "reduce", "product": "soap", "quantity": 2, "confidence": "high", "correction": "None needed", "detectedLanguage": "tamil"}

**Example 3 - Number mishearing:**
Input: "230"
Thought: Likely voice recognition error for Tamil "இரண்டு" (2). With inventory context showing soap exists, assume "2 soap sold" (most common operation)
Output: {"action": "reduce", "product": "soap", "quantity": 2, "confidence": "medium", "correction": "Assumed '2 soap sold' - voice recognition likely misheard Tamil number", "detectedLanguage": "tamil"}

**Example 4 - Clear English:**
Input: "add five rice"
Output: {"action": "add", "product": "rice", "quantity": 5, "confidence": "high", "correction": "None needed", "detectedLanguage": "english"}

**Example 5 - Clear Tamil:**
Input: "ஐந்து அரிசி சேர்"
Output: {"action": "add", "product": "rice", "quantity": 5, "confidence": "high", "correction": "None needed", "detectedLanguage": "tamil"}

**Example 6 - New product:**
Input: "add ten sugar"
Thought: Sugar not in inventory, create new product
Output: {"action": "add", "product": "sugar", "quantity": 10, "isNew": true, "confidence": "high", "correction": "None needed", "detectedLanguage": "english"}

**Example 7 - Mixed/Unclear:**
Input: "sold for batri"
Thought: "for" = "four" (4), "batri" = "battery"
Output: {"action": "reduce", "product": "battery", "quantity": 4, "confidence": "high", "correction": "Corrected 'for' to '4' and 'batri' to 'battery'", "detectedLanguage": "english"}

**Example 8 - Very unclear:**
Input: "xyz 123"
Thought: Cannot parse meaningfully
Output: {"action": "unknown", "product": "unknown", "quantity": 0, "confidence": "low", "correction": "Could not understand command", "detectedLanguage": "unknown"}

===== MATCHING RULES =====
- **Product matching**: Use fuzzy matching against inventory. If "soap" exists and user says "soft", match to "soap"
- **Default action**: If action unclear, assume "reduce" (sold is most common)
- **Default quantity**: If quantity unclear, use 1
- **New products**: If product not in inventory and command is clear, mark isNew: true
- **Confidence levels**: 
  - "high" = 90%+ sure of interpretation
  - "medium" = 60-90% sure, made reasonable assumptions
  - "low" = < 60% sure, major guessing involved

===== OUTPUT FORMAT (STRICT JSON ONLY) =====

YOU MUST RETURN **ONLY** THIS JSON FORMAT (no markdown, no backticks, no extra text):

{
  "action": "add" or "reduce" or "unknown",
  "product": "product name in English lowercase",
  "quantity": number,
  "confidence": "high" or "medium" or "low",
  "isNew": true or false,
  "correction": "description of any corrections made",
  "detectedLanguage": "english" or "tamil" or "mixed" or "unknown"
}

===== NOW PARSE THIS COMMAND =====
Voice input: "${command}"

Return JSON:`;

      console.log('🧠 Calling Gemini AI...');
      const result = await model.generateContent(enhancedPrompt);
      const response = await result.response;
      const text = response.text();

      console.log('🤖 Gemini raw response:', text);

      // Clean response - remove markdown artifacts
      let cleanText = text.trim();
      cleanText = cleanText.replace(/```json\n?/g, '');
      cleanText = cleanText.replace(/```\n?/g, '');
      cleanText = cleanText.trim();

      // Parse JSON
      try {
        geminiResponse = JSON.parse(cleanText);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        console.error('Raw text:', cleanText);
        throw new Error('AI returned invalid JSON format');
      }

    } catch (geminiError) {
      console.error('❌ Gemini API error:', geminiError.message);

      // Fallback to regex-based parsing
      console.log('🔄 Using fallback parser...');
      geminiResponse = fallbackVoiceParser(command, hasTamilChars, inventoryMap);
    }

    console.log('📊 Parsed command:', geminiResponse);

    // Step 5: Validate confidence level
    if (geminiResponse.confidence === 'low' || geminiResponse.action === 'unknown') {
      return res.json({
        success: false,
        message: 'Could not understand command clearly. Please try again.',
        suggestion: hasTamilChars
          ? 'உதாரணம்: "இரண்டு சோப் விற்பனை" அல்லது "ஐந்து அரிசி சேர்"'
          : 'Examples: "add 5 rice" or "sold 2 soap"',
        parsed: geminiResponse,
        detectedLanguage: geminiResponse.detectedLanguage || 'unknown'
      });
    }

    // Step 6: Execute the inventory operation
    const actionResult = await executeInventoryCommand(
      businessId,
      geminiResponse,
      inventoryMap
    );

    // Step 7: Log activity
    const logType = geminiResponse.action === 'add'
      ? (geminiResponse.isNew ? 'create' : 'add')
      : 'reduce';

    addActivityLog(businessId, {
      type: logType,
      productName: actionResult.productName || geminiResponse.product,
      quantityChange: geminiResponse.action === 'add'
        ? geminiResponse.quantity
        : -geminiResponse.quantity,
      source: 'voice',
      timestamp: new Date(),
      unit: actionResult.unit
    });

    // Step 8: Store undo capability (only for updates, not new products)
    if (!actionResult.created) {
      storeUndoAction(
        businessId,
        actionResult.productId,
        actionResult.productName,
        geminiResponse.action === 'add' ? geminiResponse.quantity : -geminiResponse.quantity,
        'voice'
      );
    }

    // Step 9: Generate success message
    const successMsg = generateSuccessMessage(geminiResponse, actionResult);

    // Step 10: Return comprehensive success response
    return res.json({
      success: true,
      message: successMsg,
      data: {
        action: geminiResponse.action,
        product: geminiResponse.product,
        quantity: geminiResponse.quantity,
        oldQuantity: actionResult.oldQuantity,
        newQuantity: actionResult.newQuantity,
        unit: actionResult.unit,
        created: actionResult.created || false
      },
      confidence: geminiResponse.confidence,
      correction: geminiResponse.correction,
      detectedLanguage: geminiResponse.detectedLanguage,
      activityLogs: activityLogs.get(businessId) || [],
      hasUndoAction: undoActions.has(businessId)
    });

  } catch (error) {
    console.error('💥 Voice command fatal error:', error);

    return res.status(500).json({
      success: false,
      message: 'Voice command processing failed',
      error: error.message,
      suggestion: 'Please try speaking more clearly, or check if Gemini API key is configured',
      timestamp: new Date().toISOString()
    });
  }
};

// ===== HELPER FUNCTIONS =====

/**
 * Fallback parser when Gemini AI fails
 * Uses regex patterns to extract action, product, and quantity
 */
function fallbackVoiceParser(command, isTamil, inventoryMap) {
  console.log('🔄 Fallback parser activated for:', command);

  const cleanCmd = command.toLowerCase().trim();

  // Tamil number word mappings
  const tamilNumberMap = {
    'ஒன்று': 1, 'இரண்டு': 2, 'மூன்று': 3, 'நான்கு': 4, 'ஐந்து': 5,
    'ஆறு': 6, 'ஏழு': 7, 'எட்டு': 8, 'ஒன்பது': 9, 'பத்து': 10,
    'பதினொன்று': 11, 'பன்னிரண்டு': 12, 'இருபது': 20, 'முப்பது': 30, 'நாற்பது': 40, 'ஐம்பது': 50
  };

  // Tamil product mappings
  const tamilProductMap = {
    'சோப்': 'soap', 'சோப': 'soap', 'சோப்பு': 'soap', 'soft': 'soap',
    'அரிசி': 'rice', 'அரிச்சி': 'rice',
    'பால்': 'milk', 'பாலு': 'milk',
    'சர்க்கரை': 'sugar',
    'உப்பு': 'salt',
    'எண்ணெய்': 'oil',
    'மசாலா': 'masala', 'மசால': 'masala',
    'பேட்டரி': 'battery', 'பட்டரி': 'battery', 'batri': 'battery',
    'டெய்ரி': 'diary', 'டைரி': 'diary', 'dairy': 'diary',
    'பிஸ்கட்': 'biscuit'
  };

  // English common errors
  const englishErrorMap = {
    'to': '2', 'too': '2',
    'for': '4', 'fore': '4',
    'ate': '8', 'eight': '8',
    'won': '1', 'one': '1'
  };

  // Pattern matching
  const patterns = [
    // Tamil: "இரண்டு சோப் விற்பனை"
    { regex: /(ஒன்று|இரண்டு|மூன்று|நான்கு|ஐந்து|ஆறு|ஏழு|எட்டு|ஒன்பது|பத்து|\d+)\s*(சோப்|சோப்பு|அரிசி|பால்|சர்க்கரை|உப்பு|எண்ணெய்|மசாலா|பேட்டரி|டெய்ரி|பிஸ்கட்|soft)\s*(விற்பனை|விற்ற|sold)/i, action: 'reduce', lang: 'tamil' },
    { regex: /(ஒன்று|இரண்டு|மூன்று|நான்கு|ஐந்து|ஆறு|ஏழு|எட்டு|ஒன்பது|பத்து|\d+)\s*(சோப்|சோப்பு|அரிசி|பால்|சர்க்கரை|உப்பு|எண்ணெய்|மசாலா|பேட்டரி|டெய்ரி|பிஸ்கட்|soft)\s*(சேர்|சேர்க்க|போடு|add)/i, action: 'add', lang: 'tamil' },

    // English: "add 5 rice", "sold 2 soap"
    { regex: /(add|plus|put|stock)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|to|for|ate)\s+(\w+)/i, action: 'add', lang: 'english' },
    { regex: /(sold|sell|sale|reduce|minus|remove)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|to|for|ate)\s+(\w+)/i, action: 'reduce', lang: 'english' },

    // Reverse: "2 soap sold", "5 rice add"
    { regex: /(\d+|one|two|three|four|five|six|seven|eight|nine|ten|to|for|ate)\s+(\w+)\s+(sold|sell|sale|reduce)/i, action: 'reduce', lang: 'english' },
    { regex: /(\d+|one|two|three|four|five|six|seven|eight|nine|ten|to|for|ate)\s+(\w+)\s+(add|plus|put)/i, action: 'add', lang: 'english' },

    // Just number and product: "2 soap" (assume sold)
    { regex: /^(\d+|one|two|three|four|five|six|seven|eight|nine|ten|to|for|ate)\s+(\w+)$/i, action: 'reduce', lang: 'english' },
  ];

  for (const pattern of patterns) {
    const match = cleanCmd.match(pattern.regex);

    if (match) {
      let quantity = 1;
      let product = 'unknown';
      let correction = '';

      if (pattern.lang === 'tamil') {
        // Parse Tamil
        const numWord = match[1];
        quantity = tamilNumberMap[numWord] || parseInt(numWord) || 1;

        const tamilProduct = match[2];
        product = tamilProductMap[tamilProduct] || tamilProduct;

        correction = `Parsed Tamil command: ${numWord} (${quantity}) ${tamilProduct} (${product})`;

      } else {
        // Parse English
        let numWord = match[2] || match[1];

        // Fix common errors
        if (englishErrorMap[numWord]) {
          correction = `Corrected '${numWord}' to '${englishErrorMap[numWord]}'`;
          numWord = englishErrorMap[numWord];
        }

        quantity = parseInt(numWord) || 1;
        product = (match[3] || match[2] || '').trim().toLowerCase();

        // Fix product name errors
        if (product === 'soft') {
          correction += ` | Corrected 'soft' to 'soap'`;
          product = 'soap';
        }
      }

      return {
        action: pattern.action,
        product: product,
        quantity: quantity,
        confidence: 'medium',
        isNew: !inventoryMap[product],
        correction: correction || 'Parsed with fallback regex',
        detectedLanguage: pattern.lang
      };
    }
  }

  // Last resort: if just a number, assume it's "X soap sold"
  const justNumber = cleanCmd.match(/^(\d+)$/);
  if (justNumber) {
    return {
      action: 'reduce',
      product: 'soap',
      quantity: parseInt(justNumber[1]),
      confidence: 'low',
      isNew: false,
      correction: 'Assumed "soap sold" from lone number (common voice error)',
      detectedLanguage: 'unknown'
    };
  }

  // Complete failure
  return {
    action: 'unknown',
    product: 'unknown',
    quantity: 0,
    confidence: 'low',
    isNew: false,
    correction: 'Could not parse command with any pattern',
    detectedLanguage: 'unknown'
  };
}

/**
 * Execute inventory database operation
 */
async function executeInventoryCommand(businessId, command, inventoryMap) {
  const productName = command.product.toLowerCase();
  const quantityChange = command.action === 'add' ? command.quantity : -command.quantity;

  // Find existing product with fuzzy matching
  let product = inventoryMap[productName];

  if (!product) {
    // Try partial match
    product = Object.values(inventoryMap).find(item =>
      item.productName.toLowerCase().includes(productName) ||
      productName.includes(item.productName.toLowerCase())
    );
  }

  // CREATE NEW PRODUCT if doesn't exist
  if (!product) {
    console.log(`🆕 Creating new product: ${command.product}`);

    if (isMongoConnected()) {
      const newItem = new InventoryItem({
        businessId,
        productName: command.product.charAt(0).toUpperCase() + command.product.slice(1), // Capitalize
        quantity: command.action === 'add' ? command.quantity : 0,
        unit: 'piece',
        minStockLevel: 5
      });
      await newItem.save();

      return {
        productId: newItem._id,
        productName: newItem.productName,
        oldQuantity: 0,
        newQuantity: newItem.quantity,
        unit: 'piece',
        created: true
      };
    } else {
      const newItem = MemoryDatabase.createInventoryItem({
        businessId,
        productName: command.product.charAt(0).toUpperCase() + command.product.slice(1),
        quantity: command.action === 'add' ? command.quantity : 0,
        unit: 'piece',
        minStockLevel: 5
      });

      return {
        productId: newItem._id,
        productName: newItem.productName,
        oldQuantity: 0,
        newQuantity: newItem.quantity,
        unit: 'piece',
        created: true
      };
    }
  }

  // UPDATE EXISTING PRODUCT
  console.log(`📝 Updating existing product: ${product.productName}`);

  const oldQuantity = product.quantity;
  const newQuantity = Math.max(0, oldQuantity + quantityChange);

  if (isMongoConnected()) {
    await InventoryItem.findByIdAndUpdate(
      product._id,
      { quantity: newQuantity, updatedAt: new Date() }
    );
  } else {
    const memoryDb = MemoryDatabase.getInstance();
    const inventory = memoryDb.get('inventory') || [];
    const index = inventory.findIndex(item => item._id === product._id);
    if (index !== -1) {
      inventory[index].quantity = newQuantity;
      inventory[index].updatedAt = new Date();
      memoryDb.set('inventory', inventory);
    }
  }

  return {
    productId: product._id,
    productName: product.productName,
    oldQuantity,
    newQuantity,
    unit: product.unit || 'piece',
    created: false
  };
}

/**
 * Generate user-friendly success message
 */
function generateSuccessMessage(command, result) {
  const emoji = command.action === 'add' ? '📥' : '📤';
  const action = command.action === 'add' ? 'added to' : 'sold from';

  let message = `${emoji} ${command.quantity} ${command.product} ${action} inventory`;

  if (result.created) {
    message = `${emoji} Created new product: ${command.product} (${command.quantity} ${result.unit})`;
  } else {
    message += `\nStock: ${result.oldQuantity} → ${result.newQuantity} ${result.unit}`;
  }

  if (command.correction && command.correction !== 'None needed') {
    message += `\n💡 ${command.correction}`;
  }

  return message;
}

// Get activity logs for business
exports.getActivityLogs = async (req, res) => {
  try {
    const businessId = req.user.id;
    const logs = activityLogs.get(businessId) || [];

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get activity logs',
      error: error.message
    });
  }
};

// Undo last inventory action
exports.undoLastAction = async (req, res) => {
  try {
    const businessId = req.user.id;
    const undoAction = undoActions.get(businessId);

    if (!undoAction) {
      return res.status(400).json({
        success: false,
        message: 'No action to undo'
      });
    }

    // Check if undo action is too old (more than 5 minutes)
    const now = new Date();
    const timeDiff = now - undoAction.timestamp;
    if (timeDiff > 5 * 60 * 1000) { // 5 minutes in milliseconds
      undoActions.delete(businessId);
      return res.status(400).json({
        success: false,
        message: 'Undo action expired (more than 5 minutes old)'
      });
    }

    // Perform undo
    if (isMongoConnected()) {
      const item = await InventoryItem.findOne({ _id: undoAction.productId, businessId });
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Product not found for undo'
        });
      }

      const newQuantity = Math.max(0, item.quantity + undoAction.quantityDelta);
      item.quantity = newQuantity;
      await item.save();

      // Add undo activity log
      addActivityLog(businessId, {
        type: 'undo',
        productName: item.productName,
        quantityChange: undoAction.quantityDelta,
        source: 'undo',
        timestamp: new Date(),
        unit: item.unit
      });

    } else {
      // Memory database
      const item = MemoryDatabase.findInventoryById(undoAction.productId, businessId);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Product not found for undo'
        });
      }

      const newQuantity = Math.max(0, item.quantity + undoAction.quantityDelta);
      MemoryDatabase.updateInventoryItem(undoAction.productId, businessId, { quantity: newQuantity });

      // Add undo activity log
      addActivityLog(businessId, {
        type: 'undo',
        productName: item.productName,
        quantityChange: undoAction.quantityDelta,
        source: 'undo',
        timestamp: new Date(),
        unit: item.unit
      });
    }

    // Clear undo action after use
    undoActions.delete(businessId);

    res.json({
      success: true,
      message: `Undid action for ${undoAction.productName}`,
      data: {
        productName: undoAction.productName,
        quantityChange: undoAction.quantityDelta
      },
      activityLogs: activityLogs.get(businessId) || [],
      hasUndoAction: false
    });

  } catch (error) {
    console.error('Error undoing action:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to undo action',
      error: error.message
    });
  }
};