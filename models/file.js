const mongoose = require("mongoose");
// keeps track of downloads to avoid counting logs each time
const fileSchema = new mongoose.Schema({
  filename: {type: String,required: true},

  originalName: {type: String},

  path: {type: String,required: true},

  size: {type: Number,required: true},
  
  owner: {type: mongoose.Schema.Types.ObjectId,ref: "User",required: true},

  sharedWith: [{type: mongoose.Schema.Types.ObjectId,ref: "User"}],

  downloadLimit: {type: Number,default: 3,min: 1},

  downloadCount: {type: Number,default: 0},

  createdAt: {type: Date,default: Date.now}
});

module.exports = mongoose.model("File", fileSchema);