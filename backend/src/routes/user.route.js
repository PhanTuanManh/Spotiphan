// src/routes/user.routes.js

import {Router} from "express";


import { archiveAlbum, archiveSong, createAlbum, createSong, followUser, getMe , getMessages, getPaymentHistory, getUserProfile, removeSongFromAlbum, unfollowUser, updateSong, updateSubscriptionPlan, updateUserProfile } from "../controller/user.controller.js";
import { requireArtist, requireArtistOrAdmin } from "../middleware/authorization.middleware.js";
import { protectRoute, syncUserWithMongoDB } from "../middleware/auth.middleware.js";

const router = Router();

// **Lấy thông tin User**
router.get("/me" ,protectRoute,syncUserWithMongoDB, getMe);
router.put("/me", updateUserProfile);
router.get("/:userId", getUserProfile);

// **Follow / Unfollow**
router.post("/:userId/follow", followUser);
router.post("/:userId/unfollow", unfollowUser);

// **Lịch sử thanh toán**
router.get("/me/payments", getPaymentHistory);

// **Tin nhắn giữa hai người dùng**
router.get("/:userId/messages", getMessages);

// **Cập nhật gói Subscription**
router.put("/me/subscription", updateSubscriptionPlan);

// **Quản lý Album (chỉ dành cho Artist)**
router.post("/albums", requireArtist, createAlbum);
router.put("/albums/:albumId/remove-song/:songId", requireArtist, removeSongFromAlbum);
router.put("/albums/:albumId/archive", requireArtistOrAdmin, archiveAlbum);

// **Quản lý bài hát (chỉ dành cho Artist)**
router.post("/songs", requireArtist, createSong);
router.put("/songs/:songId/archive", requireArtistOrAdmin, archiveSong);
router.put("/songs/:songId", requireArtist, updateSong);

export default router;
