const express = require("express");
const router = express.Router();
const multer = require("multer");

const File = require("../models/File");
const Access = require("../models/Access");
const User = require("../models/User");

const crypto = require("crypto");
const fs = require("fs");
const jwt = require("jsonwebtoken");

// -------- SIMPLE AUTH (replaces middleware) --------
const auth = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "No token" });
  }

  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id;
    next();
  } catch {
    res.status(401).json({ msg: "Invalid token" });
  }
};

// -------- MULTER --------
const upload = multer({ dest: "uploads/" });


// ================= FILE ROUTES =================

// UPLOAD FILE
router.post("/upload", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }

    const file = await File.create({
  filename: req.file.filename,
  originalName: req.file.originalname,
  path: req.file.path,
  size: req.file.size,
  owner: req.user
});

    res.status(201).json({
      message: "File uploaded successfully",
      file
    });

  } catch {
    res.status(500).json({ msg: "Upload failed" });
  }
});


// GET MY FILES
router.get("/my-files", auth, async (req, res) => {
  try {
    const files = await File.find({ owner: req.user });

    res.json({
      count: files.length,
      files
    });

  } catch {
    res.status(500).json({ msg: "Failed to fetch files" });
  }
});


// DELETE FILE (owner only)
router.delete("/:id", auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file || file.owner.toString() !== req.user) {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    await file.deleteOne();

    res.json({ message: "File deleted successfully" });

  } catch {
    res.status(500).json({ msg: "Delete failed" });
  }
});


// SHARE FILE
router.post("/share/:id", auth, async (req, res) => {
  try {
    const { userId } = req.body;

    const file = await File.findById(req.params.id);

    if (!file || file.owner.toString() !== req.user) {
      return res.status(403).json({ msg: "Not owner" });
    }

    if (userId === req.user) {
      return res.status(400).json({ msg: "Cannot share with yourself" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const existing = await Access.findOne({
      file: file._id,
      sharedWith: userId
    });

    if (existing) {
      return res.status(400).json({ msg: "Already shared" });
    }

    const token = crypto.randomBytes(16).toString("hex");
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await Access.create({
      file: file._id,
      sharedWith: userId,
      token,
      expiry
    });

    res.json({
      message: "File shared",
      link: `/api/files/download/${token}`
    });

  // } catch {
  //   res.status(500).json({ msg: "Share failed" });
  // }
  }catch (err) {
  console.log(err);
  res.status(500).json({ msg: err.message });
}
});


// ================= DOWNLOAD =================

// DOWNLOAD FILE
router.get("/download/:token", async (req, res) => {
  try {
    const access = await Access.findOne({ token: req.params.token });

    if (!access) {
      return res.status(404).json({ msg: "Invalid link" });
    }

    if (access.expiry < new Date()) {
      return res.status(403).json({ msg: "Link expired" });
    }

    const file = await File.findById(access.file);

    if (!file) {
      return res.status(404).json({ msg: "File not found" });
    }

    if (file.downloadCount >= file.downloadLimit) {
      return res.status(403).json({ msg: "Limit reached" });
    }

    file.downloadCount += 1;
    await file.save();

    res.download(file.path, file.originalName);

  } catch {
    res.status(500).json({ msg: "Download failed" });
  }
});


// ================= SHARED WITH ME =================

router.get("/shared-with-me", auth, async (req, res) => {
  try {
    const accessList = await Access.find({ sharedWith: req.user })
      .populate("file");

    res.json({
      count: accessList.length,
      files: accessList
    });

  } catch {
    res.status(500).json({ msg: "Failed to fetch shared files" });
  }
});


module.exports = router;