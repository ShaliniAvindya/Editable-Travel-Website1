const mongoose = require('mongoose');

const ActivitySiteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  image: {
    type: String
  },
  atoll_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Atoll',
    required: true
  }
});

const ActivitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  tags: {
    type: [String],
    default: []
  },
  media: {
    type: [String],
    default: []
  },
  available_in_all_atolls: {
    type: Boolean,
    default: false
  },
  available_atoll_ids: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Atoll'
    }
  ],
  price: {
    type: Number,
    required: true
  },
  activity_sites: [ActivitySiteSchema]
}, { timestamps: true });

module.exports = mongoose.model('Activity', ActivitySchema);
