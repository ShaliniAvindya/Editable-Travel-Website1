const mongoose = require('mongoose');

const BlogContentSchema = new mongoose.Schema({
  heading: String,
  image: String,
  text: String,
  blockType: String,
  blockData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
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
  author: String,
  theme: {
    type: mongoose.Schema.Types.Mixed,
    default: {
      name: 'Default',
      primaryColor: '#074a5b',
      secondaryColor: '#3B82F6',
      accentColor: '#F97316',
      backgroundColor: '#FFFFFF',
      textColor: '#1F2937',
      borderRadius: '8px',
      fontFamily: '"Comic Sans MS", "Comic Neue"'
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Blog', BlogSchema);
