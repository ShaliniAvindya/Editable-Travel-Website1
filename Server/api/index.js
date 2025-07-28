const express = require('express');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors());

app.get('/api/health', (req, res) => {
  res.json({ status: 'API is working' });
});

// Try connecting to MongoDB if MONGO_URI exists
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then(() => {
    console.log('MongoDB connected');
  }).catch(err => {
    console.error('MongoDB connection error:', err);
  });
} else {
  console.warn('MONGO_URI not set');
}

module.exports = app;
module.exports.handler = serverless(app);
