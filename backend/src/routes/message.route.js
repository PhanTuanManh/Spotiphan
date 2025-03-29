// routes/song.route.js

import { Router } from "express";
import { getMessages } from "../controller/user.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
// import { protectRoute, requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authenticate, getMessages);

export default router;
