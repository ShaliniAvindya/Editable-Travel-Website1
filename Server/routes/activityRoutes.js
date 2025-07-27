const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const auth = require('../middleware/auth');

// @route   POST /api/activities
// @desc    Create a new activity
// @access  Protected
router.post('/', auth, async (req, res) => {
  try {
    const activity = new Activity(req.body);
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
    const activities = await Activity.find()
      .populate('available_atoll_ids', 'name description')
      .populate('activity_sites.atoll_id', 'name description');

    const transformedActivities = activities.map(activity => ({
      ...activity.toObject(),
      atolls: activity.available_in_all_atolls ? 'All Atolls' :
        activity.available_atoll_ids.map(atoll => atoll.name).join(', ')
    }));

    res.json(transformedActivities);
  } catch (err) {
    console.error('Error fetching activities:', err);
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
        atolls: activity.available_in_all_atolls ? 'All Atolls' :
          activity.available_atoll_ids.map(atoll => atoll.name).join(', ')
      };
    });

    res.json(filteredActivities);
  } catch (err) {
    console.error('Error fetching activities by atoll:', err);
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
    const activity = await Activity.findByIdAndUpdate(req.params.id, req.body, { new: true })
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
