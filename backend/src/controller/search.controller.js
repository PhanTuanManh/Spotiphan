// src/controllers/search.controller.js
import { Album } from "../models/album.model.js";
import { Playlist } from "../models/playList.model.js";
import { Song } from "../models/song.model.js";
import { User } from "../models/user.model.js";

export const searchAll = async (req, res, next) => {
  try {
    const { q: query, page = 1, limit = 10, type } = req.query;
    const skip = (page - 1) * limit;

    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Search query is required" });
    }

    const searchRegex = new RegExp(query, "i");
    const results = {};
    const totals = {};
    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: {},
    };

    // Search Songs (including singles)
    if (!type || type === "songs") {
      const [songs, totalSongs] = await Promise.all([
        Song.find({
          $and: [
            { title: searchRegex },
            { status: "approved" },
            { $or: [{ isSingle: true }, { albumId: { $ne: null } }] },
          ],
        })
          .populate("artist", "fullName imageUrl role")
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Song.countDocuments({
          $and: [
            { title: searchRegex },
            { status: "approved" },
            { $or: [{ isSingle: true }, { albumId: { $ne: null } }] },
          ],
        }),
      ]);

      results.songs = songs.map((song) => ({
        id: song._id,
        type: "song",
        title: song.title,
        artist: song.artist,
        imageUrl: song.imageUrl,
        duration: song.duration,
        isSingle: song.isSingle,
      }));

      totals.songs = totalSongs;
      pagination.totalPages.songs = Math.ceil(totalSongs / limit);
    }

    // Search Albums
    if (!type || type === "albums") {
      const [albums, totalAlbums] = await Promise.all([
        Album.find({
          $and: [{ title: searchRegex }, { status: "approved" }],
        })
          .populate("artist", "fullName imageUrl role")
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Album.countDocuments({
          $and: [{ title: searchRegex }, { status: "approved" }],
        }),
      ]);

      results.albums = albums.map((album) => ({
        id: album._id,
        type: "album",
        title: album.title,
        artist: album.artist,
        imageUrl: album.imageUrl,
        releaseYear: album.releaseYear,
      }));

      totals.albums = totalAlbums;
      pagination.totalPages.albums = Math.ceil(totalAlbums / limit);
    }

    // Search Playlists
    if (!type || type === "playlists") {
      const [playlists, totalPlaylists] = await Promise.all([
        Playlist.find({
          $and: [{ name: searchRegex }, { isPublic: true }],
        })
          .populate({
            path: "userId",
            select: "fullName imageUrl",
            model: "User",
          })
          .populate("songs")
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Playlist.countDocuments({
          $and: [{ name: searchRegex }, { isPublic: true }],
        }),
      ]);

      results.playlists = playlists.map((playlist) => ({
        id: playlist._id,
        type: "playlist",
        name: playlist.name,
        imageUrl: playlist.imageUrl,
        songCount: playlist.songs?.length || 0,
        userId: {
          // Đảm bảo cấu trúc này khớp với interface
          _id: playlist.userId?._id,
          fullName: playlist.userId?.fullName || "Unknown",
          imageUrl: playlist.userId?.imageUrl,
        },
      }));

      totals.playlists = totalPlaylists;
      pagination.totalPages.playlists = Math.ceil(totalPlaylists / limit);
    }

    // Search Users (with role-specific formatting)
    if (!type || type === "users") {
      const [users, totalUsers] = await Promise.all([
        User.find({
          $and: [{ fullName: searchRegex }, { isBlocked: false }],
        })
          .select("fullName imageUrl role followers")
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        User.countDocuments({
          $and: [{ fullName: searchRegex }, { isBlocked: false }],
        }),
      ]);

      results.users = users.map((user) => ({
        id: user._id,
        type: "user",
        name: user.role === "admin" ? "Spotiphan" : user.fullName,
        imageUrl: user.imageUrl,
        role: user.role,
        isArtist: user.role === "artist",
        isAdmin: user.role === "admin",
        followersCount: user.followers?.length || 0,
      }));

      totals.users = totalUsers;
      pagination.totalPages.users = Math.ceil(totalUsers / limit);
    }

    res.status(200).json({
      success: true,
      query,
      results,
      totals,
      pagination,
    });
  } catch (error) {
    console.error("Search error:", error);
    next(error);
  }
};
