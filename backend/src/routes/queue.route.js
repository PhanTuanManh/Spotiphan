// src/routes/queue.routes.js

import { Router } from "express";

import { authenticate } from "../middleware/auth.middleware.js";
import {
  addSongToQueue,
  cloneToQueue,
  getQueue,
  nextSong,
  prevSong,
  toggleLoopMode,
  toggleShuffle,
} from "../controller/queue.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// **Quản lý Queue**
router.post("/clone", authenticate, cloneToQueue);
router.post("/:songId/add", authenticate, addSongToQueue);
router.post("/next", authenticate, nextSong);
router.post("/prev", authenticate, prevSong);
router.get("/:userId", authenticate, getQueue);
router.post("/toggle-loop", authenticate, toggleLoopMode);
router.post("/toggle-shuffle", authenticate, toggleShuffle);

export default router;
