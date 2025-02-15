// src/routes/playlist.routes.js
import express from "express";
import { addSongToPlaylist, createPlaylist, deletePlaylist, getMyPlaylists, getPlaylistById, removeSongFromPlaylist, updatePlaylist } from "../controller/playlist.controller.js";
import { requirePremiumOrHigher } from "../middleware/authorization.middleware.js";


const router = express.Router();

router.post("/", requirePremiumOrHigher, createPlaylist);
router.get("/", getMyPlaylists);
router.get("/:playlistId", getPlaylistById);
router.put("/:playlistId", updatePlaylist);
router.delete("/:playlistId", deletePlaylist);
router.post("/:playlistId/add-song", addSongToPlaylist);
router.delete("/:playlistId/remove-song", removeSongFromPlaylist);

export default router;

