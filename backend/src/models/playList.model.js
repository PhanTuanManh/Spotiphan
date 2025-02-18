// src/models/playList.model.js
import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        songs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Song" }],
        isPublic: { type: Boolean, default: false },
        followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Người dùng đã lưu playlist vào thư viện
        category: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
    },
    { timestamps: true }
);

export const Playlist = mongoose.model("Playlist", playlistSchema);
