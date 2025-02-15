// src/lib/cronJobs.js

import cron from "node-cron";
import { updateTrendingPlaylist } from "./controllers/playlist.controller.js";

// Chạy tự động vào 0h sáng mỗi ngày
cron.schedule("0 0 * * *", async () => {
  await updateTrendingPlaylist();
  console.log("✅ Trending Playlist updated at midnight.");
});
