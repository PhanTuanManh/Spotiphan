// src/routes/playlist.routes.js

import express from "express";


import { protectRoute } from "../middleware/auth.middleware.js";
import { requirePremiumOrHigher } from "../middleware/authorization.middleware.js";
import { syncUserWithMongoDB } from "../middleware/auth.middleware.js";
import { addSongToPlaylist, createPlaylist, deletePlaylist, getMyPlaylists, getPlaylistById, getPublicPlaylistsForHome, getTrendingSongs, removeSongFromPlaylist, searchPublicPlaylists, updatePlaylist } from "../controller/playlist.controller.js";

const router = express.Router();

// **Tạo playlist (Premium, Artist, Admin)**
router.post("/", protectRoute, requirePremiumOrHigher, syncUserWithMongoDB, createPlaylist);

// **Danh sách playlist công khai của Admin trên trang Home**
router.get("/home", getPublicPlaylistsForHome);

// **Tìm kiếm playlist công khai theo tên**
router.get("/search", searchPublicPlaylists);

// **Lấy danh sách playlist của người dùng hiện tại (hỗ trợ phân trang)**
router.get("/my-playlists", protectRoute,syncUserWithMongoDB, getMyPlaylists);

// **Lấy thông tin chi tiết của một playlist**
router.get("/:playlistId", protectRoute,syncUserWithMongoDB, getPlaylistById);

// **Cập nhật playlist (tên, trạng thái công khai)**
router.put("/:playlistId", protectRoute,syncUserWithMongoDB, updatePlaylist);

// **Xóa playlist**
router.delete("/:playlistId", protectRoute,syncUserWithMongoDB, deletePlaylist);

// **Quản lý bài hát trong Playlist**
router.post("/:playlistId/add-song", protectRoute,syncUserWithMongoDB, addSongToPlaylist);
router.delete("/:playlistId/remove-song", protectRoute,syncUserWithMongoDB, removeSongFromPlaylist);

// **Playlist thịnh hành**
router.get("/trending/songs", getTrendingSongs);

export default router;
