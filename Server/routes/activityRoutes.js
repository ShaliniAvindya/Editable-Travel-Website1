const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const auth = require('../middleware/auth');

// @route   POST /api/activities
// @desc    Create a new activity
// @access  Protected
router.post('/', auth, async (req, res) => {
  try {
    let { price, ...rest } = req.body;
    if (
      price === undefined || price === null || price === '' ||
      (typeof price === 'string' && (price.trim() === '' || price.trim() === '0')) ||
      (typeof price === 'number' && price === 0)
    ) {
      price = null;
    } else if (typeof price === 'string' && !price.trim().startsWith('$')) {
      price = `$${price.trim()}`;
    } else if (typeof price === 'number') {
      price = `$${price}`;
    }
    const activity = new Activity({ ...rest, price });
    await activity.save();
    const populatedActivity = await Activity.findById(activity._id)
      .populate('available_atoll_ids', 'name description')
      .populate('activity_sites.atoll_id', 'name description');
    res.status(201).json(populatedActivity);
  } catch (err) {
    console.error('Error creating activity:', err);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// Get all activities with populated atoll names
router.get('/', async (req, res) => {
  try {
    const filter = req.query.all === 'true' ? {} : { status: true };
    const activities = await Activity.find(filter)
      .populate('available_atoll_ids', 'name description')
      .populate('activity_sites.atoll_id', 'name description');

    const transformedActivities = activities.map(activity => ({
      ...activity.toObject(),
      atolls: activity.available_in_all_atolls ? 'Allen Inseln' :
        activity.available_atoll_ids.map(atoll => atoll.name).join(', ')
    }));

    res.json(transformedActivities);
  } catch (err) {
    console.error('Error fetching activities:', err);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// Duplicate activity
router.post('/duplicate/:id', auth, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ msg: 'Activity not found' });
    const duplicate = activity.toObject();
    delete duplicate._id;
    duplicate.name = duplicate.name + ' (Copy)';
    duplicate.status = true;
    const newActivity = new Activity(duplicate);
    await newActivity.save();
    const populatedActivity = await Activity.findById(newActivity._id)
      .populate('available_atoll_ids', 'name description')
      .populate('activity_sites.atoll_id', 'name description');
    res.status(201).json(populatedActivity);
  } catch (err) {
    console.error('Error duplicating activity:', err);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// Toggle activity status
router.put('/status/:id', auth, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ msg: 'Activity not found' });
    activity.status = typeof req.body.status === 'boolean' ? req.body.status : !activity.status;
    await activity.save();
    res.json({ status: activity.status });
  } catch (err) {
    console.error('Error toggling activity status:', err);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// Get activities by atoll ID
router.get('/byAtoll/:atollId', async (req, res) => {
  try {
    console.log('Finding activities for atoll:', req.params.atollId);
    const activities = await Activity.find({
      $or: [
        { available_atoll_ids: req.params.atollId },
        { available_in_all_atolls: true }
      ]
    })
      .populate('available_atoll_ids', 'name description')
      .populate('activity_sites.atoll_id', 'name description');

    const filteredActivities = activities.map(activity => {
      // Filter out invalid activity_sites
      const validSites = activity.activity_sites.filter(site => {
        if (!site.atoll_id) {
          console.warn(`Invalid activity site in activity ${activity._id}: Missing atoll_id`, site);
          return false;
        }
        return String(site.atoll_id._id) === String(req.params.atollId);
      });

      return {
        ...activity.toObject(),
        activity_sites: validSites,
        atolls: activity.available_in_all_atolls ? 'Allen Inseln' :
          activity.available_atoll_ids.map(atoll => atoll.name).join(', ')
      };
    });

    res.json(filteredActivities);
  } catch (err) {
    console.error('Error fetching activities by Island:', err);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// Get an activity by ID
router.get('/:id', async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate('available_atoll_ids', 'name description')
      .populate('activity_sites.atoll_id', 'name description');
    if (!activity) return res.status(404).json({ msg: 'Activity not found' });
    res.json(activity);
  } catch (err) {
    console.error('Error fetching activity:', err);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// @route   PUT /api/activities/:id
// @desc    Update an activity
// @access  Protected
router.put('/:id', auth, async (req, res) => {
  try {
    let { price, ...rest } = req.body;
    if (
      price === undefined || price === null || price === '' ||
      (typeof price === 'string' && (price.trim() === '' || price.trim() === '0')) ||
      (typeof price === 'number' && price === 0)
    ) {
      price = null;
    } else if (typeof price === 'string' && !price.trim().startsWith('$')) {
      price = `$${price.trim()}`;
    } else if (typeof price === 'number') {
      price = `$${price}`;
    }
    const activity = await Activity.findByIdAndUpdate(
      req.params.id,
      { ...rest, price },
      { new: true }
    )
      .populate('available_atoll_ids', 'name description')
      .populate('activity_sites.atoll_id', 'name description');
    if (!activity) return res.status(404).json({ msg: 'Activity not found' });
    res.json(activity);
  } catch (err) {
    console.error('Error updating activity:', err);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// @route   DELETE /api/activities/:id
// @desc    Delete an activity
// @access  Protected
router.delete('/:id', auth, async (req, res) => {
  try {
    const activity = await Activity.findByIdAndDelete(req.params.id);
    if (!activity) return res.status(404).json({ msg: 'Activity not found' });
    res.json({ msg: 'Activity deleted' });
  } catch (err) {
    console.error('Error deleting activity:', err);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

module.exports = router;

