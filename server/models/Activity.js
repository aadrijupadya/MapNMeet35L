import mongoose from 'mongoose';
import validator from 'validator';

const ActivitySchema = new mongoose.Schema({
  title: String,
  description: String,
  location: String,
  locationName: String,
  time: Date, // when the activity will happen
  endTime: Date,
  participantCount: Number, // max participant count
  // contact: String, // preferred contact of creator
  // creator: String, // name of the creator
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  joinees: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  
  createdAt: { 
    type: Date, 
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    // Automatically set to one day after activityDate
    default: function () {
      return new Date(this.endTime + 24 * 60 * 60 * 1000); // +1 day
    },
    expires: 0 // expire exactly at `expiresAt`
  },
  
});

export default mongoose.model('Activity', ActivitySchema);