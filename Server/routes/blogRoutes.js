const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const auth = require('../middleware/auth');

// @route   POST /api/blogs
// @desc    Create a blog
// @access  Protected
router.post('/', auth, async (req, res) => {
  try {
    const blog = new Blog(req.body);
    await blog.save();
    res.status(201).json(blog);
  } catch (err) {
    console.error('Error creating blog:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/blogs
// @desc    Get all blogs
// @access  Public
router.get('/', async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ publish_date: -1 });
    res.json(blogs);
  } catch (err) {
    console.error('Error fetching blogs:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/blogs/:id
// @desc    Get blog by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ msg: 'Blog not found' });
    res.json(blog);
  } catch (err) {
    console.error('Error fetching blog:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PUT /api/blogs/:id
// @desc    Update a blog
// @access  Protected
router.put('/:id', auth, async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!blog) return res.status(404).json({ msg: 'Blog not found' });
    res.json(blog);
  } catch (err) {
    console.error('Error updating blog:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   DELETE /api/blogs/:id
// @desc    Delete a blog
// @access  Protected
router.delete('/:id', auth, async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) return res.status(404).json({ msg: 'Blog not found' });
    res.json({ msg: 'Blog deleted' });
  } catch (err) {
    console.error('Error deleting blog:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
