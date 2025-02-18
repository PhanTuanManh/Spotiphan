// src/routes/userListeningHistory.route.js

import { Router } from "express";
import { protectRoute, syncUserWithMongoDB } from "../middleware/auth.middleware.js";
import { getListeningHistory, trackSongListening } from "../controller/userListeningHistory.controller.js";

const router = Router();

router.use(syncUserWithMongoDB);
router.use(protectRoute);

router.get("/" , getListeningHistory);
router.post("/track", trackSongListening);

export default router;