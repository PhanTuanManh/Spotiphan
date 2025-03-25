// src/routes/userListeningHistory.route.js

import { Router } from "express";
import {
  getListeningHistory,
  trackSongListening,
} from "../controller/userListeningHistory.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", getListeningHistory);
router.post("/track", trackSongListening);

export default router;
