const mongoose = require("mongoose");

const accessSchema = new mongoose.Schema({
  file: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "File",
    required: true
  },

  sharedWith: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  token: {
    type: String,
    required: true,
    unique: true
  },

  expiry: {
    type: Date,
    required: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// prevent duplicate share entries at DB level
accessSchema.index({ file: 1, sharedWith: 1 }, { unique: true });

module.exports = mongoose.model("Access", accessSchema);