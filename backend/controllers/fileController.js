const fs = require("fs");
const path = require("path");
const { File } = require("../model/file");




// Get all files with filters, search, and pagination
const getFiles = async (req, res) => {
  const { filename, size, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (filename) filter.filename = new RegExp(filename, "i"); // Case-insensitive search
  if (size) filter.sizeMB = { $lt: size };

  try {
    const files = await File.find(filter)
      .sort({ uploadedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    const totalFiles = await File.countDocuments(filter);

    res.json({
      files,
      totalFiles,
      totalPages: Math.ceil(totalFiles / limit),
      currentPage: page,
    });
  } catch (err) {
    res.status(500).send("Error fetching files");
  }
};

// Filter files logic
const filterFiles = async (req, res) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  try {
    const filteredFiles = await File.find({
      sizeMB: { $gte: 2, $lte: 5 },
      uploadedAt: { $gte: sevenDaysAgo },
    })
      .sort({ sizeMB: -1 }); // Sort by file size in descending order

    res.json(filteredFiles);
  } catch (err) {
    res.status(500).send("Error filtering files");
  }
};

const deleteFile = (req, res) => {
  const { filename } = req.params; // Get the filename from the request params

  // List all files in the 'uploads' directory
  const uploadsDir = path.resolve(__dirname, "../../uploads");

  // Log all files in the uploads directory
  fs.readdir(uploadsDir, (err, files) => {
      if (err) {
          return res.status(500).send("Error reading uploads directory");
      }

      console.log("Files in the uploads directory:");
      files.forEach((file) => {
          console.log(file);  // Log each file name
      });

      // Find the file metadata in the database
      File.findOne({ filename })
        .then((file) => {
          if (!file) {
            return res.status(404).send("File not found in the database");
          }
  
          // Construct the absolute file path in the 'uploads' directory
          const filePath = path.resolve(uploadsDir, filename);
  
          // Check if the file exists in the filesystem
          fs.access(filePath, fs.constants.F_OK, (err) => {
            // if (err) {
            //   return res.status(404).send("File not found in storage folder");
            // }
  
            // // File exists in the filesystem, so delete it
            // fs.unlink(filePath, (unlinkErr) => {
            //   if (unlinkErr) {
            //     return res.status(500).send("Error deleting file from server");
            //   }
  
              // After deleting the file from the filesystem, delete from the database
              File.findOneAndDelete({ filename })
                .then(() => {
                  res.status(200).send("File deleted successfully");
                })
                .catch((dbErr) => {
                  res.status(500).send("Error deleting file metadata from database");
                });
            // });
          });
        })
        .catch((err) => {
          res.status(500).send("Error fetching file from database");
        });
  });
};

  
  
  

module.exports = { getFiles, filterFiles , deleteFile};

