import express from 'express';
import Notification from '../models/notification.js';
import { validateSession } from '../controllers/authController.js';

const router = express.Router();

// Create a new notification
router.post('/', validateSession, async (req, res) => {
    try {
        const notification = new Notification({
            userId: req.body.userId,
            type: req.body.type,
            activityId: req.body.activityId,
            followerId: req.body.followerId,
            message: req.body.message
        });

        await notification.save();
        res.status(201).json(notification);
    } catch (error) {asd
        res.status(400).json({ message: error.message });
    }
});

// Get all notifications for a user
router.get('/', validateSession, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const notifications = await Notification.find({ 
            userId: req.user._id,
            read: false // Only fetch unread notifications
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('activityId', 'title')
            .populate('followerId', 'name image'); // Populate follower details

        const total = await Notification.countDocuments({ 
            userId: req.user._id,
            read: false
        });

        res.json({
            notifications,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalNotifications: total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete a single notification
router.delete('/:id', validateSession, async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        await notification.deleteOne();
        res.json({ message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Mass delete notifications (with optional filters)
router.delete('/mass-delete', validateSession, async (req, res) => {
    try {
        const filter = {
            userId: req.user._id,
            ...req.body.filters // Additional filters like read status, type, etc.
        };

        const result = await Notification.deleteMany(filter);
        
        res.json({
            message: 'Notifications deleted',
            deletedCount: result.deletedCount
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Mark notification as read
router.patch('/:id/read', validateSession, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { 
                read: true,
                readAt: new Date() 
            },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Mark all notifications as read
router.patch('/mark-all-read', validateSession, async (req, res) => {
    try {
        const result = await Notification.updateMany(
            { userId: req.user._id, read: false },
            { 
                read: true,
                readAt: new Date()
            }
        );

        res.json({
            message: 'All notifications marked as read',
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router; 