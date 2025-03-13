import { Album } from "../models/album.model.js";
import { Song } from "../models/song.model.js";
import { User } from "../models/user.model.js";
import { Playlist } from "../models/playList.model.js";

/**
 * @route GET /stats
 * @desc Lấy số lượng thống kê toàn hệ thống
 * @access Private (Admin)
 */
export const getStats = async (req, res, next) => {
  try {
    // Dùng `Promise.allSettled` để tránh lỗi ảnh hưởng toàn bộ API
    const [totalSongs, totalAlbums, totalUsers, totalArtists, totalPlaylists] =
      await Promise.allSettled([
        Song.countDocuments(),
        Album.countDocuments(),
        User.countDocuments(),
        User.countDocuments({ role: "artist" }), // Thống kê số lượng nghệ sĩ
        Playlist.countDocuments(),
      ]);

    res.status(200).json({
      totalAlbums: totalAlbums.status === "fulfilled" ? totalAlbums.value : 0,
      totalSongs: totalSongs.status === "fulfilled" ? totalSongs.value : 0,
      totalUsers: totalUsers.status === "fulfilled" ? totalUsers.value : 0,
      totalArtists:
        totalArtists.status === "fulfilled" ? totalArtists.value : 0,
      totalPlaylists:
        totalPlaylists.status === "fulfilled" ? totalPlaylists.value : 0,
    });
  } catch (error) {
    console.error("❌ Lỗi khi lấy thống kê:", error);
    next(error);
  }
};

/**
 * @route GET /stats/artist/:artistId
 * @desc Lấy số lượng Album, Bài hát, Single của một Artist
 * @access Private (Admin hoặc chính Artist)
 */
export const getStatsForArtist = async (req, res, next) => {
  try {
    const { artistId } = req.params; // Đây là Clerk ID (user_...)

    // 🔹 Tìm User trong MongoDB bằng `clerkId` thay vì `_id`
    const artist = await User.findOne({ clerkId: artistId });

    if (!artist || artist.role !== "artist") {
      return res.status(404).json({ message: "Artist không tồn tại" });
    }

    // 🔹 Lấy `_id` của artist để dùng trong truy vấn tiếp theo
    const mongoUserId = artist._id;

    // 🔹 Lấy thống kê bài hát, album, single của artist đó
    const [totalSongs, totalAlbums, totalSingles] = await Promise.all([
      Song.countDocuments({ artist: mongoUserId }),
      Album.countDocuments({ artist: mongoUserId }),
      Song.countDocuments({ artist: mongoUserId, isSingle: true }),
    ]);

    res.status(200).json({
      artistId: mongoUserId, // ✅ Trả về MongoDB `_id` thay vì Clerk ID
      artistName: artist.fullName,
      totalSongs,
      totalAlbums,
      totalSingles,
    });
  } catch (error) {
    console.error("❌ Lỗi khi lấy thống kê cho Artist:", error);
    next(error);
  }
};
