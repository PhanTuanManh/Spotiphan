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
import { User } from "../models/user.model.js";

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
router.delete("/:userId/follow", authenticate, unfollowUser);

// Thêm vào user.route.js
router.get("/:userId/check-follow", authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.query.followerId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isFollowing = user.followers.includes(followerId);
    res.status(200).json({
      isFollowing,
      followersCount: user.followers.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Error checking follow status" });
  }
});

// **Lịch sử thanh toán**
router.get("/me/payments", authenticate, getPaymentHistory);

// **Tin nhắn giữa hai người dùng**
router.get("/messages/:userId", authenticate, getMessages);

// **Cập nhật gói Subscription**
router.put("/me/subscription", authenticate, updateSubscriptionPlan);

export default router;
