const express = require('express');
const router = express.Router();
const Resort = require('../models/Resort');
const Atoll = require('../models/Atoll');
const auth = require('../middleware/auth');

// ✅ Create a new resort (admin only – add role check in production)
router.post('/', auth, async (req, res) => {
  try {
    const resort = new Resort(req.body);
    await resort.save();

    // Sync with Atoll's accommodations array
    const atoll = await Atoll.findById(req.body.atoll);
    if (atoll && !atoll.accommodations.includes(resort._id)) {
      atoll.accommodations.push(resort._id);
      await atoll.save();
    }

    const populatedResort = await Resort.findById(resort._id).populate('atoll', 'name');
    res.status(201).json(populatedResort);
  } catch (err) {
    console.error('Error creating resort:', err);
    res.status(500).json({ message: 'Server error', details: err.message });
  }
});

// ✅ Get a specific resort by atoll ID
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    const query = type ? { type } : {};
    const resorts = await Resort.find(query).populate('atoll', 'name');
    res.json(resorts);
  } catch (err) {
    console.error('Error fetching resorts:', err);
    res.status(500).json({ message: 'Server error', details: err.message });
  }
});

// ✅ Get a specific resort by atoll ID
router.get('/byAtoll/:atollId', async (req, res) => {
  try {
    const atoll = await Atoll.findById(req.params.atollId).populate({
      path: 'accommodations',
      select: 'name island description images coverImage amenities type rooms contact',
      populate: { path: 'atoll', select: 'name' }
    });
    if (!atoll) return res.status(404).json({ message: 'Atoll not found' });

    const resorts = atoll.accommodations.filter(resort => resort); // Filter out null/undefined
    console.log(`Fetched ${resorts.length} resorts for atoll ${req.params.atollId}:`, resorts.map(r => r._id));
    res.json(resorts);
  } catch (err) {
    console.error('Error fetching resorts by atoll:', err);
    res.status(500).json({ message: 'Server error', details: err.message });
  }
});

// Get a specific resort by ID with populated atoll name
router.get('/:id', async (req, res) => {
  try {
    const resort = await Resort.findById(req.params.id).populate('atoll', 'name');
    if (!resort) return res.status(404).json({ message: 'Resort not found' });
    res.json(resort);
  } catch (err) {
    console.error('Error fetching resort:', err);
    res.status(500).json({ message: 'Server error', details: err.message });
  }
});

// ✅ Update a resort by ID (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const resort = await Resort.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('atoll', 'name');
    if (!resort) return res.status(404).json({ message: 'Resort not found' });
    res.json(resort);
  } catch (err) {
    console.error('Error updating resort:', err);
    res.status(500).json({ message: 'Server error', details: err.message });
  }
});

// ✅ Delete a resort by ID (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const resort = await Resort.findByIdAndDelete(req.params.id);
    if (!resort) return res.status(404).json({ message: 'Resort not found' });

    await Atoll.updateMany(
      { accommodations: req.params.id },
      { $pull: { accommodations: req.params.id } }
    );
    res.json({ message: 'Resort deleted' });
  } catch (err) {
    console.error('Error deleting resort:', err);
    res.status(500).json({ message: 'Server error', details: err.message });
  }
});

// ✅ Add a new room to a specific resort (admin only)
router.post('/:id/rooms', auth, async (req, res) => {
  try {
    const resort = await Resort.findById(req.params.id);
    if (!resort) return res.status(404).json({ message: 'Resort not found' });

    const roomData = {
      type: req.body.type,
      price_per_night: Number(req.body.price_per_night),
      capacity: {
        adults: Number(req.body.capacity.adults),
        children: Number(req.body.capacity.children),
      },
      amenities: req.body.amenities || [],
      images: req.body.images || [],
      description: req.body.description || '',
      size_sqm: Number(req.body.size_sqm),
    };

    resort.rooms.push(roomData);
    await resort.save();

    const addedRoom = resort.rooms[resort.rooms.length - 1];
    res.status(201).json(addedRoom);
  } catch (err) {
    console.error('Error adding room:', err);
    res.status(500).json({ message: 'Server error', details: err.message });
  }
});

// ✅ Update a room inside a resort
router.put('/:resortId/rooms/:roomId', auth, async (req, res) => {
  try {
    const resort = await Resort.findById(req.params.resortId);
    if (!resort) return res.status(404).json({ message: 'Resort not found' });

    const room = resort.rooms.id(req.params.roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    Object.assign(room, {
      type: req.body.type,
      price_per_night: Number(req.body.price_per_night),
      capacity: {
        adults: Number(req.body.capacity.adults),
        children: Number(req.body.capacity.children),
      },
      amenities: req.body.amenities || [],
      images: req.body.images || [],
      description: req.body.description || '',
      size_sqm: Number(req.body.size_sqm),
    });

    await resort.save();
    res.json(room);
  } catch (err) {
    console.error('Error updating room:', err);
    res.status(500).json({ message: 'Server error', details: err.message });
  }
});

// ✅ Delete a room inside a resort
router.delete('/:resortId/rooms/:roomId', auth, async (req, res) => {
  try {
    const resort = await Resort.findById(req.params.resortId);
    if (!resort) return res.status(404).json({ message: 'Resort not found' });

    const room = resort.rooms.id(req.params.roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    // Use pull to remove the room subdocument by _id
    resort.rooms.pull({ _id: req.params.roomId });
    await resort.save();

    res.json({ message: 'Room deleted' });
  } catch (err) {
    console.error('Error deleting room:', err);
    res.status(500).json({ message: 'Failed to delete room', details: err.message });
  }
});

module.exports = router;
