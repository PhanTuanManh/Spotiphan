import { Playlist } from "../models/playList.model.js";
import { Song } from "../models/song.model.js";

/**
 * @route POST /playlists
 * @desc Tạo một playlist mới
 * @access Premium, Artist, Admin
 */
export const createPlaylist = async (req, res, next) => {
    try {
        const { name, isPublic } = req.body;
        const userId = req.auth.userId;

        const newPlaylist = new Playlist({
            name,
            userId,
            isPublic: isPublic || false,
            songs: [],
        });

        await newPlaylist.save();
        res.status(201).json({ message: "Playlist created successfully", playlist: newPlaylist });
    } catch (error) {
        next(error);
    }
};

/**
 * @route GET /playlists
 * @desc Lấy danh sách playlist của người dùng hiện tại
 * @access Private
 */
export const getMyPlaylists = async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const playlists = await Playlist.find({ userId }).populate("songs");
        res.status(200).json(playlists);
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
 * @desc Cập nhật thông tin playlist (tên, trạng thái công khai)
 * @access Chủ sở hữu playlist
 */
export const updatePlaylist = async (req, res, next) => {
    try {
        const { playlistId } = req.params;
        const { name, isPublic } = req.body;
        const userId = req.auth.userId;

        const playlist = await Playlist.findById(playlistId);

        if (!playlist) {
            return res.status(404).json({ message: "Playlist not found" });
        }

        // Chỉ chủ sở hữu playlist mới có quyền sửa
        if (playlist.userId.toString() !== userId) {
            return res.status(403).json({ message: "You do not have permission to update this playlist" });
        }

        playlist.name = name || playlist.name;
        if (isPublic !== undefined) {
            playlist.isPublic = isPublic;
        }

        await playlist.save();
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

        if (playlist.userId.toString() !== userId) {
            return res.status(403).json({ message: "You do not have permission to delete this playlist" });
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

        if (!playlist) {
            return res.status(404).json({ message: "Playlist not found" });
        }

        if (playlist.userId.toString() !== userId) {
            return res.status(403).json({ message: "You do not have permission to modify this playlist" });
        }

        const song = await Song.findById(songId);
        if (!song) {
            return res.status(404).json({ message: "Song not found" });
        }

        if (!playlist.songs.includes(songId)) {
            playlist.songs.push(songId);
            await playlist.save();
        }

        res.status(200).json({ message: "Song added to playlist", playlist });
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

        if (!playlist) {
            return res.status(404).json({ message: "Playlist not found" });
        }

        if (playlist.userId.toString() !== userId) {
            return res.status(403).json({ message: "You do not have permission to modify this playlist" });
        }

        playlist.songs = playlist.songs.filter(id => id.toString() !== songId);
        await playlist.save();

        res.status(200).json({ message: "Song removed from playlist", playlist });
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
        populate: { path: "artist", select: "fullName imageUrl" }, // Lấy thông tin artist
      });

    if (!trendingPlaylist) {
      return res.status(200).json({ success: true, message: "Trending Playlist is not available yet." });
    }

    res.status(200).json({ success: true, data: trendingPlaylist });
  } catch (error) {
    next(error);
  }
};

/**
 * Cập nhật Playlist Thịnh Hành mỗi ngày
 */
export const updateTrendingPlaylist = async () => {
    try {
      console.log("Updating Trending Playlist...");
  
      // Lấy 30 bài hát có tổng lượt nghe cao nhất
      const trendingSongs = await Song.find({
        $or: [
          { isSingle: true, status: "approved" },
          { albumId: { $ne: null } }
        ]
      })
      .populate({
        path: "albumId",
        match: { status: "approved" },
      })
      .sort({ listenCount: -1 }) // Sắp xếp theo tổng số lượt nghe giảm dần
      .limit(30) // Lấy 30 bài hát
      .select("_id");
  
      const filteredSongs = trendingSongs.filter(song => song.isSingle || song.albumId);
  
      if (filteredSongs.length === 0) {
        console.log("No trending songs available.");
        return;
      }
  
      // Kiểm tra xem Playlist "Trending Songs" đã tồn tại chưa
      let trendingPlaylist = await Playlist.findOne({ name: "Trending Songs" });
  
      if (trendingPlaylist) {
        // Nếu đã tồn tại, cập nhật danh sách bài hát
        trendingPlaylist.songs = filteredSongs.map(song => song._id);
        await trendingPlaylist.save();
      } else {
        // Nếu chưa có, tạo mới Playlist Thịnh Hành
        trendingPlaylist = new Playlist({
          name: "Trending Songs",
          userId: new mongoose.Types.ObjectId(), // Không thuộc người dùng nào
          songs: filteredSongs.map(song => song._id),
          isPublic: true, // Công khai
        });
  
        await trendingPlaylist.save();
      }
  
      console.log("✅ Trending Playlist Updated Successfully!");
    } catch (error) {
      console.error("❌ Error updating Trending Playlist:", error);
    }
  };