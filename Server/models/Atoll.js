const mongoose = require('mongoose');

const AtollSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  mainImage: {
    type: String
  },
  media: {
    type: [String],
    default: []
  },
  accommodations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resort'
  }],
  amenities: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Atoll', AtollSchema);
