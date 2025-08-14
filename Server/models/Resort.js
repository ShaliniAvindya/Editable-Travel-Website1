const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  price_per_night: {
    type: String,
    default: null,
    required: false,
  },
  capacity: {
    adults: {
      type: Number, // Changed to Number
      required: true
    },
    children: {
      type: Number, // Changed to Number
      required: true
    },
  },
  amenities: {
    type: [String],
    default: []
  },
  images: {
    type: [String],
    default: []
  },
  description: {
    type: String,
    default: ''
  },
  size_sqm: {
    type: Number,
    required: true
  }
}); // Remove _id generation for rooms

const ResortSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  island: {
    type: String,
    required: true
  },
  atoll: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Atoll',
    required: true
  },
  description: {
    type: String
  },
  amenities: {
    type: [String],
    default: []
  },
  rooms: [RoomSchema],
  images: {
    type: [String],
    default: []
  },
  contact: {
    whatsapp: {
      type: String
    },
    email: {
      type: String
    }
  },
  cover_images: {
    type: [String],
    default: []
  },
  type: {
    type: String,
    required: true,
    enum: ['hotel', 'resort', 'adventure']
  },
  status: {
    type: Boolean,
    default: true 
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Resort', ResortSchema);

