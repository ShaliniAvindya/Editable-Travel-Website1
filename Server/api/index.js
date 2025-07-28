// api/index.js
const express = require('express');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

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

let isConnected = false;

async function connectDB() {
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: 'travel-app',
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
  }
}

connectDB();

module.exports = serverless(app); // only export this
