const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const UIContent = require('../models/UIContent');
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
    try {
      const savedLocalUrl = await downloadAndSaveLogo(imageUrl);
      const resp = content.toObject ? content.toObject() : content;
      resp.localUrl = savedLocalUrl;
      return res.json(resp);
    } catch (dlErr) {
      console.warn('Failed to save local logo copy:', dlErr.message || dlErr);
      return res.json(content);
    }
  } catch (error) {
    res.status(400).json({ message: `Update failed: ${error.message}` });
  }
});

module.exports = router;
