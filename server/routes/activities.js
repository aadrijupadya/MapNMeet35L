import express from 'express';
import Activity from '../models/Activity.js';
import User from '../models/UserModel.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.cookies.jwt) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify the user exists
    const userId = req.body.createdBy;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create and save the activity
    const activity = new Activity({
      ...req.body,
      createdBy: userId
    });

    const savedActivity = await activity.save();
    
    // Populate the createdBy field before sending response
    const populatedActivity = await Activity.findById(savedActivity._id)
      .populate('createdBy', 'name email')
      .populate('joinees', 'name contact');

    res.status(201).json(populatedActivity);
  } catch (err) {
    console.error('Error creating activity:', err);
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
