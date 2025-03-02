// routes/auth.route.js

import { Router } from "express";
import { authCallback, getUserStatus } from "../controller/auth.controller.js";
import { protectRoute, syncUserWithMongoDB } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/callback", authCallback);
router.get("/me", protectRoute, syncUserWithMongoDB, getUserStatus);

export default router;
