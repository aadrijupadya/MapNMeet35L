import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import activitiesRouter from './routes/activities.js';
// import authController from './controllers/authController.js'; TODO: Fix this import
// const authController = require('./controllers/authController');


dotenv.config();

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use('/api/activities', activitiesRouter);

app.listen(port, () => console.log(`Server running on port ${port}`));


app.get('/api', (req, res) => {
    res.json({ message: 'Hello from server!' });
});
// TODO how to combine server.js and index.js?

// app.get('/api/auth/google', authController.googleAuth);