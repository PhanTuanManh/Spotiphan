import { Router } from "express";
import { getActiveAdvertisements } from "../controller/advertisement.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = Router();

router.use(protectRoute);

router.get("/", getActiveAdvertisements);

export default router;