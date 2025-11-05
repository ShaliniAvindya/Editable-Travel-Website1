const express = require('express');
const router = express.Router();
const UIContent = require('../models/UIContent');
const auth = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads');

async function downloadAndSaveLogo(imageUrl) {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(imageUrl);
      const client = urlObj.protocol === 'https:' ? https : http;
      const req = client.get(urlObj, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TravelicctedBot/1.0)' } }, (res) => {
        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          return reject(new Error('Failed to download image, status: ' + res.statusCode));
        }
        const contentType = res.headers['content-type'] || '';
        let ext = '.png';
        if (contentType.includes('jpeg')) ext = '.jpg';
        else if (contentType.includes('png')) ext = '.png';
        else if (contentType.includes('gif')) ext = '.gif';
        else {
          const parsed = path.parse(urlObj.pathname || '');
          if (parsed.ext) ext = parsed.ext;
        }

        try { fs.mkdirSync(UPLOADS_DIR, { recursive: true }); } catch (e) {}
        const filename = `logo_latest${ext}`;
        const outPath = path.join(UPLOADS_DIR, filename);
        const fileStream = fs.createWriteStream(outPath);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close(() => {
            const base = (process.env.SERVER_BASE_URL || '').replace(/\/$/, '');
            const publicPath = `/uploads/${filename}`;
            const publicUrl = base ? `${base}${publicPath}` : publicPath;
            resolve(publicUrl);
          });
        });
        fileStream.on('error', (err) => { try { fs.unlinkSync(outPath); } catch(e){}; reject(err); });
      });
      req.on('error', (err) => reject(err));
      req.setTimeout(15000, () => { req.abort(); reject(new Error('Timeout downloading image')); });
    } catch (err) {
      reject(err);
    }
  });
}

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
    if (req.params.pageId === 'logo-favicon') {
      try {
        const logoSection = Array.isArray(sections) ? sections.find(s => s.sectionId === 'logo') : null;
        const imageUrl = logoSection?.content?.imageUrl;
        if (imageUrl) {
          try {
            const savedLocalUrl = await downloadAndSaveLogo(imageUrl);
            const resp = content.toObject ? content.toObject() : content;
            resp.localUrl = savedLocalUrl;
            return res.json(resp);
          } catch (dlErr) {
            console.warn('ui-content: failed to download local logo copy:', dlErr.message || dlErr);
            return res.json(content);
          }
        }
      } catch (e) {
        console.warn('ui-content: error handling local logo save:', e.message || e);
      }
    }
    res.json(content);
  } catch (error) {
    console.error('Error updating content:', error.message);
    res.status(400).json({ message: `Update failed: ${error.message}` });
  }
});

module.exports = router;
