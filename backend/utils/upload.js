const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { File } = require("../model/file");

// Configure storage for multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // Save files in the 'uploads' directory
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Use original name for now
    },
});

// Check file type (only PDF allowed)
const fileFilter = (req, file, cb) => {
    // Allow only PDFs
    if (file.mimetype === "application/pdf") {
        cb(null, true);
    } else {
        cb(new Error("Only PDF files are allowed"), false); // Reject non-PDF files
    }
};

// Create multer instance to handle multiple file uploads
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Max size of 10MB for each file
    fileFilter,
}).array("files", 5); // Accept up to 5 files at once

// Helper function to check if file exists in the file system
const fileExistsInDirectory = async (filePath) => {
  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
    return true; // File exists
  } catch (err) {
    return false; // File does not exist
  }
};

// Controller to handle file upload
const uploadFile = async (req, res) => {
    console.log("eededferdf");
    if (!req.files || req.files.length === 0) {
      return res.status(400).send("No files uploaded");
    }
  
    // Process and check for duplicate files
    const filesToCheck = req.files.map((file) => ({
      filename: file.filename,
      originalname: file.originalname,
    }));
  
    const fileExistencePromises = filesToCheck.map(async (file) => {
      const fileExistsInDb = await File.findOne({ filename: file.filename }).exec();
      return { file, fileExistsInDb };
    });
  
    try {
      const results = await Promise.all(fileExistencePromises);
      for (let result of results) {
        const { file, fileExistsInDb } = result;
        if (fileExistsInDb) {
          return res.status(400).send(`File ${file.originalname} already exists`);
        }
      }
  
      // Proceed with saving the file metadata to the database
      const filesData = req.files.map((file) => ({
        filename: file.filename,
        sizeMB: file.size / (1024 * 1024), // Convert size to MB
        uploadedAt: new Date(),
      }));
  
      await File.insertMany(filesData);
      res.status(200).send("Files uploaded successfully");
  
    } catch (err) {
      return res.status(500).send("Error checking file existence or saving metadata");
    }
  };
  


// Middleware to handle file upload error (Multer)
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // Multer errors (e.g., file size exceeded, too many files)
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).send("File size exceeds 10 MB limit");
        }
        if (err.code === "LIMIT_FILE_COUNT") {
            return res.status(400).send("Too many files uploaded. Maximum 5 files are allowed.");
        }
        console.log("sdfsdfdsfsdfds");
        return res.status(400).send(err.message); // Handle other Multer errors
    }

    if (err) {
        return res.status(400).send(err.message); // General error (non-PDF files)
    }

    next(); // No errors, continue to the next middleware
};

module.exports = { upload, uploadFile, handleMulterError };
