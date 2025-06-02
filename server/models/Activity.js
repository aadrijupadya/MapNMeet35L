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
  cancelled: {
    type: Boolean,
    default: false
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    // Automatically set to one day after activityDate
    default: function () {
      if (this.endTime) {
        return new Date(new Date(this.endTime).getTime() + 24 * 60 * 60 * 1000); // +1 day
      } else if (this.createdAt) {
        return new Date(new Date(this.createdAt).getTime() + 24 * 60 * 60 * 1000 * 14)
      } else {
        return Date.now + 24 * 60 * 60 * 1000
      }
    },
    expires: 0 // expire exactly at `expiresAt`
  },
});

export default mongoose.model('Activity', ActivitySchema);