// src/routes/user.routes.js

import { Router } from "express";


import { followUser, getMe, getMessages, getPaymentHistory, getUserProfile, unfollowUser, updateSubscriptionPlan, updateUserProfile } from "../controller/user.controller.js";
import { protectRoute, syncUserWithMongoDB } from "../middleware/auth.middleware.js";
import { getAllUsers } from "../controller/admin.controller.js";

const router = Router();
router.use(syncUserWithMongoDB);
router.use(protectRoute);

// **Lấy thông tin User**
router.get("/", getAllUsers);
router.get("/me" , getMe);
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


export default router;
