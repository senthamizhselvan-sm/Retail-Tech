const mongoose = require('mongoose');

const competitorPriceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  competitorPrice: {
    type: Number,
    required: true,
    min: 0
  },
  yourPrice: {
    type: Number,
    required: true,
    min: 0
  },
  competitorName: {
    type: String,
    required: true,
    trim: true
  },
  comparisonResult: {
    type: String,
    enum: ['lower', 'same', 'higher'],
    required: true
  },
  priceDifference: {
    type: Number,
    default: 0
  },
  percentageDifference: {
    type: Number,
    default: 0
  },
  aiAdvice: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate comparison result and differences before saving
competitorPriceSchema.pre('save', function(next) {
  // Calculate price difference
  this.priceDifference = Math.abs(this.yourPrice - this.competitorPrice);
  
  // Calculate percentage difference
  this.percentageDifference = ((this.priceDifference / this.competitorPrice) * 100);
  
  // Determine comparison result
  if (this.yourPrice < this.competitorPrice) {
    this.comparisonResult = 'lower';
  } else if (this.yourPrice === this.competitorPrice) {
    this.comparisonResult = 'same';
  } else {
    this.comparisonResult = 'higher';
  }
  
  this.updatedAt = Date.now();
  next();
});

// Compound index for efficient queries
competitorPriceSchema.index({ userId: 1, productName: 1 });
competitorPriceSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('CompetitorPrice', competitorPriceSchema);
