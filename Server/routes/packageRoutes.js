const express = require('express');
const router = express.Router();
const Package = require('../models/Package');
const auth = require('../middleware/auth');

// @route   POST /api/packages
// @desc    Create a new package
// @access  Protected
router.post('/', auth, async (req, res) => {
  try {
    const pkg = new Package(req.body);
    await pkg.save();
    res.status(201).json(pkg);
  } catch (err) {
    console.error('Error creating package:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/packages
// @desc    Get all packages
// @access  Public
router.get('/', async (req, res) => {
  try {
    const packages = await Package.find();
    res.json(packages);
  } catch (err) {
    console.error('Error fetching packages:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/packages/:id
// @desc    Get a package by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id);
    if (!pkg) return res.status(404).json({ error: 'Package not found' });
    res.json(pkg);
  } catch (err) {
    console.error('Error fetching package:', err.message);
    if (err.kind === 'ObjectId') return res.status(400).json({ error: 'Invalid package ID' });
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PUT /api/packages/:id
// @desc    Update a package
// @access  Protected
router.put('/:id', auth, async (req, res) => {
  try {
    const pkg = await Package.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!pkg) return res.status(404).json({ error: 'Package not found' });
    res.json(pkg);
  } catch (err) {
    console.error('Error updating package:', err.message);
    if (err.kind === 'ObjectId') return res.status(400).json({ error: 'Invalid package ID' });
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   DELETE /api/packages/:id
// @desc    Delete a package
// @access  Protected
router.delete('/:id', auth, async (req, res) => {
  try {
    const pkg = await Package.findByIdAndDelete(req.params.id);
    if (!pkg) return res.status(404).json({ error: 'Package not found' });
    res.json({ msg: 'Package deleted' });
  } catch (err) {
    console.error('Error deleting package:', err.message);
    if (err.kind === 'ObjectId') return res.status(400).json({ error: 'Invalid package ID' });
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
