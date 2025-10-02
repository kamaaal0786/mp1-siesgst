// server.js (Updated for Socket.IO)
require('dotenv').config();
const Message = require('./models/Message');
const { translateText } = require('./services/translationService');
const User = require('./models/User');
const express = require('express');
const http = require('http'); // 1. Import Node's built-in http module
const { Server } = require("socket.io"); // 2. Import the Server class from socket.io

const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');


console.log('Value of JWT_SECRET on startup:', process.env.JWT_SECRET);

const app = express();
const server = http.createServer(app); // 3. Create an HTTP server with our Express app

// 4. Initialize Socket.IO and attach it to the server
// We configure CORS for Socket.IO to allow our frontend origin
const io = new Server(server, {
  cors: {
    origin: "*", // For development, allow any origin. For production, restrict this to your frontend URL.
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());


// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));


// --- Socket.IO Connection Logic ---
const userSocketMap = new Map();

// --- Socket.IO Connection Logic (FINAL, ROBUST VERSION) ---
io.on('connection', (socket) => {
    console.log('✅ A user connected:', socket.id);

    socket.on('storeUserId', (userId) => {
        userSocketMap.set(userId, socket.id);
        socket.userId = userId;
        console.log(`User ${userId} mapped to socket ${socket.id}`);
    });

    socket.on('privateMessage', async ({ recipientId, message }) => {
        try {
            const sender = await User.findById(socket.userId);
            const recipient = await User.findById(recipientId);

            if (!sender || !recipient) return;

          const translatedMessage = await translateText(message, sender.nativeLanguage, recipient.nativeLanguage);
            const newMessage = new Message({
        senderId: sender._id,
        recipientId: recipient._id,
        originalMessage: message,
        translatedMessage: translatedMessage
      });
      await newMessage.save();
            const recipientSocketId = userSocketMap.get(recipientId);

            if (recipientSocketId) {
                io.to(recipientSocketId).emit('privateMessage', {
                    senderId: socket.userId,
                    originalMessage: message,
                    translatedMessage: translatedMessage,
                });
            }
        } catch (error) {
            console.error('Error handling private message:', error);
        }
    });

    socket.on('disconnect', () => {
        if (socket.userId) {
            userSocketMap.delete(socket.userId);
        }
        console.log('❌ A user disconnected:', socket.id);
    });
});

// --- Server Startup Logic ---
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    // 5. Start the server using server.listen() instead of app.listen()
    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to the database. Server did not start.", error);
  }
};

startServer();