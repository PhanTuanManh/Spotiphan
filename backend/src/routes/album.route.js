// routes/album.route.js

import { Router } from "express";
import {
  archiveAlbum,
  deleteAlbum,
  getAlbumById,
  getApprovedAlbums,
  unarchiveAlbum,
} from "../controller/album.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireArtistOrAdmin } from "../middleware/authorization.middleware.js";

const router = Router();

router.get("/", getApprovedAlbums);

router.get("/:albumId", getAlbumById);
router.put(
  "/:albumId/archive",
  requireArtistOrAdmin,
  authenticate,
  archiveAlbum
);
router.put(
  "/:albumId/unarchive",
  requireArtistOrAdmin,
  authenticate,
  unarchiveAlbum
);
router.delete("/:albumId", authenticate, requireArtistOrAdmin, deleteAlbum);

export default router;
