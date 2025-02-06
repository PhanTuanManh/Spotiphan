import { Song } from "../models/song.model.js";
import { UserListeningHistory } from "../models/userListeningHistory.model.js";

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

// Lấy bài hát nổi bật (6 bài hát ngẫu nhiên)
export const getFeaturedSongs = async (req, res, next) => {
  try {
    const songs = await Song.aggregate([
      { $sample: { size: 6 } },
      {
        $project: {
          _id: 1,
          title: 1,
          artist: 1,
          imageUrl: 1,
          audioUrl: 1,
          duration: 1,
        },
      },
    ]);

    res.status(200).json({ success: true, data: songs });
  } catch (error) {
    next(error);
  }
};

// Lấy bài hát "Dành cho bạn" (dựa trên lịch sử nghe nhạc của người dùng)
export const getMadeForYouSongs = async (req, res, next) => {
  try {
    const userId = req.user._id; // Giả sử user ID được lấy từ middleware xác thực

    // Lấy top 10 bài hát người dùng nghe nhiều nhất
    const topSongs = await UserListeningHistory.aggregate([
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

    res.status(200).json({
      success: true,
      data: {
        title: "Made For You",
        songs: topSongs,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Lấy bài hát thịnh hành (dựa trên số lượt nghe)
export const getTrendingSongs = async (req, res, next) => {
  try {
    const songs = await Song.find()
      .sort({ listenCount: -1 })
      .limit(10)
      .select("title artist imageUrl audioUrl duration");

    res.status(200).json({
      success: true,
      data: {
        title: "Trending Songs",
        songs,
      },
    });
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