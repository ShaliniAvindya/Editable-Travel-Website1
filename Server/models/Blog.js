const mongoose = require('mongoose');

const BlogContentSchema = new mongoose.Schema({
  heading: String,
  image: String,
  text: String
}, { _id: false });

const BlogSchema = new mongoose.Schema({
  status: {
    type: Boolean,
    default: true
  },
  title: {
    type: String,
    required: true
  },
  publish_date: {
    type: Date,
    required: true
  },
  content: [BlogContentSchema],
  images: [String],
  videos: [String],
  tags: [String],
  author: String
}, { timestamps: true });

module.exports = mongoose.model('Blog', BlogSchema);
