// src/models/userListeningHistory.model.js

import mongoose from "mongoose";
const userListeningHistorySchema = new mongoose.Schema(
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      songId: { type: mongoose.Schema.Types.ObjectId, ref: "Song", required: true },
      listenedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
  );
  
export const UserListeningHistory = mongoose.model("UserListeningHistory", userListeningHistorySchema);