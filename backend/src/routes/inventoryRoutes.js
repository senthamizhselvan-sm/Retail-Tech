const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const inventoryController = require('../controllers/inventoryController');

// All inventory routes require authentication
router.use(protect);

// POST /api/inventory - Add a new product
router.post('/', inventoryController.addProduct);

// GET /api/inventory - Get all inventory items
router.get('/', inventoryController.getInventory);

// GET /api/inventory/alerts - Get low stock alerts
router.get('/alerts', inventoryController.getLowStockAlerts);

// GET /api/inventory/insights - Get inventory insights
router.get('/insights', inventoryController.getInventoryInsights);

// POST /api/inventory/voice-command - Process voice command
router.post('/voice-command', inventoryController.processVoiceCommand);

// GET /api/inventory/activity-logs - Get activity logs
router.get('/activity-logs', inventoryController.getActivityLogs);

// POST /api/inventory/undo - Undo last inventory action
router.post('/undo', inventoryController.undoLastAction);

// NEW: Basket-specific endpoints
// POST /api/inventory/basket - Process basket action (delivery/sale)
router.post('/basket', inventoryController.processBasketAction);

// POST /api/inventory/basket/convert - Convert basket to inventory updates
router.post('/basket/convert', inventoryController.convertBasketToUpdate);

// PUT /api/inventory/:id - Update product quantity
router.put('/:id', inventoryController.updateQuantity);

// PATCH /api/inventory/:id - Update product details including pricing
router.patch('/:id', inventoryController.updateProduct);

// DELETE /api/inventory/:id - Delete a product
router.delete('/:id', inventoryController.deleteProduct);

module.exports = router;
