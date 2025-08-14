const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const auth = require('../middleware/auth');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const streamifier = require('streamifier');

// Use memory storage for serverless environments
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
});

// Helper function for Cloudinary streaming
const streamUpload = (fileBuffer, options) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

/* ===========================
   Upload Video
=========================== */
router.post('/upload/video', auth, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'No video file uploaded' });

    const result = await streamUpload(req.file.buffer, {
      resource_type: 'video',
      folder: 'blogs/videos',
    });

    res.json({ url: result.secure_url });
  } catch (err) {
    console.error('Error uploading video:', err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

/* ===========================
   Upload Image
=========================== */
router.post('/upload/image', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'No image file uploaded' });

    const result = await streamUpload(req.file.buffer, {
      resource_type: 'image',
      folder: 'blogs/images',
    });

    res.json({ url: result.secure_url });
  } catch (err) {
    console.error('Error uploading image:', err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

/* ===========================
   Create Blog
=========================== */
router.post('/', auth, async (req, res) => {
  try {
    const blog = new Blog(req.body);
    await blog.save();
    res.status(201).json(blog);
  } catch (err) {
    console.error('Error creating blog:', err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

/* ===========================
   Get All Blogs
=========================== */
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const filter =
      req.query.all === 'true'
        ? {}
        : { status: true, publish_date: { $lte: now } };
    const blogs = await Blog.find(filter).sort({ publish_date: -1 });
    res.json(blogs);
  } catch (err) {
    console.error('Error fetching blogs:', err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

/* ===========================
   Duplicate Blog
=========================== */
router.post('/duplicate/:id', auth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ msg: 'Blog not found' });

    const duplicate = blog.toObject();
    delete duplicate._id;
    duplicate.title = `${duplicate.title} (Copy)`;
    duplicate.status = true;

    const newBlog = new Blog(duplicate);
    await newBlog.save();

    res.status(201).json(newBlog);
  } catch (err) {
    console.error('Error duplicating blog:', err.message);
    if (err.kind === 'ObjectId') return res.status(400).json({ msg: 'Invalid blog ID' });
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

/* ===========================
   Toggle Blog Status
=========================== */
router.put('/status/:id', auth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ msg: 'Blog not found' });

    blog.status =
      typeof req.body.status === 'boolean' ? req.body.status : !blog.status;
    await blog.save();

    res.json({ status: blog.status });
  } catch (err) {
    console.error('Error toggling blog status:', err.message);
    if (err.kind === 'ObjectId') return res.status(400).json({ msg: 'Invalid blog ID' });
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

/* ===========================
   Get Blog by ID
=========================== */
router.get('/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ msg: 'Blog not found' });
    res.json(blog);
  } catch (err) {
    console.error('Error fetching blog:', err.message);
    if (err.kind === 'ObjectId') return res.status(400).json({ msg: 'Invalid blog ID' });
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

/* ===========================
   Update Blog
=========================== */
router.put('/:id', auth, async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!blog) return res.status(404).json({ msg: 'Blog not found' });
    res.json(blog);
  } catch (err) {
    console.error('Error updating blog:', err.message);
    if (err.kind === 'ObjectId') return res.status(400).json({ msg: 'Invalid blog ID' });
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

/* ===========================
   Delete Blog
=========================== */
router.delete('/:id', auth, async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) return res.status(404).json({ msg: 'Blog not found' });
    res.json({ msg: 'Blog deleted' });
  } catch (err) {
    console.error('Error deleting blog:', err.message);
    if (err.kind === 'ObjectId') return res.status(400).json({ msg: 'Invalid blog ID' });
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

module.exports = router;
