const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();

// Registration Route
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    user = new User({
      name,
      email,
      password, // Plain text password (will be hashed in pre-save middleware)
      isAdmin: false,
      provider: 'local',
    });

    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Restrict login to admin users
    if (!user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        isAdmin: user.isAdmin
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    };

    res.status(200).json({
      message: 'Login successful',
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    console.log('Fetching current user:', req.user.userId);
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users (admin only)
router.get('/all', auth, async (req, res) => {
  try {
    console.log('Fetching all users, requested by:', req.user.userId);
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Delete user (admin only, no self-deletion)
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log('Delete request for user:', req.params.id, 'by:', req.user.userId);
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user._id.toString() === req.user.userId) {
      return res.status(400).json({ message: 'Cannot delete own account' });
    }
    await User.findByIdAndDelete(id);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// Get user by ID (admin only)
router.get('/:id', auth, async (req, res) => {
  try {
    console.log('Get user request for:', req.params.id, 'by:', req.user.userId);
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
});

// Toggle admin status (admin only, no self-toggle)
router.patch('/:id/toggle-admin', auth, async (req, res) => {
  try {
    console.log('Toggle admin request for:', req.params.id, 'by:', req.user.userId);
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user._id.toString() === req.user.userId) {
      return res.status(400).json({ message: 'Cannot modify own admin status' });
    }
    user.isAdmin = !user.isAdmin;
    await user.save();
    res.status(200).json({
      message: `User ${user.isAdmin ? 'promoted to' : 'demoted from'} admin`,
      user: { _id: user._id, isAdmin: user.isAdmin },
    });
  } catch (error) {
    console.error('Error toggling admin status:', error);
    res.status(500).json({ message: 'Error toggling admin status' });
  }
});

// Toggle admin status with PUT
router.put('/:id/toggle-admin', auth, async (req, res) => {
  try {
    console.log('Toggle admin request for:', req.params.id, 'by:', req.user.userId);
    
    // Check if requester is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const { id } = req.params;
    const { isAdmin } = req.body;

    // Validate ObjectId
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const user = await User.findById(id);

    // Check if user exists
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent self-modification
    if (user._id.toString() === req.user.userId) {
      return res.status(403).json({ message: 'Cannot modify your own admin status' });
    }

    const adminCount = await User.countDocuments({ isAdmin: true });
    if (user.isAdmin && !isAdmin && adminCount <= 1) {
      return res.status(400).json({ message: 'Cannot demote the last admin user' });
    }

    // Update user's admin status
    user.isAdmin = isAdmin;
    await user.save();

    res.status(200).json({
      message: `User ${isAdmin ? 'promoted to' : 'demoted from'} admin successfully`,
      user: { _id: user._id, isAdmin: user.isAdmin }
    });
  } catch (error) {
    console.error('Error toggling admin status:', error);
    res.status(500).json({ message: 'Server error while updating admin status' });
  }
});

module.exports = router;
