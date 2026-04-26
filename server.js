const app = require("./app");
const connectDB = require("./config/db");
require("dotenv").config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log("Starting server...");

    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing");
    }

    await connectDB();
    console.log("MongoDB connected");

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

  } catch (error) {
    console.error("FULL ERROR:", error);
    process.exit(1);
  }
};

startServer();