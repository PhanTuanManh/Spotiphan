// index.js

import { clerkMiddleware } from "@clerk/express";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fileUpload from "express-fileupload";
import fs from "fs";
import { createServer } from "http";
import cron from "node-cron";
import path from "path";
import { initializeSocket } from "./lib/socket.js";
import { connectDB } from "./lib/db.js";
import redisClient from "./lib/redis.js"; // Thêm Redis client
import { errorHandler } from "./middleware/error.middleware.js"; // Middleware xử lý lỗi

import adminRoutes from "./routes/admin.route.js";
import albumRoutes from "./routes/album.route.js";
import authRoutes from "./routes/auth.route.js";
import songRoutes from "./routes/song.route.js";
import statRoutes from "./routes/stat.route.js";
import userRoutes from "./routes/user.route.js";

dotenv.config();

const __dirname = path.resolve();
const app = express();
const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);
initializeSocket(httpServer);

// Kết nối Redis
redisClient.connect().then(() => console.log("✅ Connected to Redis"));

// Middleware
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(clerkMiddleware());
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: path.join(__dirname, "tmp"),
    createParentPath: true,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  })
);

// Cron job: Dọn dẹp thư mục tạm mỗi giờ
const tempDir = path.join(process.cwd(), "tmp");
cron.schedule("0 * * * *", () => {
  if (fs.existsSync(tempDir)) {
    fs.readdir(tempDir, (err, files) => {
      if (err) return console.error("Error reading temp dir:", err);
      files.forEach((file) => fs.unlink(path.join(tempDir, file), () => {}));
    });
  }
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/songs", songRoutes);
app.use("/api/albums", albumRoutes);
app.use("/api/stats", statRoutes);

// Serve frontend in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../frontend", "dist", "index.html"));
  });
}

// Middleware xử lý lỗi tập trung
app.use(errorHandler);

// Start server
httpServer.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await connectDB();
  console.log("✅ Connected to MongoDB");
});
