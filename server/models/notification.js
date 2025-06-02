import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true // Add index for better query performance
    },
    type: {
        type: String,
        required: true,
        enum: ['new_participant', 'activity_update', 'activity_cancelled', 'new_follower']
    },
    activityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activity',
        required: function() {
            return this.type !== 'new_follower';
        }
    },
    followerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: function() {
            return this.type === 'new_follower';
        }
    },
    message: {
        type: String,
        required: true
    },
    read: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true // Automatically add createdAt and updatedAt fields
});

// Add index for common queries
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

// Add TTL index to automatically delete read notifications after 24 hours
notificationSchema.index({ readAt: 1 }, { expireAfterSeconds: 86400 }); // 24 hours = 86400 seconds

// Pre-save middleware to set readAt when notification is marked as read
notificationSchema.pre('save', function(next) {
    if (this.isModified('read') && this.read) {
        this.readAt = new Date();
    }
    next();
});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification; 