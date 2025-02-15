import { Song } from "../models/song.model.js";
import { UserListeningHistory } from "../models/userListeningHistory.model.js";
import mongoose from "mongoose";

// Lấy tất cả bài hát đã được duyệt
export const getAllSongs = async (req, res, next) => {
  try {
    const songs = await Song.find({
      $or: [
        { isSingle: true, status: "approved" }, // Lấy Single đã duyệt
        { albumId: { $ne: null } } // Lấy bài hát có album
      ]
    })
    .populate({
      path: "albumId",
      match: { status: "approved" } // Chỉ lấy album đã duyệt
    })
    .sort({ createdAt: -1 });

    // Lọc bài hát hợp lệ
    const filteredSongs = songs.filter(song => song.isSingle || song.albumId);

    res.status(200).json({
      success: true,
      data: filteredSongs,
    });
  } catch (error) {
    next(error);
  }
};
