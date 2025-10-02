// routes/userRoutes.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/users
// @desc    Get all users except the logged-in one
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    // Find all users but exclude their password
    // Also, filter out the current user from the list
    const users = await User.find({ _id: { $ne: req.user.id } }).select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;