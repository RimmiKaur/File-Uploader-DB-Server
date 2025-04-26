// server.js
const express = require("express");
const mongoose = require("mongoose");
const router = require("./backend/routes/fileRoutes");
const cors = require("cors");

require("dotenv").config();

const app = express();

// Enable CORS with detailed settings
app.use(cors({
  origin: "https://files-uploader-db.vercel.app", // Your frontend URL
  methods: ["GET", "POST", "DELETE", "PUT", "OPTIONS"], // Add other HTTP methods if necessary
  allowedHeaders: ["Content-Type", "Authorization"], // Specify allowed headers (like Authorization if needed)
  credentials: true, // Allow cookies and other credentials
}));


// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("Failed to connect to MongoDB", err));

// Middleware
app.use(express.json());
app.use("/uploads", express.static("uploads")); // Serve uploaded files

// Routes
app.use("/api",router); // Mount routes

// Start server
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
