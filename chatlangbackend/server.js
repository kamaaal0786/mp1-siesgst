const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect DB
connectDB();

// Middleware
app.use(cors());
app.use(express.json()); // so backend can read JSON

// Routes
app.use("/api/auth", require("./routes/authRoutes"));

// Test Route
app.get("/", (req, res) => {
  res.send("✅ API is running...");
});

app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
