// routes/song.route.js

import { Router } from "express";
import { sendMessage } from "../controller/user.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
// import { protectRoute, requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", protectRoute, sendMessage);

export default router;
