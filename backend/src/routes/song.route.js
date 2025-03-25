// routes/song.route.js

import { Router } from "express";
import {
  approveSingleOrEP,
  archiveSingleOrEP,
  deleteSingleOrEP,
  getAllSinglesOrEPs,
  rejectSingleOrEP,
  unarchiveSingleOrEP,
} from "../controller/admin.controller.js";
import {
  getAllSongs,
  getFeaturedSongs,
  getLatestSingles,
  getMadeForYouSongs,
  getTrendingSongs,
} from "../controller/song.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireArtistOrAdmin } from "../middleware/authorization.middleware.js";
// import { protectRoute, requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", getAllSongs);
router.put(
  "/singles/:songId/approve",

  authenticate,
  requireArtistOrAdmin,
  approveSingleOrEP
);
router.put(
  "/singles/:songId/reject",

  authenticate,
  requireArtistOrAdmin,
  rejectSingleOrEP
);
router.get(
  "/singles",

  authenticate,
  requireArtistOrAdmin,
  getAllSinglesOrEPs
);
router.put(
  "/singles/:songId/archive",

  authenticate,
  requireArtistOrAdmin,
  archiveSingleOrEP
);
router.put(
  "/singles/:songId/unarchive",

  authenticate,
  requireArtistOrAdmin,
  unarchiveSingleOrEP
);
router.delete(
  "/singles/:songId",

  authenticate,
  requireArtistOrAdmin,
  deleteSingleOrEP
);
router.get("/singles/lastest", getLatestSingles);
router.get("/featured", getFeaturedSongs);
router.get("/made-for-you", getMadeForYouSongs);
router.get("/trending", getTrendingSongs);

export default router;
