import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
    console.log('[AUTH DEBUG] Login request body:', req.body);
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username: username.toLowerCase(), isActive: true });

        if (!user) {
            console.log(`Login attempt failed: User '${username}' not found or inactive`);
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // Simple password check (in production, use bcrypt!)
        if (user.password !== password) {
            console.log(`Login attempt failed: Invalid password for user '${username}'`);
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        res.json({
            token: `token-${user._id}-${Date.now()}`, // Simple token (use JWT in production)
            user: {
                _id: user._id,
                username: user.username,
                name: user.name,
                role: user.role,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get current user profile
router.get('/profile', async (req, res) => {
    try {
        // In production, verify JWT token here
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'No token provided' });
        }

        // Extract user ID from simple token
        const token = authHeader.replace('Bearer ', '');
        const userId = token.split('-')[1];

        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
