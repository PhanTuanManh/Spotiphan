import { clerkClient } from "@clerk/express";
import { Category } from "../models/category.model.js";
import { Playlist } from "../models/playList.model.js";
import { Song } from "../models/song.model.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";
import { uploadToCloudinary } from "../lib/cloudinary.js";
/**
 * @route POST /playlists
 * @desc Tạo một playlist mới (công khai hoặc riêng tư)
 * @access Premium, Artist, Admin
 */
export const createPlaylist = async (req, res, next) => {
    try {
        const { name, isPublic, songIds = [], category = [], imageUrl } = req.body;
        const userId = req.auth.userId;

        // Lấy thông tin user từ MongoDB
        const currentUser = await clerkClient.users.getUser(userId);
        const user = await User.findOne({ clerkId: currentUser.id });

        if (!user) {
            return res.status(404).json({ message: "User not found in database." });
        }

        console.log("User data:", user); // Kiểm tra xem có lấy đúng user không

        const isAdmin = user.role === "admin"; 

        // Kiểm tra số lượng bài hát
        if (songIds.length > 50) {
            return res.status(400).json({ message: "A playlist can have a maximum of 50 songs." });
        }

        // Kiểm tra bài hát có tồn tại không
        const approvedSongs = await Song.find({ _id: { $in: songIds }, status: "approved" });
        if (approvedSongs.length !== songIds.length) {
            return res.status(400).json({ message: "Một số bài hát chưa được duyệt hoặc không tồn tại." });
        }

        // Kiểm tra nếu user là Admin, mới được gán category
        let validCategories = [];
        if (isAdmin && category.length > 0) {
            validCategories = await Category.find({ _id: { $in: category } });
            if (validCategories.length !== category.length) {
                return res.status(400).json({ message: "Some categories are invalid." });
            }
        } else if (category.length > 0) {
            return res.status(403).json({ message: "Only admin can assign categories to playlists." });
        }

        // Nếu không có ảnh, lấy ảnh của bài hát đầu tiên trong danh sách bài hát (nếu có)
        let finalImageUrl = imageUrl || (approvedSongs.length > 0 ? approvedSongs[0].imageUrl : "");

        if (req.files && req.files.imageFile) {
            finalImageUrl = await uploadToCloudinary(req.files.imageFile);
        }

        // Tạo Playlist
        const newPlaylist = new Playlist({
            name,
            userId: user._id, // Lưu _id của user từ MongoDB
            imageUrl: finalImageUrl,
            isPublic: isAdmin ? true : isPublic || false,
            isAdminCreated: isAdmin,
            songs: songIds,
            category: validCategories.map(c => c._id),
        });

        await newPlaylist.save();

        // Cập nhật danh mục (Chỉ admin playlist mới cập nhật category)
        if (isAdmin) {
            await Category.updateMany(
                { _id: { $in: category } },
                { $push: { playlists: newPlaylist._id } }
            );
        }

        res.status(201).json({ message: "Playlist created successfully", playlist: newPlaylist });
    } catch (error) {
        console.error("Error creating playlist:", error);
        next(error);
    }
};



/**
 * @route GET /playlists/home
 * @desc Lấy danh sách playlist công khai của Admin trên trang Home
 * @access Public
 */
export const getPublicPlaylistsForHome = async (req, res, next) => {
    try {
        const playlists = await Playlist.find({ isPublic: true, isAdminCreated: true })
            .populate("songs");

        res.status(200).json({ message: "Danh sách playlist của Admin", playlists });
    } catch (error) {
        next(error);
    }
};


/**
 * @route GET /playlists/search
 * @desc Tìm kiếm playlist công khai theo tên
 * @access Public
 */
export const searchPublicPlaylists = async (req, res, next) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({ message: "Vui lòng nhập từ khóa tìm kiếm." });
        }

        const playlists = await Playlist.find({
            name: { $regex: query, $options: "i" }, 
            isPublic: true, 
        }).populate("songs");

        if (playlists.length === 0) {
            return res.status(200).json({ message: "Không tìm thấy playlist nào." });
        }

        res.status(200).json({ message: "Kết quả tìm kiếm", playlists });
    } catch (error) {
        next(error);
    }
};

/**
 * @route GET /playlists
 * @desc Lấy danh sách playlist của người dùng hiện tại (hỗ trợ phân trang)
 * @access Private
 */
export const getMyPlaylists = async (req, res, next) => {
    try {
        const clerkId = req.auth.userId;  // Lấy `clerkId` từ req.auth (vì `userId` là Clerk ID)

        // Tìm user trong MongoDB bằng clerkId
        const user = await User.findOne({ clerkId });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const userId = user._id;  // Sử dụng _id của MongoDB (ObjectId)

        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        // Tìm playlist của người dùng theo `userId` MongoDB (_id)
        const playlists = await Playlist.find({ userId })
            .populate("songs")
            .limit(parseInt(limit))
            .skip(skip);

        const total = await Playlist.countDocuments({ userId });

        res.status(200).json({
            message: "Danh sách playlist của bạn",
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            playlists,
            total,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route GET /playlists/:playlistId
 * @desc Lấy thông tin chi tiết của một playlist
 * @access Public nếu playlist ở chế độ public, nếu không chỉ chủ sở hữu xem được
 */
export const getPlaylistById = async (req, res, next) => {
    try {
        const { playlistId } = req.params;
        const playlist = await Playlist.findById(playlistId).populate("songs");

        if (!playlist) {
            return res.status(404).json({ message: "Playlist not found" });
        }

        // Nếu playlist là private, kiểm tra quyền truy cập
        if (!playlist.isPublic && playlist.userId.toString() !== req.auth.userId) {
            return res.status(403).json({ message: "You do not have permission to view this playlist" });
        }

        res.status(200).json(playlist);
    } catch (error) {
        next(error);
    }
};

/**
 * @route PUT /playlists/:playlistId
 * @desc Cập nhật playlist (tên, trạng thái công khai)
 * @access Chủ sở hữu playlist
 */
// comment vietnameses
export const updatePlaylist = async (req, res, next) => {
    try {
        const { playlistId } = req.params;
        const { name, isPublic, category, imageUrl } = req.body;
        const userId = req.auth.userId;

        // Lấy thông tin playlist
        const playlist = await Playlist.findById(playlistId);
        if (!playlist) {
            return res.status(404).json({ message: "Playlist not found" });
        }

        // Chỉ admin hoặc chủ playlist mới có thể cập nhật
        const user = await User.findById(userId);
        if (playlist.userId.toString() !== userId && user.role !== "admin") {
            return res.status(403).json({ message: "You do not have permission to update this playlist" });
        }

        // Nếu có category, chỉ admin mới được thay đổi
        let validCategories = [];
        if (category && user.role === "admin") {
            validCategories = await Category.find({ _id: { $in: category } });
            if (validCategories.length !== category.length) {
                return res.status(400).json({ message: "Some categories are invalid" });
            }
        } else if (category) {
            return res.status(403).json({ message: "Only admin can change categories" });
        }

        // Nếu không có imageUrl, lấy ảnh từ bài hát đầu tiên trong playlist (nếu có bài hát)
        let finalImageUrl = imageUrl || playlist.imageUrl;
        if (!finalImageUrl && playlist.songs.length > 0) {
            finalImageUrl = playlist.songs[0].imageUrl;
        }

        // Cập nhật playlist
        playlist.name = name || playlist.name;
        playlist.isPublic = isPublic !== undefined ? isPublic : playlist.isPublic;
        if (user.role === "admin") {
            playlist.category = validCategories.map(c => c._id);
        }

        await playlist.save();

        // Cập nhật danh mục nếu là admin
        if (user.role === "admin") {
            await Category.updateMany(
                { _id: { $nin: category } },
                { $pull: { playlists: playlist._id } }
            );
            await Category.updateMany(
                { _id: { $in: category } },
                { $push: { playlists: playlist._id } }
            );
        }

        res.status(200).json({ message: "Playlist updated successfully", playlist });
    } catch (error) {
        next(error);
    }
};



/**
 * @route DELETE /playlists/:playlistId
 * @desc Xóa playlist
 * @access Chủ sở hữu playlist
 */
// delete Playlist and pop it from categories
export const deletePlaylist = async (req, res, next) => {
    try {
        const { playlistId } = req.params;
        const clerkId = req.auth.userId; // Lấy `clerkId` từ Clerk

        // 🔹 Lấy `_id` thực từ MongoDB
        const user = await User.findOne({ clerkId });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const userId = user._id; // MongoDB ObjectId của user

        const playlist = await Playlist.findById(playlistId);
        if (!playlist) {
            return res.status(404).json({ message: "Playlist not found" });
        }

        // Chỉ cho phép chủ playlist hoặc admin xóa
        if (playlist.userId.toString() !== userId.toString() && user.role !== "admin") {
            return res.status(403).json({ message: "You do not have permission to delete this playlist" });
        }

        // Nếu là playlist admin, xóa khỏi danh mục
        if (user.role === "admin") {
            await Category.updateMany(
                { playlists: playlistId },
                { $pull: { playlists: playlistId } }
            );
        }

        await playlist.deleteOne({ _id: playlistId });
        res.status(200).json({ message: "Playlist deleted successfully" });
    } catch (error) {
        next(error);
    }
};

/**
 * @route POST /playlists/:playlistId/add-song
 * @desc Thêm bài hát vào playlist
 * @access Chủ sở hữu playlist
 */
export const addSongToPlaylist = async (req, res, next) => {
    try {
        const { playlistId } = req.params;
        const { songId } = req.body;
        const userId = req.auth.userId;

        const playlist = await Playlist.findById(playlistId);

        if (!playlist) return res.status(404).json({ message: "Playlist không tồn tại" });
        if (playlist.userId.toString() !== userId) {
            return res.status(403).json({ message: "Bạn không có quyền sửa playlist này" });
        }

        const song = await Song.findById(songId);
        if (!song) return res.status(404).json({ message: "Bài hát không tồn tại" });

        if (!playlist.songs.includes(songId)) {
            playlist.songs.push(songId);
            await playlist.save();
        } else {
            return res.status(400).json({ message: "Bài hát đã có trong playlist" });
        }

        res.status(200).json({ message: "Bài hát đã được thêm vào playlist", playlist });
    } catch (error) {
        next(error);
    }
};


/**
 * @route DELETE /playlists/:playlistId/remove-song
 * @desc Xóa bài hát khỏi playlist
 * @access Chủ sở hữu playlist
 */
export const removeSongFromPlaylist = async (req, res, next) => {
    try {
        const { playlistId } = req.params;
        const { songId } = req.body;
        const userId = req.auth.userId;

        const playlist = await Playlist.findById(playlistId);
        if (!playlist) return res.status(404).json({ message: "Playlist không tồn tại" });

        if (playlist.userId.toString() !== userId) {
            return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa playlist này" });
        }

        // Kiểm tra bài hát có tồn tại hay không
        const song = await Song.findById(songId);
        if (!song) return res.status(404).json({ message: "Bài hát không tồn tại" });

        // Kiểm tra nếu bài hát đã có trong playlist trước khi xóa
        if (!playlist.songs.includes(songId)) {
            return res.status(400).json({ message: "Bài hát không có trong playlist" });
        }

        playlist.songs = playlist.songs.filter(id => id.toString() !== songId);
        await playlist.save();

        res.status(200).json({ message: "Bài hát đã được xóa khỏi playlist", playlist });
    } catch (error) {
        next(error);
    }
};


/**
 * API lấy danh sách bài hát trong Playlist Thịnh Hành
 */
export const getTrendingSongs = async (req, res, next) => {
    try {
        const trendingPlaylist = await Playlist.findOne({ name: "Trending Songs" })
            .populate({
                path: "songs",
                select: "title artist imageUrl audioUrl duration",
                populate: { path: "artist", select: "fullName imageUrl" },
            });

        if (!trendingPlaylist) {
            return res.status(200).json({ success: true, message: "Trending Playlist chưa có sẵn." });
        }

        if (trendingPlaylist.songs.length === 0) {
            return res.status(200).json({ success: true, message: "Không có bài hát thịnh hành." });
        }

        res.status(200).json({ success: true, data: trendingPlaylist });
    } catch (error) {
        console.error("❌ Lỗi khi lấy Trending Playlist:", error);
        next(error);
    }
};

  

/**
 * Cập nhật Playlist Thịnh Hành mỗi ngày
 */
export const updateTrendingPlaylist = async () => {
    try {
        console.log("🔄 Đang cập nhật Trending Playlist...");

        // **Bước 1: Lấy dữ liệu 7 ngày gần đây**
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentTrendingSongs = await UserListeningHistory.aggregate([
            {
                $match: { listenedAt: { $gte: sevenDaysAgo } } // Chỉ lấy lượt nghe trong 7 ngày qua
            },
            {
                $group: { 
                    _id: "$songId", 
                    recentPlays: { $sum: 1 }  // Tổng số lượt nghe gần đây
                }
            }
        ]);

        const recentTrendingMap = new Map(recentTrendingSongs.map(song => [song._id.toString(), song.recentPlays]));

        // **Bước 2: Lấy danh sách bài hát có `listenCount` cao nhất**
        const trendingSongs = await Song.find({
            status: "approved"
        })
        .sort({ listenCount: -1 }) // Sắp xếp theo tổng số lượt nghe giảm dần
        .limit(50) // Lấy danh sách lớn hơn 30 để có nhiều lựa chọn
        .select("_id listenCount isSingle albumId");

        // **Bước 3: Tính toán điểm tổng hợp**
        const rankedSongs = trendingSongs.map(song => {
            const recentPlays = recentTrendingMap.get(song._id.toString()) || 0; // Lượt nghe trong 7 ngày qua
            const totalPlays = song.listenCount; // Tổng số lượt nghe

            // Công thức tính điểm dựa trên Spotify/YouTube logic
            const score = (totalPlays * 0.7) + (recentPlays * 1.3); // Cân nhắc trọng số

            return { songId: song._id, score };
        });

        // **Bước 4: Chọn 30 bài hát có điểm cao nhất**
        rankedSongs.sort((a, b) => b.score - a.score);
        const topTrendingSongs = rankedSongs.slice(0, 30).map(song => song.songId);

        if (topTrendingSongs.length === 0) {
            console.log("⚠️ Không có bài hát nào đủ điều kiện để đưa vào Trending Playlist.");
            return;
        }

        // **Bước 5: Cập nhật hoặc tạo mới Playlist `Trending Songs`**
        let trendingPlaylist = await Playlist.findOne({ name: "Trending Songs" });

        if (trendingPlaylist) {
            trendingPlaylist.songs = topTrendingSongs;
            await trendingPlaylist.save();
        } else {
            trendingPlaylist = new Playlist({
                name: "Trending Songs",
                userId: null, // Không thuộc người dùng nào
                songs: topTrendingSongs,
                isPublic: true,
                category: [], // Không có thể loại
            });

            await trendingPlaylist.save();
        }

        console.log("✅ Trending Playlist Updated Successfully!");
    } catch (error) {
        console.error("❌ Error updating Trending Playlist:", error);
    }
};
