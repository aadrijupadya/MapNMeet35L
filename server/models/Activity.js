import mongoose from 'mongoose';

const ActivitySchema = new mongoose.Schema({
    title: String,
    description: String,
    location: String,
    locationName: String,
    time: Date,
    participantCount: Number,
    contactInfo: String,
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Activity', ActivitySchema);