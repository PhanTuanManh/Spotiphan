import cron from "node-cron";
import fs from "fs";
import { updateTrendingPlaylist } from "../controllers/playlist.controller.js";

// **Ghi log vào file**
const logToFile = (message) => {
    const timestamp = new Date().toISOString();
    fs.appendFileSync("cronjob_logs.txt", `[${timestamp}] ${message}\n`);
};

// **Chạy job mỗi 6 tiếng (00:00, 06:00, 12:00, 18:00)**
cron.schedule("0 */6 * * *", async () => {
    console.log("🔄 Running Trending Playlist Update...");
    logToFile("🔄 Running Trending Playlist Update...");

    try {
        await updateTrendingPlaylist();
        console.log("✅ Trending Playlist Updated Successfully!");
        logToFile("✅ Trending Playlist Updated Successfully!");
    } catch (error) {
        console.error("❌ Error in Trending Playlist cron job:", error);
        logToFile(`❌ Error: ${error.message}`);
    }
});
