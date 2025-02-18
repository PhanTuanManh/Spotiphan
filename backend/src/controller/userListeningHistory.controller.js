import mongoose from "mongoose";
import { Song } from "../models/song.model.js";
import { User } from "../models/user.model.js";
import { UserListeningHistory } from "../models/userListeningHistory.model.js";

/**
 * @route POST /history/track
 * @desc Lưu lịch sử nghe nhạc của người dùng nếu bài hát đã được nghe đủ lâu
 * @access Private
 */
export const trackSongListening = async (req, res, next) => {
    try {
        let userId = req.auth.userId; // Lấy từ middleware xác thực
        const { songId, playedDuration } = req.body;

        // Kiểm tra nếu userId không hợp lệ
        if (!mongoose.Types.ObjectId.isValid(songId)) {
            return res.status(400).json({ message: "Bài hát không hợp lệ" });
        }

        // Kiểm tra nếu `playedDuration` không hợp lệ
        if (!playedDuration || isNaN(playedDuration) || playedDuration <= 0) {
            return res.status(400).json({ message: "Thời gian nghe không hợp lệ" });
        }

        // Tìm User dựa trên `clerkId`
        const user = await User.findOne({ clerkId: userId });
        if (!user) return res.status(404).json({ message: "User không tồn tại" });

        // Lấy `ObjectId` thực sự của User từ MongoDB
        const mongoUserId = user._id;

        // Kiểm tra bài hát có tồn tại không
        const song = await Song.findById(songId);
        if (!song) return res.status(404).json({ message: "Bài hát không tồn tại" });

        // Chỉ lưu nếu user đã nghe trên 30 giây hoặc 50% bài hát
        if (playedDuration < 30 && playedDuration / song.duration < 0.5) {
            return res.status(400).json({ message: "Chưa nghe đủ lâu để lưu vào lịch sử" });
        }

        // Kiểm tra nếu bài hát đã có trong lịch sử, cập nhật `listenedAt`
        const existingHistory = await UserListeningHistory.findOne({ userId: mongoUserId, songId });

        if (existingHistory) {
            existingHistory.listenedAt = Date.now();
            await existingHistory.save();
        } else {
            // Nếu chưa nghe bài hát này trước đó, thêm vào lịch sử
            await UserListeningHistory.create({ userId: mongoUserId, songId });
        }
        song.listenCount += 1;
        await song.save();

        res.status(200).json({ message: "Lịch sử nghe nhạc đã được cập nhật & listenCount đã tăng" });
    } catch (error) {
        console.error("❌ Lỗi khi lưu lịch sử nghe nhạc:", error);
        next(error);
    }
};

/**
 * @route GET /history
 * @desc Lấy lịch sử nghe nhạc của người dùng (Hỗ trợ phân trang)
 * @access Private
 */
export const getListeningHistory = async (req, res, next) => {
    try {
        let userId = req.auth.userId;
        const { limit = 20, page = 1 } = req.query;
        const skip = (page - 1) * limit;

        // Tìm User dựa trên `clerkId`
        const user = await User.findOne({ clerkId: userId });
        if (!user) return res.status(404).json({ message: "User không tồn tại" });

        const mongoUserId = user._id; // Lấy `ObjectId` từ MongoDB

        let filter = { userId: mongoUserId };
        if (startDate || endDate) {
            filter.listenedAt = {};
            if (startDate) filter.listenedAt.$gte = new Date(startDate);
            if (endDate) filter.listenedAt.$lte = new Date(endDate);
        }

        // Truy vấn lịch sử nghe nhạc
        const history = await UserListeningHistory.find({ userId: mongoUserId })
            .populate({
                path: "songId",
                select: "title artist imageUrl audioUrl duration",
                populate: { path: "artist", select: "fullName imageUrl" }
            })
            .sort({ listenedAt: -1 }) // Mới nghe gần đây trước
            .limit(parseInt(limit))
            .skip(skip);

        const total = await UserListeningHistory.countDocuments({ userId: mongoUserId });
        const totalPages = Math.ceil(total / limit);

        res.status(200).json({ message: "Lịch sử nghe nhạc của bạn", history, totalPages });
    } catch (error) {
        console.error("❌ Lỗi khi lấy lịch sử nghe nhạc:", error);
        next(error);
    }
};
