// routes/stat.route.js

import { Router } from "express";
// import { protectRoute, requireAdmin } from "../middleware/auth.middleware.js";
import { getStats, getStatsForArtist } from "../controller/stat.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authenticate);

router.get("/", getStats);
router.get("/artist/:artistId", getStatsForArtist);

export default router;
