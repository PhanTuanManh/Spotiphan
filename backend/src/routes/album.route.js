// routes/album.route.js

import { Router } from "express";
import {
  archiveAlbum,
  deleteAlbum,
  getAlbumById,
  getApprovedAlbums,
  unarchiveAlbum,
} from "../controller/album.controller.js";
import {
  protectRoute,
  syncUserWithMongoDB,
} from "../middleware/auth.middleware.js";
import { requireArtistOrAdmin } from "../middleware/authorization.middleware.js";

const router = Router();

router.get("/", getApprovedAlbums);

router.get("/:albumId", getAlbumById);
router.put(
  "/:albumId/archive",
  requireArtistOrAdmin,
  syncUserWithMongoDB,
  protectRoute,
  archiveAlbum
);
router.put(
  "/:albumId/unarchive",
  requireArtistOrAdmin,
  syncUserWithMongoDB,
  protectRoute,
  unarchiveAlbum
);
router.delete(
  "/:albumId",
  syncUserWithMongoDB,
  syncUserWithMongoDB,
  protectRoute,
  requireArtistOrAdmin,
  deleteAlbum
);

export default router;
