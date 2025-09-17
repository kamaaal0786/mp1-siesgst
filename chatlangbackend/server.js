// server.js (Updated for Socket.IO)

const express = require('express');
const http = require('http'); // 1. Import Node's built-in http module
const { Server } = require("socket.io"); // 2. Import the Server class from socket.io
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');

dotenv.config();

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


// --- Socket.IO Connection Logic ---
io.on('connection', (socket) => {
  console.log('✅ A user connected:', socket.id);

  // Listen for incoming chat messages from a client
  socket.on('chatMessage', (msg) => {
    console.log('📩 Message received:', msg);
    // Broadcast the message to all connected clients
     socket.broadcast.emit('chatMessage', msg);
  });

  // Listen for a client disconnecting
  socket.on('disconnect', () => {
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