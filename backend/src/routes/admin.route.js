// src/routes/admin.routes.js

import { Router } from "express";
import { approveAlbum, approveSingleOrEP, checkAdmin, createAdvertisement, createSubscriptionPlan, createUser, deleteAdvertisement, deleteAlbum, deleteSubscriptionPlan, deleteUser, getAllAlbums, getAllSinglesOrEPs, getAllSubscriptionPlans, getAllUsers, rejectAlbum, rejectSingleOrEP, toggleBlockUser, updateSubscriptionPlan } from "../controller/admin.controller.js";
import { protectRoute, requireAdmin, syncUserWithMongoDB } from "../middleware/auth.middleware.js";

const router = Router();
router.use(protectRoute);
router.use(requireAdmin);

// **check admin**
router.get("/check", checkAdmin);

// **Quản lý Single/EP**
router.put("/singles/:songId/approve", syncUserWithMongoDB, approveSingleOrEP);
router.put("/singles/:songId/reject", syncUserWithMongoDB, rejectSingleOrEP);
router.get("/singles", syncUserWithMongoDB, getAllSinglesOrEPs);

// **Quản lý Album**
router.put("/albums/:albumId/approve", syncUserWithMongoDB, approveAlbum);
router.put("/albums/:albumId/reject", syncUserWithMongoDB, rejectAlbum);
router.delete("/albums/:albumId", syncUserWithMongoDB, deleteAlbum);
router.get("/albums", syncUserWithMongoDB, getAllAlbums);

// **Quản lý User**
router.post("/users", syncUserWithMongoDB, createUser);
router.get("/users", syncUserWithMongoDB, getAllUsers);
router.delete("/users/:userId", syncUserWithMongoDB, deleteUser);
router.put("/users/:userId/toggle-block", syncUserWithMongoDB, toggleBlockUser);

// **Quản lý Subscription Plans**
router.post("/subscriptions", syncUserWithMongoDB, createSubscriptionPlan);
router.delete("/subscriptions/:id", syncUserWithMongoDB, deleteSubscriptionPlan);
router.put("/subscriptions/:id", syncUserWithMongoDB, updateSubscriptionPlan);
router.get("/subscriptions", syncUserWithMongoDB, getAllSubscriptionPlans);

// **Quản lý Quảng cáo**
router.post("/advertisements", syncUserWithMongoDB, createAdvertisement);
router.delete("/advertisements/:id", syncUserWithMongoDB, deleteAdvertisement);

export default router;
  