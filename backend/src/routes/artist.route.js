import { Router } from "express";
import {
  archiveAlbum,
  createAlbum,
  getMyAlbums,
  removeSongFromAlbum,
} from "../controller/album.controller.js";
import {
  protectRoute,
  syncUserWithMongoDB,
} from "../middleware/auth.middleware.js";
import {
  requireArtist,
  requireArtistOrAdmin,
} from "../middleware/authorization.middleware.js";
import {
  archiveSong,
  createSong,
  getSinglesByArtist,
  getSongsByArtist,
  updateSong,
} from "../controller/song.controller.js";

const router = Router();
router.use(syncUserWithMongoDB);
router.use(protectRoute);

// **Quản lý Album (chỉ dành cho Artist)**
router.get("/my-albums", requireArtist, getMyAlbums);
router.post("/albums", requireArtist, createAlbum);
router.put(
  "/albums/:albumId/remove-song/:songId",
  requireArtist,
  removeSongFromAlbum
);
router.put("/albums/:albumId/archive", requireArtistOrAdmin, archiveAlbum);

// **Quản lý bài hát (chỉ dành cho Artist)**
router.get("/singles/:artistId", getSinglesByArtist);
router.get("/songs/:artistId", getSongsByArtist);
router.post("/songs", requireArtist, createSong);
router.put("/songs/:songId/archive", requireArtistOrAdmin, archiveSong);
router.put("/songs/:songId", requireArtist, updateSong);

export default router;
