// Updated upstream
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
const resortRoutes = require('./routes/resortRoutes');
const packageRoutes = require('./routes/packageRoutes');
const activityRoutes = require('./routes/activityRoutes');
const blogRoutes = require('./routes/blogRoutes');
const atollRoutes = require('./routes/atollRoutes');
const inquiryRoutes = require('./routes/inquiryRoutes');
const uiContentRoutes = require('./routes/uiContentRoutes');
const promotionRoutes = require('./routes/promotionRoutes');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'pragma', 'cache-control', 'expires', 'x-auth-token']
}));
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    dbName: 'travel-app',
  })
  .then(() => console.log('DB connect successful'))
  .catch((err) => {
    console.error('DB connection error:', err);
    process.exit(1); 
  });

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);});