import express from 'express';
import Activity from '../models/Activity.js';
import User from '../models/UserModel.js';
import Notification from '../models/notification.js';

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
    const activities = await Activity.find({ cancelled: { $ne: true } })
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
    const activities = await Activity.find({ 
      createdBy: req.params.userId,
      cancelled: { $ne: true }
    })
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
    const activities = await Activity.find({ 
      joinees: req.params.userId,
      cancelled: { $ne: true }
    })
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

// Cancel an activity (soft delete)
router.delete('/:activityId', async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.cookies.jwt) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const activity = await Activity.findById(req.params.activityId)
      .populate('createdBy', 'name email')
      .populate('joinees', '_id name'); // Added _id to preserve the ID after population

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // Check if the user is the creator of the activity
    if (activity.createdBy._id.toString() !== req.query.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this activity' });
    }

    // Soft delete the activity
    activity.cancelled = true;
    activity.cancelledAt = new Date();
    await activity.save();

    // Create cancellation notifications for all participants
    const notifications = activity.joinees.map(joinee => ({
      userId: joinee._id,
      type: 'activity_cancelled',
      activityId: activity._id,
      message: `The activity "${activity.title}" has been cancelled by the organizer`
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.json({ message: 'Activity cancelled successfully' });
  } catch (err) {
    console.error('Error cancelling activity:', err);
    res.status(500).json({ error: 'Failed to cancel activity' });
  }
});

// Get all activities (including cancelled ones) - for admin purposes if needed
router.get('/all', async (req, res) => {
  try {
    const activities = await Activity.find()
      .populate('joinees', 'name contact')
      .populate({
        path: 'createdBy',  // Specifies which field to populate (createdBy reference)
        select: 'name email', // Only include name and email fields from the User document
        model: 'User' // Explicitly states which model to use for population
      });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

export default router;
