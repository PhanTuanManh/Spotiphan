// src/routes/user.routes.js

import { Router } from "express";

import { getAllUsers } from "../controller/admin.controller.js";
import {
  followUser,
  getMe,
  getMessages,
  getPaymentHistory,
  getUserProfile,
  getUsersByIds,
  likeSong,
  unfollowUser,
  updateSubscriptionPlan,
  updateUserProfile,
} from "../controller/user.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// **Lấy thông tin User**
router.get("/", authenticate, getAllUsers);
router.post("/batch", getUsersByIds);
router.get("/me", authenticate, getMe);
router.put("/me", authenticate, updateUserProfile);
router.get("/:userId", authenticate, getUserProfile);

router.put("/likes/:songId", authenticate, likeSong);

// **Follow / Unfollow**
router.post("/:userId/follow", authenticate, followUser);
router.post("/:userId/unfollow", authenticate, unfollowUser);

// **Lịch sử thanh toán**
router.get("/me/payments", authenticate, getPaymentHistory);

// **Tin nhắn giữa hai người dùng**
router.get("/:userId/messages", authenticate, getMessages);

// **Cập nhật gói Subscription**
router.put("/me/subscription", authenticate, updateSubscriptionPlan);

export default router;
