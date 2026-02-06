const mongoose = require('mongoose');

const growthProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  stage: {
    type: String,
    enum: ['starter', 'growing', 'established', 'pro'],
    default: 'starter'
  },
  completedActions: [{
    actionType: {
      type: String,
      enum: ['profile_setup', 'first_insight', 'price_comparison', 'sales_reflection', 'brand_setup', 'customer_template']
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  }],
  totalScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  badges: [{
    badgeType: {
      type: String,
      enum: ['consistent_user', 'price_tracker', 'brand_builder', 'reflection_master', 'growth_focused']
    },
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  weeklyGoals: [{
    goalType: {
      type: String,
      enum: ['daily_check', 'price_update', 'reflection_entry', 'brand_consistency']
    },
    targetCount: {
      type: Number,
      default: 7
    },
    currentCount: {
      type: Number,
      default: 0
    },
    weekStart: {
      type: Date,
      required: true
    }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Update lastUpdated before saving
growthProgressSchema.pre('save', function(next) {
  this.lastUpdated = Date.now();
  
  // Calculate total score based on completed actions
  this.totalScore = Math.min(this.completedActions.length * 10, 100);
  
  // Determine stage based on score
  if (this.totalScore >= 80) {
    this.stage = 'pro';
  } else if (this.totalScore >= 60) {
    this.stage = 'established';
  } else if (this.totalScore >= 30) {
    this.stage = 'growing';
  } else {
    this.stage = 'starter';
  }
  
  next();
});

module.exports = mongoose.model('GrowthProgress', growthProgressSchema);
