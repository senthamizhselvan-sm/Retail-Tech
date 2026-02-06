const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Business ID is required'],
    index: true
  },
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  category: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    default: 0,
    min: [0, 'Quantity cannot be negative']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    enum: ['kg', 'packet', 'piece', 'liter', 'box', 'dozen', 'gram'],
    trim: true
  },
  minStockLevel: {
    type: Number,
    default: 5,
    min: [0, 'Minimum stock level cannot be negative']
  },
  expiryDate: {
    type: Date
  },
  // Pricing fields added for AI-based offer planning.
  // Optional to maintain backward compatibility.
  costPrice: {
    type: Number,
    default: null
  },
  sellingPrice: {
    type: Number,
    default: null
  },
  mrp: {
    type: Number,
    default: null
  },
  lastPriceUpdatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
inventoryItemSchema.index({ businessId: 1, productName: 1 });
inventoryItemSchema.index({ businessId: 1, quantity: 1 });

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
