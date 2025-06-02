import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import activitiesRouter from './routes/activities.js';
import notificationsRouter from './routes/notifications.js';
// import authController from './controllers/authController.js'; TODO: Fix this import
// const authController = require('./controllers/authController');
import { googleAuth } from './controllers/authController.js'; // include the .js extension
import compression from 'compression';
import { validateSession } from './controllers/authController.js';
import cookieParser from 'cookie-parser';
import Activity from './models/Activity.js';
import User from "./models/UserModel.js"
import Notification from './models/notification.js';

dotenv.config();

const app = express();
const port = 8000;

// app.use(cors());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(compression());
app.use(cookieParser());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));


// // // Log incoming request headers for debugging
// app.use((req, res, next) => {
//   console.log('Request Headers:', req.headers); // Logs all headers
//   next();
// });

app.use('/api/activities', activitiesRouter);
app.use('/api/notifications', notificationsRouter);

app.post('/api/addParticipant', async (req, res) => {
  const userID = req.body.userId
  const activityID = req.body.activityId
  const remove = req.body.remove

  if (!userID || !activityID) {
    console.log('Missing required fields:', { userID, activityID });
    return res.status(400).json({ error: 'userID and activityID are required' });
  }

  try {
    // Fetch the activity to check joinees and participant count
    const activity = await Activity.findById(activityID).populate('createdBy', 'name');

    if (!activity) {
      console.log("ACTIVITY_NOT_FOUND");
      return res.status(404).json({ error: 'ACTIVITY_NOT_FOUND' });
    }

    // Check if user exists
    const user = await User.findById(userID);
    if (!user) {
      console.log("USER_NOT_FOUND");
      return res.status(404).json({ error: 'USER_NOT_FOUND' });
    }

    if (remove) {
      // Remove the user from the activity's joinees array
      activity.joinees.pull(userID);
      await activity.save();

      // Remove the activity from the user's activities array
      await User.findByIdAndUpdate(
        userID,
        { $pull: { activities: activityID } },
        { new: true }
      );

      console.log("Successfully removed user from activity");
    } else {
      // Check if user is already in the activity
      if (activity.joinees.includes(userID)) {
        console.log("USER_ALREADY_IN_ACTIVITY");
        return res.status(400).json({ error: 'USER_ALREADY_IN_ACTIVITY' });
      }

      // Only check for activity full when joining
      if (activity.participantCount && activity.joinees.length >= activity.participantCount) {
        console.log("ACTIVITY_FULL");
        return res.status(400).json({ error: 'ACTIVITY_FULL' });
      }

      // Add the userID to the activity's joinees array
      activity.joinees.addToSet(userID);
      await activity.save();

      // Update the user's activities field with the activity ID
      await User.findByIdAndUpdate(
        userID,
        { $addToSet: { activities: activityID } },
        { new: true }
      );

      // Create notification for activity creator
      if (activity.createdBy._id.toString() !== userID) {
        const notification = new Notification({
          userId: activity.createdBy._id,
          type: 'new_participant',
          activityId: activityID,
          message: `${user.name} joined your activity "${activity.title}"`
        });
        await notification.save();
      }

      console.log("Successfully added user to activity");
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in addParticipant:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/updateContact', async (req, res) => {
  const { userId, contact } = req.body;
  console.log('Update contact request:', { userId, contact });

  if (!userId || !contact) {
    console.log('Missing required fields:', { userId, contact });
    return res.status(400).json({ error: 'userId and contact are required' });
  }

  try {
    console.log('Finding user:', userId);
    const user = await User.findById(userId);
    console.log('Found user:', user);

    if (!user) {
      console.log('User not found');
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Updating user contact from', user.contact, 'to', contact);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { contact },
      { new: true }
    );
    console.log('Updated user:', updatedUser);

    return res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Error updating contact:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api', (req, res) => {
  console.log('Request received');
  res.json({ message: 'Hello from server!' });
});
// TODO how to combine server.js and index.js?

app.get('/api/auth/google', googleAuth);

app.get('/api/auth/validate', validateSession);

// Get user's friends
app.get('/api/users/:userId/friends', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('friends', 'name email contact image');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ friends: user.friends });
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

// Add friend (follow user)
app.post('/api/users/:userId/friends', async (req, res) => {
  try {
    const { friendId } = req.body;
    
    if (!friendId) {
      return res.status(400).json({ error: 'friendId is required' });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if friend exists
    const friend = await User.findById(friendId);
    if (!friend) {
      return res.status(404).json({ error: 'Friend not found' });
    }

    // Check if already friends
    if (user.friends.includes(friendId)) {
      return res.status(400).json({ error: 'Users are already friends' });
    }

    // Add friend to user's friends array
    user.friends.push(friendId);
    await user.save();

    // Create notification for the person being followed
    const notification = new Notification({
      userId: friendId,
      type: 'new_follower',
      followerId: user._id,
      message: `${user.name} started following you`
    });
    await notification.save();

    const updatedUser = await User.findById(req.params.userId)
      .populate('friends', 'name email contact image');

    res.json({ success: true, friends: updatedUser.friends });
  } catch (error) {
    console.error('Error adding friend:', error);
    res.status(500).json({ error: 'Failed to add friend' });
  }
});

// Backend logout endpoint
app.post('/api/auth/logout', (req, res) => {
  const cookieOptions = {
    httpOnly: true,
    path: '/',
    secure: false,
  };
  if (process.env.NODE_ENV === 'production') {
      cookieOptions.secure = true;
      cookieOptions.sameSite = 'none';
  }
  res.clearCookie('jwt', cookieOptions);
  res.status(200).json({ message: 'Logged out' });
});

// Update user profile
app.post('/api/updateProfile', async (req, res) => {
  const { userId, bio, instagram } = req.body;
  console.log('Update profile request:', { userId, bio, instagram });

  if (!userId) {
    console.log('Missing required field: userId');
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    console.log('Finding user:', userId);
    const user = await User.findById(userId);
    console.log('Found user:', user);

    if (!user) {
      console.log('User not found');
      return res.status(404).json({ error: 'User not found' });
    }

    // Update only the fields that are provided
    const updateData = {};
    if (bio !== undefined) updateData.bio = bio;
    if (instagram !== undefined) updateData.instagram = instagram;

    console.log('Updating user with data:', updateData);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    );
    console.log('Updated user:', updatedUser);

    return res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
