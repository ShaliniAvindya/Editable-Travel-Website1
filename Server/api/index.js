const express = require('express');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Import routes with relative paths (make sure these paths are correct)
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

const cors = require('cors');
app.use(cors({
  origin: 'https://editable-travel-website1.vercel.app' // frontend domain
}));


app.use(bodyParser.json());
app.use(express.json());

// Register API routes
app.use('/api/users', userRoutes);
app.use('/api/resorts', resortRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/atolls', atollRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/ui-content', uiContentRoutes);
app.use('/api/promotions', promotionRoutes);

// Root and health check endpoints
app.get('/', (req, res) => {
  res.send('API is running. Try /api/health');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend server is running' });
});

// Use MongoDB URI from environment variables for security
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

// Export app and serverless handler for deployment on platforms like Vercel
module.exports = app;
module.exports.handler = serverless(app);
