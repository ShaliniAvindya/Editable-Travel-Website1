const mongoose = require('mongoose');

const NewsletterCampaignSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  footer: { type: String },
  images: [{ type: String }],
  titleAlign: { type: String, enum: ['left','center','right','justify'], default: 'left' },
  scheduled_at: { type: Date },
  sent_at: { type: Date },
  status: { type: String, enum: ['draft','scheduled','sent','cancelled'], default: 'draft' },
  recipients_count: { type: Number, default: 0 },
  recipients: {
    type: {
      type: String,
      enum: ['all','selected','lists','custom'],
      default: 'all'
    },
    selectedIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Newsletter' }],
    listIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'List' }],
    customEmails: [String]
  },
  created_by: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('NewsletterCampaign', NewsletterCampaignSchema);
