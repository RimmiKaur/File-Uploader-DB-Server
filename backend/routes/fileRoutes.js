const express = require("express");
const {  getFiles, deleteFile } = require("../controllers/fileController");
const { uploadFile, handleMulterError, upload } = require("../utils/upload");

const router = express.Router();

// Upload multiple files
router.post("/upload", upload, uploadFile, handleMulterError);

// Get all files with filters, search, and pagination
router.get("/files", getFiles);

// Delete a file by its filename
router.delete("/files/:filename", deleteFile); // Use DELETE method for removing files

module.exports = router;
