// models/file.js
const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  filename: { type: String, required: true, unique: true},
  sizeMB: { type: Number, required: true },
  uploadedAt: { type: Date, required: true },
});
let File = mongoose.model("File", fileSchema);
module.exports = { File };
