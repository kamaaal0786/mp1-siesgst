// routes/profileRoutes.js

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');

// @route   GET /api/profile/me
// @desc    Get current user's profile
// @access  Private
router.get('/me', protect, async (req, res) => {
    try {
        // req.user.id is available from the 'protect' middleware
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/profile/me
// @desc    Update current user's profile
// @access  Private
router.put('/me', protect, async (req, res) => {
    const { username, nativeLanguage, targetLanguage } = req.body;
    try {
        const user = await User.findById(req.user.id);

        if (user) {
            user.username = username || user.username;
            user.nativeLanguage = nativeLanguage || user.nativeLanguage;
            user.targetLanguage = targetLanguage || user.targetLanguage;
            
            const updatedUser = await user.save();
            res.json(updatedUser);
        } else {
            res.status(404).json({ msg: 'User not found' });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;