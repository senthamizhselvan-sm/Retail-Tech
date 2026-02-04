const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { protect } = require('../middleware/auth');

// ============================================
// PROTECTED ROUTES (require authentication)
// ============================================
router.use(protect);

// Voice command processing - MUST be before /:id routes
router.post('/voice-command', inventoryController.processVoiceCommand);

// Activity logs - MUST be before /:id routes
router.get('/activity-logs', inventoryController.getActivityLogs);

// Undo last action - MUST be before /:id routes
router.post('/undo', inventoryController.undoLastAction);

// Low stock alerts - MUST be before /:id routes
router.get('/alerts', inventoryController.getLowStockAlerts);

// Inventory insights - MUST be before /:id routes
router.get('/insights', inventoryController.getInventoryInsights);

// Get all inventory items
router.get('/', inventoryController.getInventory);

// Add new product
router.post('/', inventoryController.addProduct);

// Update product details (PATCH for partial updates)
router.patch('/:id', inventoryController.updateProduct);

// Update product quantity (PUT for quantity changes)
router.put('/:id', inventoryController.updateQuantity);

// Delete product
router.delete('/:id', inventoryController.deleteProduct);

module.exports = router;