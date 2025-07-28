const express = require('express');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import routes
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

// Middlewares
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// ✅ Clean routes (no duplicate `/api`)
app.use('/users', userRoutes);
app.use('/resorts', resortRoutes);
app.use('/packages', packageRoutes);
app.use('/activities', activityRoutes);
app.use('/blogs', blogRoutes);
app.use('/atolls', atollRoutes);
app.use('/inquiries', inquiryRoutes);
app.use('/ui-content', uiContentRoutes);
app.use('/promotions', promotionRoutes);

// Health Check
app.get('/', (req, res) => {
  res.send('API is running. Try /health');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend server is running' });
});

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://shalini:xdRcDhrfKUa8yH75@cluster0.db6cuiv.mongodb.net/travel-app';

let dbConnected = false;
async function connectToMongoDB() {
  if (!dbConnected) {
    try {
      await mongoose.connect(MONGO_URI);
      dbConnected = true;
      console.log('MongoDB connected');
    } catch (err) {
      console.error('MongoDB connection error:', err);
    }
  }
}
connectToMongoDB();

// Export for Vercel
module.exports = app;
module.exports.handler = serverless(app);
