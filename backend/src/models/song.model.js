// src/models/song.model.js
import mongoose from "mongoose";

const songSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
		artist: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        imageUrl: { type: String, required: true },
        audioUrl: { type: String, required: true },
        duration: { type: Number, required: true },
        albumId: { type: mongoose.Schema.Types.ObjectId, ref: "Album", required: false },
        listenCount: { type: Number, default: 0 },
        isFeatured: { type: Boolean, default: false },
        lastListenedAt: Date,
        likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Danh sách người dùng đã thích bài hát
        status: { type: String, enum: ["pending", "approved", "rejected", "archived"], default: "pending" },
        isSingle: { type: Boolean, default: false }
    },
    { timestamps: true }
);

export const Song = mongoose.model("Song", songSchema);
