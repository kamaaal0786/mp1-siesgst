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

console.log('Value of JWT_SECRET on startup:', process.env.JWT_SECRET);

const app = express();
const server = http.createServer(app);

// ✅ **FIXED: Correct CORS Configuration**
const allowedOrigins = [
  'https://mpl-siesgst.vercel.app',
  'https://chatlang.vercel.app',
  'http://localhost:3000' // for local development
];

// ✅ **FIXED: Express CORS Middleware**
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// ✅ **ADD: Handle preflight requests**
app.options('*', cors()); // Enable preflight for all routes

app.use(express.json());

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));

// ✅ Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// ✅ Root route
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'ChatLang Backend API', 
    status: 'running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      messages: '/api/messages',
      profile: '/api/profile'
    }
  });
});

// ✅ **FIXED: Socket.IO CORS Configuration**
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

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

// ✅ **FIXED: Proper 404 handler (MUST be after all routes)**
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

// --- Server Startup Logic ---
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📍 Health check: https://chatlang-u6n3.onrender.com/health`);
      console.log(`📍 Allowed origins:`, allowedOrigins);
    });
  } catch (error) {
    console.error("Failed to connect to the database. Server did not start.", error);
    process.exit(1);
  }
};

startServer();