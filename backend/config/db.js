import mongoose from "mongoose";

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri || String(uri).trim() === "") {
    console.error("\n[Watchify] Missing MONGO_URI in backend/.env");
    console.error("  1. Copy backend/.env.example to backend/.env");
    console.error("  2. Set MONGO_URI (local: mongodb://127.0.0.1:27017/watchify)");
    console.error("  3. Start MongoDB (mongod) or fix Atlas IP / connection string\n");
    process.exit(1);
  }
  try {
    await mongoose.connect(uri);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("\n[Watchify] MongoDB connection failed:", error.message);
    console.error("  • Local: ensure `mongod` is running and MONGO_URI matches your port/database.");
    console.error("  • Atlas: check Network Access (IP allowlist), user/password, and cluster host.\n");
    process.exit(1);
  }
};

export default connectDB;