// src/routes/admin.routes.js

import { Router } from "express";
import { approveAlbum, approveSingleOrEP, createAdvertisement, createPublicPlaylist, createSubscriptionPlan, createUser, deleteAdvertisement, deleteAlbum, deleteSubscriptionPlan, deleteUser, getAllAlbums, getAllSinglesOrEPs, getAllSubscriptionPlans, getAllUsers, rejectAlbum, rejectSingleOrEP, toggleBlockUser, updateSubscriptionPlan } from "../controller/admin.controller.js";
import { requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

// **Quản lý Single/EP**
router.put("/singles/:songId/approve", requireAdmin, approveSingleOrEP);
router.put("/singles/:songId/reject", requireAdmin, rejectSingleOrEP);
router.get("/singles", requireAdmin, getAllSinglesOrEPs);

// **Quản lý Album**
router.put("/albums/:albumId/approve", requireAdmin, approveAlbum);
router.put("/albums/:albumId/reject", requireAdmin, rejectAlbum);
router.delete("/albums/:albumId", requireAdmin, deleteAlbum);
router.get("/albums", requireAdmin, getAllAlbums);

// **Quản lý User**
router.post("/users", requireAdmin, createUser);
router.get("/users", requireAdmin, getAllUsers);
router.delete("/users/:userId", requireAdmin, deleteUser);
router.put("/users/:userId/toggle-block", requireAdmin, toggleBlockUser);

// **Quản lý Subscription Plans**
router.post("/subscriptions", requireAdmin, createSubscriptionPlan);
router.delete("/subscriptions/:id", requireAdmin, deleteSubscriptionPlan);
router.put("/subscriptions/:id", requireAdmin, updateSubscriptionPlan);
router.get("/subscriptions", requireAdmin, getAllSubscriptionPlans);

// **Quản lý Playlist (Admin tạo Public Playlist)**
router.post("/playlists/public", requireAdmin, createPublicPlaylist);

// **Quản lý Quảng cáo**
router.post("/advertisements", requireAdmin, createAdvertisement);
router.delete("/advertisements/:id", requireAdmin, deleteAdvertisement);

export default router;
