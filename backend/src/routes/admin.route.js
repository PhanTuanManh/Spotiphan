// routes/admin.route.js

import { Router } from "express";
import { checkAdmin, createAlbum, createSong, createSubscriptionPlan, createUser, deleteAlbum, deleteSong, deleteSubscriptionPlan, deleteUser, getAllSubscriptionPlans, getAllUsers, toggleBlockUser, updateSubscriptionPlan } from "../controller/admin.controller.js";
import { protectRoute, requireAdmin } from "../middleware/auth.middleware.js";
const router = Router();

router.use(protectRoute, requireAdmin);

router.get("/check", checkAdmin);

router.post("/songs", createSong);
router.delete("/songs/:id", deleteSong);

router.post("/albums", createAlbum);
router.delete("/albums/:id", deleteAlbum);

router.get("/users", getAllUsers);
router.post("/users", createUser);
router.post("/users/block/:id", toggleBlockUser);
router.delete("/users/:id", deleteUser);

router.get("/subscriptions", getAllSubscriptionPlans);
router.post("/subscriptions", createSubscriptionPlan);
router.patch("/subscriptions/:id", updateSubscriptionPlan);
router.delete("/subscriptions/:id", deleteSubscriptionPlan);

export default router;
