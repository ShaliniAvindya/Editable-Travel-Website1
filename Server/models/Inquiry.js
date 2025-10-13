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
    enum: ['Package', 'Activity', 'Accommodation', 'Contact', 'Adventure'],
    required: true,
  },
  inquiry_form_type: {
    type: String,
    enum: ['Accommodation', 'Adventure', 'Activity'],
  },
  from_date: Date,
  to_date: Date,
  adults: {
    type: Number,
    min: 0,
  },
  children: {
    type: Number,
    min: 0,
  },
  infants: {
    type: Number,
    min: 0,
  },
  travellers: Number,
  number_of_rooms: {
    type: Number,
    min: 0,
  },
  // For hotel/resort activity
  selectedActivities: [{ type: String }],
  // Adventure specific fields
  preferredMonth: String,
  preferredYear: Number,
  adventureOptions: [{ type: String }],
  adventureOption: String,
  participants: [
    {
      name: String,
      gender: String,
      diverStatus: String,
      ageCategory: String,
    },
  ],
  participantsByOption: [
    {
      option: String,
      participants: [
        {
          name: String,
          gender: String,
          diverStatus: String,
          ageCategory: String,
        },
      ],
    },
  ],
  bookWholeBoat: {
    type: Boolean,
    default: false,
  },
  divers_adults: { type: Number, min: 0 },
  divers_children: { type: Number, min: 0 },
  nondivers_adults: { type: Number, min: 0 },
  nondivers_children: { type: Number, min: 0 },
  nondivers_infants: { type: Number, min: 0 },
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
