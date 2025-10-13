const mongoose = require('mongoose');

const ListSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  is_public: { type: Boolean, default: false },
  language: { type: String, default: '' },
  subscribers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Newsletter' }],
  created_by: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('List', ListSchema);
