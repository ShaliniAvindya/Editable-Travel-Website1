
// api/server.js
const express = require('express');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
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

// Middleware
app.use(cors({
  origin: '*', // Or replace with your frontend URL for security
  credentials: true
}));
app.use(bodyParser.json());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/resorts', resortRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/atolls', atollRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/ui-content', uiContentRoutes);
app.use('/api/promotions', promotionRoutes);

// MongoDB connection (one-time initialization)
let dbConnected = false;
async function connectToMongoDB() {
  if (!dbConnected) {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: 'travel-app',
    });
    dbConnected = true;
    console.log('MongoDB connected');
  }
}
connectToMongoDB();

// Export for Vercel serverless function
module.exports = serverless(app);
