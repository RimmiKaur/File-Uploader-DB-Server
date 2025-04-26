// server.js
const express = require("express");
const mongoose = require("mongoose");
const router = require("./backend/routes/fileRoutes");
const cors = require("cors");

require("dotenv").config();

const app = express();

// Enable CORS with detailed settings
const allowedOrigins = [
    "https://files-uploader-db.vercel.app", // production URL
    "http://localhost:3000", // development URL
  ];
  
  app.use(
    cors({
      origin: (origin, callback) => {
        if (allowedOrigins.includes(origin) || !origin) {
          // Allow requests from localhost (no origin) and production URL
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: ["GET", "POST", "DELETE", "PUT", "OPTIONS"],
      credentials: true, // Allow cookies or credentials
    })
  );
  

app.use(cors());
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

console.log("sdssddf");
