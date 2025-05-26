import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import activitiesRouter from './routes/activities.js';
// import authController from './controllers/authController.js'; TODO: Fix this import
// const authController = require('./controllers/authController');
import { googleAuth } from './controllers/authController.js'; // include the .js extension
import compression from 'compression';
import { validateSession } from './controllers/authController.js';
import cookieParser from 'cookie-parser';
import Activity from './models/Activity.js';
import User from "./models/UserModel.js"

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

app.post('/api/addParticipant', async (req, res) => {
  const userID = req.body.userId
  const activityID = req.body.activityId

  if (!userID || !activityID) {
    console.log(userID, activityID )
    return res.status(400).json({ error: 'userID and activityID are required' });
  }

  try {
    // Fetch the activity to check joinees and participant count
    const activity = await Activity.findById(activityID);

    if (!activity) {
      console.log("ACTIVITY_NOT_FOUND")
      return res.status(404).json({ error: 'ACTIVITY_NOT_FOUND' });
    }

    // Check if the joinees field length is equal to the participant count
    if (activity.joinees.length >= activity.participantCount) {
      console.log("ACTIVITY_FULL")
      return res.status(400).json({ error: 'ACTIVITY_FULL' });
    }

    // Add the userID to the activity's joinees array
    activity.joinees.addToSet(userID);

    // Save the updated activity
    await activity.save();

    // Update the user's activities field with the activity ID
    const userUpdate = await User.findByIdAndUpdate(
      userID,
      { $addToSet: { activities: activityID } }, // $addToSet ensures no duplicates
      { new: true } // Return the updated document
    );

    if (!userUpdate) {
      return res.status(404).json({ error: 'USER_NOT_FOUND' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
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

app.listen(port, () => console.log(`Server running on port ${port}`));
