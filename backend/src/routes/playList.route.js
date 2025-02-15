// src/routes/playlist.routes.js
import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { requirePremiumOrHigher } from "../middleware/authorization.middleware.js";
import { addSongToPlaylist, createPlaylist, deletePlaylist, getMyPlaylists, getPlaylistById, removeSongFromPlaylist, updatePlaylist } from "../controller/playlist.controller.js";


const router = express.Router();

router.post("/", protectRoute, requirePremiumOrHigher, createPlaylist);
router.get("/", protectRoute, getMyPlaylists);
router.get("/:playlistId", protectRoute, getPlaylistById);
router.put("/:playlistId", protectRoute, updatePlaylist);
router.delete("/:playlistId", protectRoute, deletePlaylist);
router.post("/:playlistId/add-song", protectRoute, addSongToPlaylist);
router.delete("/:playlistId/remove-song", protectRoute, removeSongFromPlaylist);

export default router;
