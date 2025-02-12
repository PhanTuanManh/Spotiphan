// routes/user.route.js
// src/routes/user.routes.js

import { Router } from "express";
import { followUser, getMe, getMessages, getPaymentHistory, getUserProfile, unfollowUser, updateSubscriptionPlan, updateUserProfile } from "../controller/user.controller.js";


const router = Router();

// Lấy thông tin người dùng theo ID
router.get("/:userId", getUserProfile);

// Lấy thông tin cá nhân của người dùng hiện tại
router.get("/me", getMe);

// Cập nhật thông tin cá nhân
router.put("/me", updateUserProfile);

// Theo dõi một người dùng khác
router.post("/follow/:userId", followUser);

// Bỏ theo dõi một người dùng khác
router.post("/unfollow/:userId", unfollowUser);

// Lịch sử thanh toán của người dùng
router.get("/me/payments", getPaymentHistory);

// Lấy tin nhắn giữa hai người dùng
router.get("/messages/:userId", getMessages);

// Cập nhật gói subscription
router.put("/update-subscription", updateSubscriptionPlan);

export default router;
