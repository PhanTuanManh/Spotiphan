import { Router } from "express";
import { getActiveAdvertisements } from "../controller/advertisement.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authenticate);

router.get("/", getActiveAdvertisements);

export default router;
