const mongoose = require('mongoose');

const customerQuerySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  questionType: {
    type: String,
    enum: ['price', 'availability', 'discount', 'delivery', 'quality', 'general'],
    required: true
  },
  count: {
    type: Number,
    default: 1
  },
  lastAskedAt: {
    type: Date,
    default: Date.now
  },
  responseTemplate: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    enum: ['en', 'ta', 'hi'],
    default: 'en'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient queries
customerQuerySchema.index({ userId: 1, questionType: 1 });
customerQuerySchema.index({ userId: 1, lastAskedAt: -1 });

module.exports = mongoose.model('CustomerQuery', customerQuerySchema);
