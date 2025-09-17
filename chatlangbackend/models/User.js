// models/User.js

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  nativeLanguage: { type: String, required: true },
  targetLanguage: { type: String, required: true },
}, {
  timestamps: true, // Adds createdAt and updatedAt timestamps
});

const User = mongoose.model('User', userSchema);

module.exports = User;