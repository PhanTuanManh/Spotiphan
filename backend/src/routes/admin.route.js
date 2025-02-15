// src/routes/admin.routes.js

import { Router } from "express";
import { approveAlbum, approveSingleOrEP, createAdvertisement, createPublicPlaylist, createSubscriptionPlan, createUser, deleteAdvertisement, deleteAlbum, deleteSubscriptionPlan, deleteUser, getAllAlbums, getAllSinglesOrEPs, getAllSubscriptionPlans, getAllUsers, rejectAlbum, rejectSingleOrEP, toggleBlockUser, updateSubscriptionPlan } from "../controller/admin.controller.js";
import { requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();
router.use(requireAdmin);

// **Quản lý Single/EP**
router.put("/singles/:songId/approve", approveSingleOrEP);
router.put("/singles/:songId/reject", rejectSingleOrEP);
router.get("/singles", getAllSinglesOrEPs);

// **Quản lý Album**
router.put("/albums/:albumId/approve", approveAlbum);
router.put("/albums/:albumId/reject", rejectAlbum);
router.delete("/albums/:albumId", deleteAlbum);
router.get("/albums", getAllAlbums);

// **Quản lý User**
router.post("/users", createUser);
router.get("/users", getAllUsers);
router.delete("/users/:userId", deleteUser);
router.put("/users/:userId/toggle-block", toggleBlockUser);

// **Quản lý Subscription Plans**
router.post("/subscriptions", createSubscriptionPlan);
router.delete("/subscriptions/:id", deleteSubscriptionPlan);
router.put("/subscriptions/:id", updateSubscriptionPlan);
router.get("/subscriptions", getAllSubscriptionPlans);

// **Quản lý Playlist (Admin tạo Public Playlist)**
router.post("/playlists/public", createPublicPlaylist);

// **Quản lý Quảng cáo**
router.post("/advertisements", createAdvertisement);
router.delete("/advertisements/:id", deleteAdvertisement);

export default router;
