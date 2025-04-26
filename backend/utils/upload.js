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
    cb(null,file.originalname); // Use timestamp to avoid name conflicts
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

// Controller to handle file upload
// Assuming you have a file model in your DB

const uploadFile = (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send("No files uploaded");
  }

  // Create an array to track existing files (either in database or on disk)
  const filesToCheck = req.files.map((file) => ({
    filename: file.filename,
    originalname: file.originalname,
  }));

  // Check for existing files in the uploads folder and database
  const fileExistencePromises = filesToCheck.map((file) => {
    const filePath = path.join(__dirname, `../uploads/${file.filename}`);

    // Check if the file already exists in the directory
    const fileExistsInDirectory = fs.existsSync(filePath);

    // Check if the file already exists in the database
    const fileExistsInDb = File.findOne({ filename: file.filename }).exec();

    return Promise.all([fileExistsInDirectory, fileExistsInDb]);
  });

  Promise.all(fileExistencePromises)
    .then((results) => {
      // Check if any file exists in either the directory or the database
      for (let i = 0; i < results.length; i++) {
        const [fileExistsInDirectory, fileExistsInDb] = results[i];
        const file = filesToCheck[i];

        // If file exists in the directory or database, send error
        if (fileExistsInDirectory || fileExistsInDb) {
          return res.status(400).send(`File ${file.originalname} already exists`);
        }
      }

      // Proceed with saving the file metadata to the database
      const filesData = req.files.map((file) => ({
        filename: file.filename,
        sizeMB: file.size / (1024 * 1024), // Convert size to MB
        uploadedAt: new Date(),
      }));

      // Save file metadata to the database
      File.insertMany(filesData)
        .then(() => res.status(200).send("Files uploaded successfully"))
        .catch((err) => res.status(500).send("Error saving file metadata"));
    })
    .catch((err) => {
      return res.status(500).send("Error checking file existence");
    });
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
    return res.status(400).send(err.message); // Handle other Multer errors
  }

  if (err) {
    return res.status(400).send(err.message); // General error (non-PDF files)
  }

  next(); // No errors, continue to the next middleware
};

module.exports = { upload, uploadFile, handleMulterError };
