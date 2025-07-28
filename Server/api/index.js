const express = require('express');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Import routes (ensure these are correct relative paths)
const userRoutes = require('../routes/userRoutes');
const resortRoutes = require('../routes/resortRoutes');
const packageRoutes = require('../routes/packageRoutes');
const activityRoutes = require('../routes/activityRoutes');
const blogRoutes = require('../routes/blogRoutes');
const atollRoutes = require('../routes/atollRoutes');
const inquiryRoutes = require('../routes/inquiryRoutes');
const uiContentRoutes = require('../routes/uiContentRoutes');
const promotionRoutes = require('../routes/promotionRoutes');

const app = express();

// ✅ CORS Setup: Allow frontend and backend Vercel URLs
const allowedOrigins = [
  'https://editable-travel-website1.vercel.app',
  'https://editable-travel-website1-rpfv.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

// Body parsers
app.use(bodyParser.json());
app.use(express.json());

// ✅ Route setup
app.use('/api/users', userRoutes);
app.use('/api/resorts', resortRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/atolls', atollRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/ui-content', uiContentRoutes);
app.use('/api/promotions', promotionRoutes);

// ✅ Root routes
app.get('/', (req, res) => {
  res.send('API is running. Try /api/health');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend server is running' });
});

// ✅ MongoDB Connection
const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb+srv://shalini:xdRcDhrfKUa8yH75@cluster0.db6cuiv.mongodb.net/travel-app';

let dbConnected = false;

async function connectToMongoDB() {
  if (!dbConnected) {
    try {
      await mongoose.connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      dbConnected = true;
      console.log('MongoDB connected');
    } catch (err) {
      console.error('MongoDB connection error:', err);
      throw err;
    }
  }
}

connectToMongoDB();

// ✅ Export for Vercel (serverless handler)
module.exports = app;
module.exports.handler = serverless(app);
