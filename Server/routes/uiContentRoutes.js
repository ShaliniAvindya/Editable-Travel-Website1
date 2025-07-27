const express = require('express');
const router = express.Router();
const UIContent = require('../models/UIContent');
const auth = require('../middleware/auth');

// Get content for a specific page
router.get('/:pageId', async (req, res) => {
  try {
    const content = await UIContent.findOne({ pageId: req.params.pageId });
    if (!content) {
      return res.json({ pageId: req.params.pageId, sections: [] });
    }
    res.json(content);
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
});

// Update content
router.put('/:pageId', auth, async (req, res) => {
  if (!req.user.isAdmin) {
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
    console.error('Error updating content:', error);
    res.status(400).json({ message: `Update failed: ${error.message}` });
  }
});

module.exports = router;