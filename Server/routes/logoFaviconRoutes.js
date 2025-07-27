const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const UIContent = require('../models/UIContent');

// Get logo or favicon
router.get('/:type', async (req, res) => {
  const { type } = req.params;
  if (!['logo', 'favicon'].includes(type)) {
    return res.status(400).json({ message: 'Invalid type' });
  }
  try {
    const content = await UIContent.findOne({ pageId: type });
    res.json(content || {});
  } catch (error) {
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
});

// Update logo or favicon (admin only)
router.put('/:type', auth, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  const { type } = req.params;
  if (!['logo', 'favicon'].includes(type)) {
    return res.status(400).json({ message: 'Invalid type' });
  }
  const { imageUrl } = req.body;
  if (!imageUrl) {
    return res.status(400).json({ message: 'Image URL required' });
  }
  try {
    const content = await UIContent.findOneAndUpdate(
      { pageId: type },
      {
        $set: {
          sections: [
            {
              sectionId: type,
              type: 'image',
              content: { imageUrl },
            },
          ],
          lastUpdated: new Date(),
        },
      },
      { new: true, upsert: true }
    );
    res.json(content);
  } catch (error) {
    res.status(400).json({ message: `Update failed: ${error.message}` });
  }
});

module.exports = router;
