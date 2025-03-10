// routes/album.route.js

import { Router } from "express";
import { archiveAlbum, getAlbumById, getApprovedAlbums, unarchiveAlbum } from "../controller/album.controller.js";
import { requireArtistOrAdmin } from "../middleware/authorization.middleware.js";
import { protectRoute, syncUserWithMongoDB } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", getApprovedAlbums);
router.get("/:albumId", getAlbumById);
router.put("/:albumId/archive", requireArtistOrAdmin, syncUserWithMongoDB, protectRoute, archiveAlbum);
router.put("/:albumId/unarchive", requireArtistOrAdmin, syncUserWithMongoDB, protectRoute, unarchiveAlbum);


export default router;
