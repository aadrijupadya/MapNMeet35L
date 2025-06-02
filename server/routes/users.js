import express from 'express';
import mongoose from 'mongoose';
import User from '../models/UserModel.js'; 

const router = express.Router();

/**
 * GET /api/users/:id
 * Returns user info (excluding sensitive fields like password)
 */
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    try {
        const user = await User.findById(id)
            .select('name email bio instagram contact image dateJoined admin active friends activities followers following')
            .populate('friends', 'name email image')
            .populate('activities')
            .populate('followers', 'name email image')
            .populate('following', 'name email image')
            .lean(); // Convert to plain JavaScript object

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Ensure arrays exist even if they're not in the document
        user.followers = user.followers || [];
        user.following = user.following || [];
        user.friends = user.friends || [];
        user.activities = user.activities || [];

        res.json(user);
    } catch (err) {
        console.error('Error fetching user by ID:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
