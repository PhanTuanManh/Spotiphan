import { Song } from "../models/song.model.js";
import { UserListeningHistory } from "../models/userListeningHistory.model.js";
import mongoose from "mongoose";

// Lấy tất cả bài hát (có phân trang)
export const getAllSongs = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const songs = await Song.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Song.countDocuments();

    res.status(200).json({
      success: true,
      data: songs,
      pagination: {
        page: +page,
        limit: +limit,
        total,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Lấy bài hát nổi bật (6 bài hát nổi bật)
export const getFeaturedSongs = async (req, res, next) => {
  try {
    const songs = await Song.find({ isFeatured: true })
      .limit(6)
      .select("title artist imageUrl audioUrl duration");

    res.status(200).json({ success: true, data: songs });
  } catch (error) {
    next(error);
  }
};

// Lấy bài hát "Dành cho bạn" (dựa trên lịch sử nghe nhạc của người dùng)
export const getMadeForYouSongs = async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const MIN_HISTORY = 5; // Số bài hát tối thiểu trong lịch sử để đề xuất

    // Bước 1: Lấy lịch sử nghe của người dùng
    const userHistory = await UserListeningHistory.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      { $group: { _id: "$songId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "songs",
          localField: "_id",
          foreignField: "_id",
          as: "song",
        },
      },
      { $unwind: "$song" },
      {
        $project: {
          _id: "$song._id",
          title: "$song.title",
          artist: "$song.artist",
          imageUrl: "$song.imageUrl",
          audioUrl: "$song.audioUrl",
          duration: "$song.duration",
        },
      },
    ]);

    // Bước 2: Nếu không đủ lịch sử, đề xuất bài hát phổ biến
    if (userHistory.length < MIN_HISTORY) {
      const popularSongs = await Song.find()
        .sort({ listenCount: -1 })
        .limit(10)
        .select("title artist imageUrl audioUrl duration");

      return res.status(200).json({
        success: true,
        data: {
          title: "Popular Songs",
          songs: popularSongs,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        title: "Made For You",
        songs: userHistory,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Lấy bài hát thịnh hành (dựa trên số lượt nghe trong 7 ngày gần nhất)
export const getTrendingSongs = async (req, res, next) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const songs = await Song.find({
      lastListenedAt: { $gte: sevenDaysAgo }, // Lọc bài hát được nghe trong 7 ngày qua
    })
      .sort({ listenCount: -1 })
      .limit(10)
      .select("title artist imageUrl audioUrl duration");

    res.status(200).json({ success: true, data: songs });
  } catch (error) {
    next(error);
  }
};

// Lấy thông tin chi tiết bài hát theo ID
export const getSongDetails = async (req, res, next) => {
  try {
    const { songId } = req.params;
    const song = await Song.findById(songId);

    if (!song) {
      return res.status(404).json({ success: false, message: "Song not found" });
    }

    res.status(200).json({ success: true, data: song });
  } catch (error) {
    next(error);
  }
};