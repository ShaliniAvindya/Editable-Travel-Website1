const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const auth = require('../middleware/auth');
const { google } = require('googleapis');
const multer = require('multer');
const stream = require('stream');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
});

router.post('/upload/video', auth, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'No video file uploaded' });

    const clientId = process.env.YT_CLIENT_ID;
    const clientSecret = process.env.YT_CLIENT_SECRET;
    const refreshToken = process.env.YT_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      console.error('YouTube credentials missing (YT_CLIENT_ID / YT_CLIENT_SECRET / YT_REFRESH_TOKEN)');
      return res.status(500).json({ msg: 'YouTube credentials not configured on server' });
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    const title = req.body.title || req.file.originalname || 'Uploaded video';
    const description = req.body.description || '';
    const privacyStatus = req.body.privacyStatus || 'unlisted'; // public, unlisted, or private

    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    const insertResponse = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title,
          description,
        },
        status: {
          privacyStatus,
        },
      },
      media: {
        body: bufferStream,
      },
    });

    const videoId = insertResponse && insertResponse.data && insertResponse.data.id;
    if (!videoId) {
      console.error('YouTube upload returned no video id', insertResponse && insertResponse.data);
      return res.status(500).json({ msg: 'Upload to YouTube failed', details: insertResponse && insertResponse.data });
    }

    const url = `https://www.youtube.com/watch?v=${videoId}`;

    if (req.body.blogId) {
      try {
        const blogDoc = await Blog.findById(req.body.blogId);
        if (blogDoc) {
          blogDoc.videos = blogDoc.videos || [];
          blogDoc.videos.push(url);
          await blogDoc.save();
        }
      } catch (saveErr) {
        console.error('Failed to save video URL to blog:', saveErr && saveErr.message ? saveErr.message : saveErr);
      }
    }

    return res.json({ url, id: videoId, youtubeResponse: insertResponse.data });
  } catch (err) {
    console.error('Error uploading to YouTube:', err && err.message ? err.message : err);
    return res.status(500).json({ msg: 'Server error', details: err && err.message ? err.message : err });
  }
});

// @route   POST /api/blogs
// @desc    Create a blog
// @access  Protected
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

// @route   GET /api/blogs
// @desc    Get all blogs
// @access  Public
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const filter = req.query.all === 'true' ? {} : { status: true, publish_date: { $lte: now } };
    const blogs = await Blog.find(filter).sort({ publish_date: -1 });
    res.json(blogs);
  } catch (err) {
    console.error('Error fetching blogs:', err.message);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});


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


router.put('/status/:id', auth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ msg: 'Blog not found' });
    blog.status = typeof req.body.status === 'boolean' ? req.body.status : !blog.status;
    await blog.save();
    res.json({ status: blog.status });
  } catch (err) {
    console.error('Error toggling blog status:', err.message);
    if (err.kind === 'ObjectId') return res.status(400).json({ msg: 'Invalid blog ID' });
    res.status(500).json({ msg: 'Server error', details: err.message });
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
    console.error('Error fetching blog:', err.message);
    if (err.kind === 'ObjectId') return res.status(400).json({ msg: 'Invalid blog ID' });
    res.status(500).json({ msg: 'Server error', details: err.message });
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
    console.error('Error updating blog:', err.message);
    if (err.kind === 'ObjectId') return res.status(400).json({ msg: 'Invalid blog ID' });
    res.status(500).json({ msg: 'Server error', details: err.message });
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
    console.error('Error deleting blog:', err.message);
    if (err.kind === 'ObjectId') return res.status(400).json({ msg: 'Invalid blog ID' });
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

module.exports = router;
