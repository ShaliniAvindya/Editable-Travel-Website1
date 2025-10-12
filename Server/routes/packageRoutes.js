const express = require('express');
const router = express.Router();
const Package = require('../models/Package');
const auth = require('../middleware/auth');

// @route   POST /api/packages
// @desc    Create a new package
// @access  Protected
router.post('/', auth, async (req, res) => {
  try {
    const allowed = ['Accommodation', 'Adventure', 'Activity'];
    if (req.body.inquiry_form_type && !allowed.includes(req.body.inquiry_form_type)) {
      return res.status(400).json({ msg: 'Invalid inquiry_form_type' });
    }
    const pkg = new Package(req.body);
    await pkg.save();
    res.status(201).json(pkg);
  } catch (err) {
    console.error('Error creating package:', err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// @route   GET /api/packages
// @desc    Get all packages
// @access  Public
router.get('/', async (req, res) => {
  try {
    const filter = req.query.all === 'true' ? {} : { status: true };
    const packages = await Package.find(filter);
    res.json(packages);
  } catch (err) {
    console.error('Error fetching packages:', err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});


router.post('/duplicate/:id', auth, async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id);
    if (!pkg) return res.status(404).json({ msg: 'Package not found' });
    const duplicate = pkg.toObject();
    delete duplicate._id;
    duplicate.title = `${duplicate.title} (Copy)`;
    duplicate.status = true;
    const newPackage = new Package(duplicate);
    await newPackage.save();
    res.status(201).json(newPackage);
  } catch (err) {
    console.error('Error duplicating package:', err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});


router.put('/status/:id', auth, async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id);
    if (!pkg) return res.status(404).json({ msg: 'Package not found' });
    pkg.status = typeof req.body.status === 'boolean' ? req.body.status : !pkg.status;
    await pkg.save();
    res.json({ status: pkg.status });
  } catch (err) {
    console.error('Error toggling package status:', err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
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
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// @route   PUT /api/packages/:id
// @desc    Update a package
// @access  Protected
router.put('/:id', auth, async (req, res) => {
  try {
    const allowed = ['Accommodation', 'Adventure', 'Activity'];
    if (req.body.inquiry_form_type && !allowed.includes(req.body.inquiry_form_type)) {
      return res.status(400).json({ msg: 'Invalid inquiry_form_type' });
    }
    const pkg = await Package.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!pkg) return res.status(404).json({ error: 'Package not found' });
    res.json(pkg);
  } catch (err) {
    console.error('Error updating package:', err.message);
    if (err.kind === 'ObjectId') return res.status(400).json({ error: 'Invalid package ID' });
    res.status(500).json({ msg: 'Server error', details: err.message });
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
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

module.exports = router;
