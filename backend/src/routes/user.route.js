// src/routes/user.routes.js

import express from "express";


import { requireArtistOrAdmin } from "../middleware/authorization.middleware.js";
import { archiveAlbum, archiveSong, createAlbum, createSong, followUser, getMe, getMessages, getPaymentHistory, getUserProfile, unfollowUser, updateUserProfile } from "../controller/user.controller.js";
import { updateSubscriptionPlan } from "../controller/admin.controller.js";

const router = express.Router();

// **Lấy thông tin User**
router.get("/:userId", getUserProfile);
router.get("/me", getMe);
router.put("/me", updateUserProfile);

// **Follow / Unfollow**
router.post("/:userId/follow", followUser);
router.post("/:userId/unfollow", unfollowUser);

// **Lịch sử thanh toán**
router.get("/me/payments", getPaymentHistory);

// **Tin nhắn giữa hai người dùng**
router.get("/:userId/messages", getMessages);

// **Cập nhật gói Subscription**
router.put("/me/subscription", updateSubscriptionPlan);

// **Quản lý Album (dành cho Artist)**
router.post("/albums", requireArtistOrAdmin, createAlbum);
router.put("/albums/:albumId/archive", requireArtistOrAdmin, archiveAlbum);

// **Quản lý bài hát (dành cho Artist)**
router.post("/songs", requireArtistOrAdmin, createSong);
router.put("/songs/:songId/archive", requireArtistOrAdmin, archiveSong);

export default router;
