const mongoose = require('mongoose');

const dailyInsightSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true
  },
  insightText: {
    type: String,
    required: true
  },
  insightType: {
    type: String,
    enum: ['weekday', 'festival', 'weather', 'seasonal', 'general'],
    required: true
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['stock', 'visibility', 'psychology', 'timing'],
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient queries
dailyInsightSchema.index({ userId: 1, date: 1 });
dailyInsightSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('DailyInsight', dailyInsightSchema);
