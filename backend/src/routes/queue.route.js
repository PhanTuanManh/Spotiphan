// src/routes/queue.routes.js

import {Router} from "express";


import { protectRoute } from "../middleware/auth.middleware.js";
import { addSongToQueue, cloneToQueue, getQueue, nextSong, prevSong, toggleLoopMode, toggleShuffle } from "../controller/queue.controller.js";

const router = Router();

// **Quản lý Queue**
router.post("/clone", protectRoute, cloneToQueue);
router.post("/:songId/add", protectRoute, addSongToQueue);
router.post("/next", protectRoute, nextSong);
router.post("/prev", protectRoute, prevSong);
router.get("/:userId", protectRoute, getQueue);
router.post("/toggle-loop", protectRoute, toggleLoopMode);
router.post("/toggle-shuffle", protectRoute, toggleShuffle);

export default router;
