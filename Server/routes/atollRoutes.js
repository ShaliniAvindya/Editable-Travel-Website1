const express = require('express');
const router = express.Router();
const Atoll = require('../models/Atoll');
const auth = require('../middleware/auth');

// @route   POST /api/atolls
// @desc    Create a new atoll (admin only)
// @access  Protected
router.post('/', auth, async (req, res) => {
  try {
    const atoll = new Atoll(req.body);
    await atoll.save();
    res.status(201).json(atoll);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get all atolls with populated accommodations
router.get('/', async (req, res) => {
  try {
    const atolls = await Atoll.find({}).populate('accommodations', 'name island');
    res.json(atolls);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get atoll by ID with populated accommodations
router.get('/:id', async (req, res) => {
  try {
    const atoll = await Atoll.findById(req.params.id).populate('accommodations', 'name island');
    if (!atoll) return res.status(404).json({ msg: 'Atoll not found' });
    res.json(atoll);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PUT /api/atolls/:id
// @desc    Update an atoll
// @access  Protected
router.put('/:id', auth, async (req, res) => {
  try {
    const atoll = await Atoll.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('accommodations', 'name island');
    if (!atoll) return res.status(404).json({ msg: 'Atoll not found' });
    res.json(atoll);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   DELETE /api/atolls/:id
// @desc    Delete an atoll
// @access  Protected
router.delete('/:id', auth, async (req, res) => {
  try {
    const atoll = await Atoll.findByIdAndDelete(req.params.id);
    if (!atoll) return res.status(404).json({ msg: 'Atoll not found' });
    res.json({ msg: 'Atoll deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST /api/atolls/:id/accommodations
// @desc    Add a new accommodation to an atoll
// @access  Protected
router.post('/:id/accommodations', auth, async (req, res) => {
  try {
    const atoll = await Atoll.findById(req.params.id);
    if (!atoll) return res.status(404).json({ msg: 'Atoll not found' });

    atoll.accommodations.push(req.body.accommodationId);
    await atoll.save();

    const updatedAtoll = await Atoll.findById(req.params.id).populate('accommodations', 'name island');
    res.status(201).json(updatedAtoll.accommodations[updatedAtoll.accommodations.length - 1]);
  } catch (err) {
    console.error('Error adding accommodation:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   DELETE /api/atolls/:id/accommodations/:roomId
// @desc    Delete a specific accommodation from an atoll
// @access  Protected
router.delete('/:id/accommodations/:accommodationId', auth, async (req, res) => {
  try {
    const atoll = await Atoll.findById(req.params.id);
    if (!atoll) return res.status(404).json({ msg: 'Atoll not found' });

    atoll.accommodations = atoll.accommodations.filter(
      accommodation => accommodation.toString() !== req.params.accommodationId
    );

    await atoll.save();
    res.json({ msg: 'Accommodation removed from atoll' });
  } catch (err) {
    console.error('Error deleting accommodation:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
