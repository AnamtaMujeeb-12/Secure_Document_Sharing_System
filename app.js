const express = require("express");
const path = require("path");

const app = express();

//MIDDLEWARE

// log requests (optional but fine)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// parse JSON
app.use(express.json());

// serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


//ROUTES
app.use("/api/auth", require("./routes/auth"));
app.use("/api/files", require("./routes/file"));


//ROOT
app.get("/", (req, res) => {
  res.send("Secure Document Sharing API is running");
});


module.exports = app;