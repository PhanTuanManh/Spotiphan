// src/routes/playlist.routes.js

import express from "express";

import { requirePremiumOrHigher } from "../middleware/authorization.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  addSongToPlaylist,
  createPlaylist,
  deletePlaylist,
  getMyPlaylists,
  getPlaylistById,
  getPublicPlaylistsForHome,
  getTrendingSongs,
  removeSongFromPlaylist,
  searchPublicPlaylists,
  updatePlaylist,
} from "../controller/playlist.controller.js";

const router = express.Router();

// **Tạo playlist (Premium, Artist, Admin)**
router.post("/", authenticate, requirePremiumOrHigher, createPlaylist);

// **Danh sách playlist công khai của Admin trên trang Home**
router.get("/home", getPublicPlaylistsForHome);

// **Tìm kiếm playlist công khai theo tên**
router.get("/search", searchPublicPlaylists);

// **Lấy danh sách playlist của người dùng hiện tại (hỗ trợ phân trang)**
router.get("/my-playlists", authenticate, getMyPlaylists);

// **Lấy thông tin chi tiết của một playlist**
router.get("/:playlistId", authenticate, getPlaylistById);

// **Cập nhật playlist (tên, trạng thái công khai)**
router.put("/:playlistId", authenticate, updatePlaylist);

// **Xóa playlist**
router.delete("/:playlistId", authenticate, deletePlaylist);

// **Quản lý bài hát trong Playlist**
router.post("/:playlistId/add-song", authenticate, addSongToPlaylist);
router.delete("/:playlistId/remove-song", authenticate, removeSongFromPlaylist);

// **Playlist thịnh hành**
router.get("/trending/songs", getTrendingSongs);

export default router;
