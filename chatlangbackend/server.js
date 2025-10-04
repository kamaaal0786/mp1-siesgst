// server.js (Corrected)
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const Message = require('./models/Message');
const User = require('./models/User');
const { translateText } = require('./services/translationService');

const app = express();
const server = http.createServer(app);

// --- CORS Configuration ---
// Define allowed origins for both Express and Socket.IO
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://mp1-siesgst.vercel.app', // Your production frontend URL
  'http://localhost:5500', // For local development
  'http://127.0.0.1:5500' // For local development
].filter(Boolean); // Filter out any undefined URLs

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
};

// Use CORS middleware for all API routes
app.use(cors(corsOptions));
app.use(express.json());


// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// --- Socket.IO Setup ---
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

const userSocketMap = new Map(); // Maps userId to socketId

io.on('connection', (socket) => {
    console.log('✅ A user connected:', socket.id);

    const userId = socket.handshake.query.userId;
    if (userId) {
        userSocketMap.set(userId, socket.id);
        console.log(`User ${userId} mapped to socket ${socket.id}`);
    }

    socket.on('privateMessage', async ({ recipientId, message }) => {
        try {
            const sender = await User.findById(socket.userId);
            const recipient = await User.findById(recipientId);

            if (!sender || !recipient) {
                console.error("Sender or recipient not found.");
                return;
            }

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
        // Find which userId disconnected and remove them from the map
        for (let [key, value] of userSocketMap.entries()) {
            if (value === socket.id) {
                userSocketMap.delete(key);
                break;
            }
        }
        console.log('❌ A user disconnected:', socket.id);
    });
});

// --- Server Startup ---
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();