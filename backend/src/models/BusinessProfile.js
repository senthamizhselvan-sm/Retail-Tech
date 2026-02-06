const mongoose = require('mongoose');

const businessProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  shopName: {
    type: String,
    required: true,
    trim: true
  },
  vendorType: {
    type: String,
    enum: ['kirana', 'clothing', 'electronics', 'food_beverages', 'general_store', 'other'],
    required: true
  },
  // Address Information
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pinCode: { type: String, default: '' }
  },
  // Contact Details
  phoneNumber: { type: String, default: '' },
  whatsappNumber: { type: String, default: '' },
  email: { type: String, default: '' },
  
  // Business Hours
  operatingDays: {
    monday: { type: Boolean, default: true },
    tuesday: { type: Boolean, default: true },
    wednesday: { type: Boolean, default: true },
    thursday: { type: Boolean, default: true },
    friday: { type: Boolean, default: true },
    saturday: { type: Boolean, default: true },
    sunday: { type: Boolean, default: false }
  },
  businessHours: {
    openingTime: { type: String, default: '09:00' },
    closingTime: { type: String, default: '21:00' },
    is24x7: { type: Boolean, default: false }
  },
  
  // Shop Branding
  logoUrl: { type: String, default: '' },
  shopPhotoUrl: { type: String, default: '' },
  
  // Additional Details
  shopDescription: { type: String, maxlength: 200, default: '' },
  establishedYear: { 
    type: Number, 
    min: [1800, 'Established year must be 1800 or later'],
    max: [new Date().getFullYear(), 'Established year cannot be in the future'],
    validate: {
      validator: function(value) {
        // Allow undefined/null values
        return value === undefined || value === null || (value >= 1800 && value <= new Date().getFullYear());
      },
      message: 'Please enter a valid established year between 1800 and current year'
    }
  },
  gstNumber: { type: String, default: '' },
  
  // System fields
  preferredLanguage: {
    type: String,
    enum: ['ta', 'en', 'hi'],
    default: 'en'
  },
  themeColor: {
    type: String,
    default: '#3B82F6'
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

// Update the updatedAt field before saving
businessProfileSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('BusinessProfile', businessProfileSchema);
