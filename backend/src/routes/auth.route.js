// backend/src/routes/auth.route.js

import { Router } from "express";
import { authCallback, getCurrentUser } from "../controller/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/callback", authCallback);
router.get("/me", authenticate, getCurrentUser);

export default router;
