// src/routes/user.routes.js

import express from "express";


import { protectRoute } from "../middleware/auth.middleware.js";
import { requirePremiumOrHigher, requireArtistOrAdmin } from "../middleware/authorization.middleware.js";

const router = express.Router();

// **Lấy thông tin User**
router.get("/:userId", protectRoute, getUserProfile);
router.get("/me", protectRoute, getMe);
router.put("/me", protectRoute, updateUserProfile);

// **Follow / Unfollow**
router.post("/:userId/follow", protectRoute, followUser);
router.post("/:userId/unfollow", protectRoute, unfollowUser);

// **Lịch sử thanh toán**
router.get("/me/payments", protectRoute, getPaymentHistory);

// **Tin nhắn giữa hai người dùng**
router.get("/:userId/messages", protectRoute, getMessages);

// **Cập nhật gói Subscription**
router.put("/me/subscription", protectRoute, updateSubscriptionPlan);

// **Quản lý Album (dành cho Artist)**
router.post("/albums", protectRoute, requireArtistOrAdmin, createAlbum);
router.put("/albums/:albumId/archive", protectRoute, requireArtistOrAdmin, archiveAlbum);

// **Quản lý bài hát (dành cho Artist)**
router.post("/songs", protectRoute, requireArtistOrAdmin, createSong);
router.put("/songs/:songId/archive", protectRoute, requireArtistOrAdmin, archiveSong);

export default router;
