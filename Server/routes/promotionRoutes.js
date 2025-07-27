const express = require('express');
const router = express.Router();
const Promotion = require('../models/Promotion');
const auth = require('../middleware/auth');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ msg: 'Admin access required' });
  }
  next();
};

router.post('/', [auth, isAdmin], async (req, res) => {
  try {
    const { title, description, imageUrl, validFrom, validUntil, isPopup, buttonText, buttonLink, countdownLabel, trustIndicator1, trustIndicator2 } = req.body;
    const promotion = new Promotion({
      title,
      description,
      imageUrl,
      validFrom,
      validUntil,
      isPopup,
      buttonText,
      buttonLink,
      countdownLabel,
      trustIndicator1,
      trustIndicator2,
    });
    await promotion.save();
    res.status(201).json(promotion);
  } catch (err) {
    console.error('Error creating promotion:', err);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// Get all promotions
router.get('/', async (req, res) => {
  try {
    const promotions = await Promotion.find().sort({ createdAt: -1 });
    res.json(promotions);
  } catch (err) {
    console.error('Error fetching promotions:', err);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// Get active promotions
router.get('/active', async (req, res) => {
  try {
    const now = new Date();
    const promotions = await Promotion.find({
      isPopup: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
    }).sort({ createdAt: -1 });
    res.json(promotions);
  } catch (err) {
    console.error('Error fetching active promotions:', err);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id);
    if (!promotion) return res.status(404).json({ msg: 'Promotion not found' });
    res.json(promotion);
  } catch (err) {
    console.error('Error fetching promotion:', err);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});


router.put('/:id', [auth, isAdmin], async (req, res) => {
  try {
    const promotion = await Promotion.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!promotion) return res.status(404).json({ msg: 'Promotion not found' });
    res.json(promotion);
  } catch (err) {
    console.error('Error updating promotion:', err);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// Delete promotion
router.delete('/:id', [auth, isAdmin], async (req, res) => {
  try {
    const promotion = await Promotion.findByIdAndDelete(req.params.id);
    if (!promotion) return res.status(404).json({ msg: 'Promotion not found' });
    res.json({ msg: 'Promotion deleted' });
  } catch (err) {
    console.error('Error deleting promotion:', err);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

module.exports = router;