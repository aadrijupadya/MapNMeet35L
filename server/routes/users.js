import express from 'express';
import User from '../models/UserModel.js'; 

const router = express.Router();

/**
 * GET /api/users/by-email?email=user@example.com
 * Returns user info (excluding sensitive fields like password)
 */
router.get('/', async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    try {
        const user = await User.findById(id)
            .select('name email bio instagram contact image dateJoined admin active') // return safe fields only
            .populate('friends', 'name email image')
            .populate('activities'); // optional

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        console.error('Error fetching user by ID:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
