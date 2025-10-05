require('dotenv').config();
const Message = require('./models/Message');
const { translateText } = require('./services/translationService');
const User = require('./models/User');
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');

const app = express();
// This is crucial for Render/Vercel to trust the proxy and handle HTTPS correctly.
app.set('trust proxy', 1);

const server = http.createServer(app);

// --- START: CORRECT CORS CONFIGURATION ---

// Define the single, correct URL of your deployed frontend.
// IMPORTANT: Replace this with your actual frontend URL.
const frontendURL = "https://mp1-siesgst.vercel.app"; 

// Apply CORS middleware to all Express routes.
app.use(cors({
  origin: frontendURL,
  credentials: true
}));

// Initialize Socket.IO with a strict and correct CORS policy.
const io = new Server(server, {
  cors: {
    origin: frontendURL,
    methods: ["GET", "POST"],
    credentials: true
  }
});
// --- END: CORRECT CORS CONFIGURATION ---


app.use(express.json());

// --- Health Check Route ---
// This route responds to the hosting platform's health checks to keep the server alive.
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send('Server is healthy and running!');
});


// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));


// --- Socket.IO Connection Logic ---
const userSocketMap = new Map();

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
    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to the database. Server did not start.", error);
  }
};

startServer();