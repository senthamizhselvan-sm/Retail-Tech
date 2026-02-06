const mongoose = require('mongoose');

const salesReflectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true
  },
  salesLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true
  },
  salesRating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  aiSuggestion: {
    type: String,
    required: true
  },
  factors: [{
    type: String,
    enum: ['weather', 'festival', 'competition', 'stock', 'timing', 'other']
  }],
  mood: {
    type: String,
    enum: ['disappointed', 'neutral', 'satisfied', 'excited'],
    default: 'neutral'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient queries
salesReflectionSchema.index({ userId: 1, date: 1 }, { unique: true });
salesReflectionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('SalesReflection', salesReflectionSchema);
