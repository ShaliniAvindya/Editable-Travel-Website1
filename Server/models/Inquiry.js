const mongoose = require('mongoose');

const InquirySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  message: String,
  replyMessage: String, // New field to store reply message
  submitted_at: {
    type: Date,
    default: Date.now,
  },
  phone_number: String,
  entity: {
    $oid: {
      type: String,
      required: true,
    },
  },
  entityType: {
    type: String,
    enum: ['Package', 'Activity', 'Custom', 'Accommodation', 'Contact'],
    required: true,
  },
  from_date: Date,
  to_date: Date,
  children: [Number],
  travellers: Number,
  country: String,
  buttonType: {
    type: String,
    enum: ['bookNow', 'whatsapp'],
    required: true,
  },
  title: String,
  resortName: String,
  roomName: String,
}, { timestamps: true });

InquirySchema.set('toJSON', {
  transform: (doc, ret) => {
    if (ret._id) {
      ret._id = { $oid: ret._id.toString() };
    }
    if (ret.entity && ret.entity.$oid) {
      ret.entity = { $oid: ret.entity.$oid };
    }
    if (ret.submitted_at) {
      ret.submitted_at = { $date: ret.submitted_at.toISOString() };
    }
    if (ret.createdAt) {
      ret.createdAt = { $date: ret.createdAt.toISOString() };
    }
    if (ret.updatedAt) {
      ret.updatedAt = { $date: ret.updatedAt.toISOString() };
    }
    if (ret.from_date) {
      ret.from_date = { $date: ret.from_date.toISOString() };
    }
    if (ret.to_date) {
      ret.to_date = { $date: ret.to_date.toISOString() };
    }
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Inquiry', InquirySchema);