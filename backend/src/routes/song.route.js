// routes/song.route.js

import { Router } from "express";
import {
  getAllSongs,
  getLatestSingles,
} from "../controller/song.controller.js";
import {
  protectRoute,
  syncUserWithMongoDB,
} from "../middleware/auth.middleware.js";
import { requireArtistOrAdmin } from "../middleware/authorization.middleware.js";
import {
  approveSingleOrEP,
  archiveSingleOrEP,
  deleteSingleOrEP,
  getAllSinglesOrEPs,
  rejectSingleOrEP,
  unarchiveSingleOrEP,
} from "../controller/admin.controller.js";
// import { protectRoute, requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", getAllSongs);
router.put(
  "/singles/:songId/approve",
  syncUserWithMongoDB,
  protectRoute,
  requireArtistOrAdmin,
  approveSingleOrEP
);
router.put(
  "/singles/:songId/reject",
  syncUserWithMongoDB,
  protectRoute,
  requireArtistOrAdmin,
  rejectSingleOrEP
);
router.get(
  "/singles",
  syncUserWithMongoDB,
  protectRoute,
  requireArtistOrAdmin,
  getAllSinglesOrEPs
);
router.put(
  "/singles/:songId/archive",
  syncUserWithMongoDB,
  protectRoute,
  requireArtistOrAdmin,
  archiveSingleOrEP
);
router.put(
  "/singles/:songId/unarchive",
  syncUserWithMongoDB,
  protectRoute,
  requireArtistOrAdmin,
  unarchiveSingleOrEP
);
router.delete(
  "/singles/:songId",
  syncUserWithMongoDB,
  protectRoute,
  requireArtistOrAdmin,
  deleteSingleOrEP
);
router.get("/singles/lastest", getLatestSingles);

export default router;
