import express from 'express';
import Activity from '../models/Activity.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const activity = new Activity(req.body);
    await activity.save();
    res.status(201).json(activity);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const activities = await Activity.find()
      .populate('joinees', 'name contact')
      .populate({
        path: 'createdBy',
        select: 'name email',
        model: 'User'
      });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// Get activities created by a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const activities = await Activity.find({ createdBy: req.params.userId })
      .populate('joinees', 'name contact')
      .populate({
        path: 'createdBy',
        select: 'name email',
        model: 'User'
      });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user activities' });
  }
});

// Get activities that a user has RSVP'd to
router.get('/rsvpd/:userId', async (req, res) => {
  try {
    const activities = await Activity.find({ joinees: req.params.userId })
      .populate('joinees', 'name contact')
      .populate({
        path: 'createdBy',
        select: 'name email',
        model: 'User'
      });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch RSVP\'d activities' });
  }
});

export default router;
