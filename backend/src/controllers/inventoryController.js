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

// Update product quantity (with delta)
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

// Process voice command using Gemini
exports.processVoiceCommand = async (req, res) => {
  try {
    const { command } = req.body;
    const businessId = req.user.id;

    if (!command || !command.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Voice command is required'
      });
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are an inventory assistant for a small shop.

Convert the following sentence into JSON.

Rules:
- action must be one of: add, reduce
- productName should be a simple noun (remove articles like "the", "a")
- quantity must be a number
- If information is missing, return null

Sentence:
"${command}"

Return ONLY valid JSON:
{
  "action": "add | reduce",
  "productName": "string",
  "quantity": number
}`;

    console.log('🎙️ Processing voice command with Gemini:', command);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('🤖 Gemini response:', text);

    // Parse JSON response
    let parsedCommand;
    try {
      // Clean the response and extract JSON
      const jsonMatch = text.match(/\{[^}]+\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      parsedCommand = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      return res.status(400).json({
        success: false,
        message: 'Could not understand the voice command'
      });
    }

    if (!parsedCommand || !parsedCommand.action || !parsedCommand.productName || !parsedCommand.quantity) {
      return res.status(400).json({
        success: false,
        message: 'Incomplete command. Try: "sold 5 rice" or "add 10 sugar"'
      });
    }

    // Find matching product
    let matchingProduct;
    
    if (isMongoConnected()) {
      matchingProduct = await InventoryItem.findOne({
        businessId,
        productName: { $regex: new RegExp(parsedCommand.productName, 'i') }
      });
    } else {
      // Memory database
      const memoryDb = MemoryDatabase.getInstance();
      const inventory = memoryDb.get('inventory') || [];
      matchingProduct = inventory.find(item => 
        item.businessId === businessId && 
        item.productName.toLowerCase().includes(parsedCommand.productName.toLowerCase())
      );
    }

    if (!matchingProduct) {
      return res.status(404).json({
        success: false,
        message: `Product "${parsedCommand.productName}" not found in inventory`
      });
    }

    // Calculate delta
    const delta = parsedCommand.action === 'add' ? parsedCommand.quantity : -parsedCommand.quantity;
    const newQuantity = Math.max(0, matchingProduct.quantity + delta);

    // Update inventory with activity logging
    if (isMongoConnected()) {
      await InventoryItem.findByIdAndUpdate(
        matchingProduct._id,
        { 
          quantity: newQuantity,
          lastUpdated: new Date()
        }
      );
    } else {
      // Memory database update
      const memoryDb = MemoryDatabase.getInstance();
      const inventory = memoryDb.get('inventory') || [];
      const index = inventory.findIndex(item => item._id === matchingProduct._id);
      if (index !== -1) {
        inventory[index].quantity = newQuantity;
        inventory[index].lastUpdated = new Date();
        memoryDb.set('inventory', inventory);
      }
    }

    // Add activity log for voice command
    const actionType = delta > 0 ? 'add' : 'reduce';
    addActivityLog(businessId, {
      type: actionType,
      productName: matchingProduct.productName,
      quantityChange: delta,
      source: 'voice',
      timestamp: new Date(),
      unit: matchingProduct.unit
    });

    // Store undo action
    storeUndoAction(businessId, matchingProduct._id, matchingProduct.productName, delta, 'voice');

    console.log(`✅ Updated ${matchingProduct.productName}: ${delta > 0 ? '+' : ''}${delta} = ${newQuantity}`);

    res.json({
      success: true,
      message: `Updated ${matchingProduct.productName}: ${delta > 0 ? '+' : ''}${delta}`,
      data: {
        productName: matchingProduct.productName,
        oldQuantity: matchingProduct.quantity,
        delta: delta,
        newQuantity: newQuantity,
        unit: matchingProduct.unit
      },
      activityLogs: activityLogs.get(businessId) || [],
      hasUndoAction: undoActions.has(businessId)
    });

  } catch (error) {
    console.error('Error processing voice command:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process voice command',
      error: error.message
    });
  }
};

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