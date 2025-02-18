import { Category } from "../models/category.model.js";
import { Playlist } from "../models/playList.model.js";
import { Song } from "../models/song.model.js";
import { User } from "../models/user.model.js";

/**
 * @route POST /playlists
 * @desc Tạo một playlist mới (công khai hoặc riêng tư)
 * @access Premium, Artist, Admin
 */
export const createPlaylist = async (req, res, next) => {
    try {
        const { name, isPublic, songIds = [], category = [] } = req.body;
        const userId = req.auth.userId;
        const isAdmin = req.auth.role === "admin"; 

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
        } else {
            if (category.length > 0) {
                return res.status(403).json({ message: "Only admin can assign categories to playlists." });
            }
        }

        // Tạo Playlist
        const newPlaylist = new Playlist({
            name,
            userId,
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
 * @desc Lấy danh sách playlist của người dùng hiện tại
 * @access Private
 */
/**
 * @route GET /playlists
 * @desc Lấy danh sách playlist của người dùng hiện tại (hỗ trợ phân trang)
 * @access Private
 */
export const getMyPlaylists = async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

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
        const { name, isPublic, category } = req.body;
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
export const deletePlaylist = async (req, res, next) => {
    try {
        const { playlistId } = req.params;
        const userId = req.auth.userId;

        const playlist = await Playlist.findById(playlistId);
        if (!playlist) {
            return res.status(404).json({ message: "Playlist not found" });
        }

        // Chỉ cho phép chủ playlist hoặc admin xóa
        const user = await User.findById(userId);
        if (playlist.userId.toString() !== userId && user.role !== "admin") {
            return res.status(403).json({ message: "You do not have permission to delete this playlist" });
        }

        // Nếu là playlist admin, xóa khỏi danh mục
        if (user.role === "admin") {
            await Category.updateMany(
                { playlists: playlistId },
                { $pull: { playlists: playlistId } }
            );
        }

        await playlist.remove();
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
  
      // Lấy 30 bài hát có tổng lượt nghe cao nhất và đã được duyệt
      const trendingSongs = await Song.find({
        $or: [
          { isSingle: true, status: "approved" },
          { albumId: { $ne: null }, status: "approved" }
        ]
      })
      .populate({
        path: "albumId",
        match: { status: "approved" },
      })
      .sort({ listenCount: -1 }) // Sắp xếp theo tổng số lượt nghe giảm dần
      .limit(30) // Lấy 30 bài hát
      .select("_id");

      // Lọc bài hát hợp lệ
      const validSongs = trendingSongs.filter(song => song.isSingle || song.albumId);

      if (validSongs.length === 0) {
        console.log("⚠️ Không có bài hát nào đủ điều kiện để đưa vào Trending Playlist.");
        return;
      }

      // Kiểm tra xem Playlist "Trending Songs" đã tồn tại chưa
      let trendingPlaylist = await Playlist.findOne({ name: "Trending Songs" });

      if (trendingPlaylist) {
        // Nếu đã tồn tại, cập nhật danh sách bài hát
        trendingPlaylist.songs = validSongs.map(song => song._id);
        await trendingPlaylist.save();
      } else {
        // Nếu chưa có, tạo mới Playlist Thịnh Hành
        trendingPlaylist = new Playlist({
          name: "Trending Songs",
          userId: null, // Không thuộc người dùng nào
          songs: validSongs.map(song => song._id),
          isPublic: true,
        });

        await trendingPlaylist.save();
      }

      console.log("✅ Trending Playlist Updated Successfully!");
    } catch (error) {
      console.error("❌ Error updating Trending Playlist:", error);
    }
};
