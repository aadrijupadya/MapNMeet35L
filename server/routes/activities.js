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

// Delete an activity
router.delete('/:activityId', async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.cookies.jwt) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const activity = await Activity.findById(req.params.activityId)
      .populate('createdBy', 'name email');

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // Check if the user is the creator of the activity
    if (activity.createdBy._id.toString() !== req.query.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this activity' });
    }

    // Remove the activity from all users' activities arrays
    await User.updateMany(
      { activities: req.params.activityId },
      { $pull: { activities: req.params.activityId } }
    );

    // Delete the activity
    await Activity.findByIdAndDelete(req.params.activityId);

    res.json({ message: 'Activity deleted successfully' });
  } catch (err) {
    console.error('Error deleting activity:', err);
    res.status(500).json({ error: 'Failed to delete activity' });
  }
});

// Update an activity
router.put('/:activityId', async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.cookies.jwt) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const activity = await Activity.findById(req.params.activityId)
      .populate('createdBy', 'name email');

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // Check if the user is the creator of the activity
    if (activity.createdBy._id.toString() !== req.body.userId) {
      return res.status(403).json({ error: 'Not authorized to update this activity' });
    }

    // Prepare update data
    const updateData = {
      title: req.body.title,
      description: req.body.description,
      time: new Date(req.body.time),
      endTime: new Date(req.body.endTime),
      participantCount: parseInt(req.body.participantCount),
    };

    // Only update location if it's provided
    if (req.body.location) {
      updateData.location = req.body.location;
      updateData.locationName = req.body.locationName;
    }

    // Update the activity
    const updatedActivity = await Activity.findByIdAndUpdate(
      req.params.activityId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email')
     .populate('joinees', 'name contact');

    if (!updatedActivity) {
      return res.status(404).json({ error: 'Activity not found after update' });
    }

    res.json(updatedActivity);
  } catch (err) {
    console.error('Error updating activity:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to update activity' });
  }
});

export default router;
