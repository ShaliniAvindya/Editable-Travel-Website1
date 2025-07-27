const mongoose = require('mongoose');

const PackageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  description: String,
  included_items: [String],
  excluded_items: [String],
  resort: String,
  activities: [String], // or use ObjectId if referencing Activity collection
  images: [String],
  expiry_date: Date,
  nights: Number
}, { timestamps: true });

module.exports = mongoose.model('Package', PackageSchema);
