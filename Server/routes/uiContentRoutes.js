const express = require('express');
const router = express.Router();
const UIContent = require('../models/UIContent');
const auth = require('../middleware/auth');

// Get maintenance status  
router.get('/maintenance-status', async (req, res) => {
  try {
    const content = await UIContent.findOne({ pageId: 'global' });
    console.log('[GET] Maintenance status:', content ? content.maintenanceMode : 'No global doc');
    res.json({ maintenanceMode: content?.maintenanceMode || false });
  } catch (error) {
    console.error('[GET] Maintenance status error:', error.message);
    res.status(500).json({ message: 'Failed to get maintenance status', error: error.message });
  }
});

// Set maintenance status
router.post('/maintenance-status', auth, async (req, res) => {
  if (!req.user?.isAdmin) {
    console.log('[POST] Maintenance status: Not admin');
    return res.status(403).json({ message: 'Admin access required' });
  }
  try {
    const { maintenanceMode } = req.body;
    if (typeof maintenanceMode !== 'boolean') {
      return res.status(400).json({ message: 'maintenanceMode must be a boolean' });
    }
    let content = await UIContent.findOne({ pageId: 'global' });
    if (!content) {
      content = new UIContent({ pageId: 'global', maintenanceMode, sections: [] });
      console.log('[POST] Creating global doc with maintenanceMode:', maintenanceMode);
    } else {
      console.log('[POST] Updating global doc. Old:', content.maintenanceMode, 'New:', maintenanceMode);
      content.maintenanceMode = maintenanceMode;
    }
    await content.save();
    console.log('[POST] Saved global doc. Current maintenanceMode:', content.maintenanceMode);
    res.json({ maintenanceMode: content.maintenanceMode });
  } catch (error) {
    console.error('[POST] Maintenance status error:', error.message);
    res.status(500).json({ message: 'Failed to set maintenance status', error: error.message });
  }
});

// Get content for a specific page
router.get('/:pageId', async (req, res) => {
  try {
    const content = await UIContent.findOne({ pageId: req.params.pageId });
    if (!content) {
      return res.json({ pageId: req.params.pageId, sections: [], maintenanceMode: false });
    }
    res.json(content);
  } catch (error) {
    console.error('Error fetching content:', error.message);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
});

// Update content
router.put('/:pageId', auth, async (req, res) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  try {
    const { sections } = req.body;
    if (!sections || !Array.isArray(sections)) {
      return res.status(400).json({ message: 'Sections array is required' });
    }
    const content = await UIContent.findOneAndUpdate(
      { pageId: req.params.pageId },
      { $set: { sections, lastUpdated: new Date() } },
      { new: true, upsert: true }
    );
    res.json(content);
  } catch (error) {
    console.error('Error updating content:', error.message);
    res.status(400).json({ message: `Update failed: ${error.message}` });
  }
});

module.exports = router;

