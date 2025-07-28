const express = require('express');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const path = require('path');

// Import routes
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

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'API is running!' });
});

// MongoDB connection string (your provided one)
const MONGO_URI = 'mongodb+srv://shalini:xdRcDhrfKUa8yH75@cluster0.db6cuiv.mongodb.net/travel-app';

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

module.exports = app;
module.exports.handler = serverless(app);
