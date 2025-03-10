// src/middleware/authorization.middleware.js

import { clerkClient } from "@clerk/express";
import { User } from "../models/user.model.js";

/**
 * Middleware kiểm tra quyền tạo Album (Chỉ cho phép Admin hoặc Artist)
 */
export const requireArtistOrAdmin = async (req, res, next) => {
	try {
		// Lấy thông tin người dùng từ Clerk
		const currentUser = await clerkClient.users.getUser(req.auth.userId);
		const user = await User.findOne({ clerkId: currentUser.id });

		if (!user || (user.role !== "artist" && user.role !== "admin")) {
			return res.status(403).json({ message: "Unauthorized - chỉ Admin hoặc Artist có thể thực hiện hành động này." });
		}

		next();
	} catch (error) {
		next(error);
		console.log("Error in requireArtistOrAdmin middleware:", error);
	}
};

/**
 * Middleware kiểm tra quyền tạo Playlist (Chỉ cho phép Premium, Artist hoặc Admin)
 */
export const requirePremiumOrHigher = async (req, res, next) => {
	try {
		const currentUser = await clerkClient.users.getUser(req.auth.userId);
		const user = await User.findOne({ clerkId: currentUser.id });

		if (!user || (user.role !== "premium" && user.role !== "artist" && user.role !== "admin")) {
			return res.status(403).json({ message: "Unauthorized - chỉ Premium, Artist hoặc Admin có thể tạo Playlist." });
		}
		console.log("User role:", user.role);
		next();
	} catch (error) {
		next(error);
	}
};

/**
 * Middleware kiểm tra quyền Admin (Quản lý người dùng, nội dung)
 */
export const requireArtist = async (req, res, next) => {
    try {
        const clerkId = req.auth.userId;  // Lấy `clerkId` từ `req.auth.userId`

        // Tìm người dùng trong MongoDB qua `clerkId`
        const user = await User.findOne({ clerkId });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Kiểm tra role người dùng phải là artist
        if (user.role !== "artist") {
            return res.status(403).json({ message: "Unauthorized - you must be an artist" });
        }

        // Lưu `_id` của người dùng vào `req.userId`
        req.userId = user._id;

        // Tiếp tục xử lý nếu người dùng là artist
        next();
    } catch (error) {
        console.error("Error in requireArtist middleware:", error);
        res.status(500).json({ message: "Server error" });
    }
};
