// models/Message.js

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    originalMessage: {
        type: String,
        required: true
    },
    translatedMessage: {
        type: String
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;