// routes/authRoutes.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// --- REGISTER ROUTE (Stays the same) ---
router.post('/register', async (req, res) => {
  // 1. Get the new language fields from the request body
  const { username, email, password, nativeLanguage, targetLanguage } = req.body;

  try {
    // ... (your existing user check logic is fine)
    let user = await User.findOne({ email });
    if (user) { /* ... */ }
    user = await User.findOne({ username });
    if (user) { /* ... */ }


    // 2. Create the new user with the language fields included
    user = new User({
      username,
      email,
      password,
      nativeLanguage,
      targetLanguage,
    });

    // ... (the rest of the logic remains the same)
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    
    // ... (JWT logic remains the same)
    const payload = { user: { id: user.id } };
    jwt.sign( /* ... */ );

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});



// --- LOGIN ROUTE (Updated) ---
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    // 2. Compare submitted password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    // 3. If credentials are correct, create and return a JWT
    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token }); // Send the token for a successful login
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;