// routes/messageRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Message = require('../models/Message');

// @route   GET /api/messages/:otherUserId
// @desc    Get chat history with another user
// @access  Private
router.get('/:otherUserId', protect, async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const otherUserId = req.params.otherUserId;

        // Find messages between the two users
        const messages = await Message.find({
            $or: [
                { senderId: currentUserId, recipientId: otherUserId },
                { senderId: otherUserId, recipientId: currentUserId }
            ]
        }).sort({ createdAt: 1 }); // Sort by creation time

        res.json(messages);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;