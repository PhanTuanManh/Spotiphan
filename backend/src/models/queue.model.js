// src/models/queue.model.js
import mongoose from "mongoose";

const queueSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        songs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Song" }],
        currentIndex: { type: Number, default: 0 }, // Vị trí bài hát đang phát
        isShuffled: { type: Boolean, default: false }, // Có bật chế độ random không?
        loopMode: { 
            type: String, 
            enum: ["none", "loop_playlist", "loop_song"], 
            default: "none" 
        }, // Loop 1 bài, loop playlist hoặc không loop
    },
    { timestamps: true }
);

export const Queue = mongoose.model("Queue", queueSchema);
