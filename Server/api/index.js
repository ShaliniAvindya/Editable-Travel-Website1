// api/index.js
const express = require('express');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const path = require('path');

// Import routes (adjust path relative to api folder)
const userRoutes = require(path.resolve('./routes/userRoutes'));
const resortRoutes = require(path.resolve('./routes/resortRoutes'));
const packageRoutes = require(path.resolve('./routes/packageRoutes'));
const activityRoutes = require(path.resolve('./routes/activityRoutes'));
const blogRoutes = require(path.resolve('./routes/blogRoutes'));
const atollRoutes = require(path.resolve('./routes/atollRoutes'));
const inquiryRoutes = require(path.resolve('./routes/inquiryRoutes'));
const uiContentRoutes = require(path.resolve('./routes/uiContentRoutes'));
const promotionRoutes = require(path.resolve('./routes/promotionRoutes'));

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(bodyParser.json());
app.use(express.json());

// API routes
app.use('/api/users', userRoutes);
app.use('/api/resorts', resortRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/atolls', atollRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/ui-content', uiContentRoutes);
app.use('/api/promotions', promotionRoutes);

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
module.exports = app;
module.exports.handler = serverless(app);
