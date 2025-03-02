// routes/song.route.js

import { Router } from "express";
import { getCategories } from "../controller/category.controller.js";
// import { protectRoute, requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", getCategories);

export default router;
