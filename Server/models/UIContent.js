const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  name: { type: String, required: true },
  text: { type: String, required: true },
  date: { type: String, required: true },
  avatar: { type: String, required: true },
});

const sectionSchema = new mongoose.Schema({
  sectionId: { type: String, required: true },
  type: { type: String, required: true, enum: ['hero', 'text', 'googleReviews', 'contact', 'social', 'image'] },
  content: {
    title: { type: String },
    description: { type: String },
    imageUrl: { type: String },
    buttonText: { type: String },
    buttonLink: { type: String },
    slides: [{
      title: { type: String },
      description: { type: String },
      imageUrl: { type: String },
      buttonText: { type: String },
      buttonLink: { type: String },
    }],
    reviews: [reviewSchema],
    phone: { type: String },
    phoneLabel: { type: String },
    email: { type: String },
    emailLabel: { type: String },
    address: { type: String },
    addressLabel: { type: String },
  facebook: { type: String },
  instagram: { type: String },
  twitter: { type: String },
  youtube: { type: String }, 
  tiktok: { type: String }, 
  youtube: { type: String },
  tiktok: { type: String },
  },
});

const uiContentSchema = new mongoose.Schema({
  pageId: { type: String, required: true, unique: true },
  sections: [sectionSchema],
}, { timestamps: true });

module.exports = mongoose.model('UIContent', uiContentSchema);
