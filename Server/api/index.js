const express = require('express');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Import routes with relative paths (relative to api folder)
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

app.use(cors({ origin: '*', credentials: true }));
app.use(bodyParser.json());
app.use(express.json());

// Register routes
app.use('/api/users', userRoutes);
app.use('/api/resorts', resortRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/atolls', atollRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/ui-content', uiContentRoutes);
app.use('/api/promotions', promotionRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'API is running!' });
});

// MongoDB connection string
const MONGO_URI = 'mongodb+srv://shalini:xdRcDhrfKUa8yH75@cluster0.db6cuiv.mongodb.net/travel-app';

let dbConnected = false;
async function connectToMongoDB() {
  if (!dbConnected) {
    try {
      await mongoose.connect(MONGO_URI);
      dbConnected = true;
      console.log('MongoDB connected');
    } catch (err) {
      console.error('MongoDB connection error:', err);
      throw err;
    }
  }
}
connectToMongoDB();

module.exports = app;
module.exports.handler = serverless(app);
