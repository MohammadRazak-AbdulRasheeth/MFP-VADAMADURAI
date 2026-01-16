import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.replace('Bearer ', '');
        const userId = token.split('-')[1];

        const user = await User.findById(userId);
        if (!user || user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Get all staff (admin only)
router.get('/', requireAdmin, async (req, res) => {
    try {
        const users = await User.find({ role: 'STAFF' })
            .select('-password')
            .sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create new staff (admin only)
router.post('/', requireAdmin, async (req, res) => {
    try {
        const { username, password, name, phone, email } = req.body;

        // Check if username already exists
        const existing = await User.findOne({ username: username.toLowerCase() });
        if (existing) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const user = new User({
            username: username.toLowerCase(),
            password, // In production, hash this!
            name,
            phone,
            email,
            role: 'STAFF',
            createdBy: req.user._id
        });

        const savedUser = await user.save();

        res.status(201).json({
            _id: savedUser._id,
            username: savedUser.username,
            name: savedUser.name,
            role: savedUser.role,
            isActive: savedUser.isActive
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update staff (admin only)
router.put('/:id', requireAdmin, async (req, res) => {
    try {
        const { name, phone, email, isActive, password } = req.body;

        const updateData = { name, phone, email, isActive };
        if (password) {
            updateData.password = password; // In production, hash this!
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'Staff not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete staff (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Staff not found' });
        }
        res.json({ message: 'Staff deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
