const mongoose = require('mongoose');

const PromotionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  imageUrl: {
    type: String,
    trim: true,
  },
  validFrom: {
    type: Date,
    required: true,
  },
  validUntil: {
    type: Date,
    required: true,
  },
  isPopup: {
    type: Boolean,
    default: false,
  },
  buttonText: {
    type: String,
    trim: true,
    default: 'Claim Offer',
  },
  buttonLink: {
    type: String,
    trim: true,
    default: '#',
  },
  countdownLabel: {
    type: String,
    trim: true,
    default: 'LIMITED TIME OFFER',
  },
  trustIndicator1: {
    type: String,
    trim: true,
    default: 'Secure Booking',
  },
  trustIndicator2: {
    type: String,
    trim: true,
    default: 'Instant Confirmation',
  },
  status: {
    type: Boolean,
    default: true, 
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Promotion', PromotionSchema);
