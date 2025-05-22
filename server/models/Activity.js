import mongoose from 'mongoose';

const ActivitySchema = new mongoose.Schema({
  title: String,
  description: String,
  location: String,
  time: Date,
  participantCount: Number,
  contact: String,
  creator: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Activity', ActivitySchema);
