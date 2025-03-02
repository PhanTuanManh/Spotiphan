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
		const [totalSongs, totalAlbums, totalUsers, totalArtists, totalPlaylists] = await Promise.allSettled([
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
			totalArtists: totalArtists.status === "fulfilled" ? totalArtists.value : 0,
			totalPlaylists: totalPlaylists.status === "fulfilled" ? totalPlaylists.value : 0,
		});
	} catch (error) {
		console.error("❌ Lỗi khi lấy thống kê:", error);
		next(error);
	}
};
