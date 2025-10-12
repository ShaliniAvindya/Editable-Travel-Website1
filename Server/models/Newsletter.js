const mongoose = require('mongoose');

const NewsletterSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['subscribed', 'unsubscribed'],
    default: 'subscribed',
  },
  language: {
    type: String,
    default: 'en',
  },
  subscribed_at: {
    type: Date,
    default: Date.now,
  },
  unsubscribed_at: Date,
}, { timestamps: true });

NewsletterSchema.set('toJSON', {
  transform: (doc, ret) => {
    if (ret._id) ret._id = { $oid: ret._id.toString() };
    if (ret.createdAt) ret.createdAt = { $date: ret.createdAt.toISOString() };
    if (ret.updatedAt) ret.updatedAt = { $date: ret.updatedAt.toISOString() };
    if (ret.subscribed_at) ret.subscribed_at = { $date: ret.subscribed_at.toISOString() };
    if (ret.unsubscribed_at) ret.unsubscribed_at = { $date: ret.unsubscribed_at.toISOString() };
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Newsletter', NewsletterSchema);
