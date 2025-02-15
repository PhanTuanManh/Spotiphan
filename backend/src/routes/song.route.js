// routes/song.route.js

import { Router } from "express";
import { getAllSongs } from "../controller/song.controller.js";
// import { protectRoute, requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", getAllSongs);

export default router;
