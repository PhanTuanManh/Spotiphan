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

		next();
	} catch (error) {
		next(error);
	}
};

/**
 * Middleware kiểm tra quyền Admin (Quản lý người dùng, nội dung)
 */
export const requireAdmin = async (req, res, next) => {
	try {
		const currentUser = await clerkClient.users.getUser(req.auth.userId);
		const isAdmin = process.env.ADMIN_EMAIL === currentUser.primaryEmailAddress?.emailAddress;

		if (!isAdmin) {
			return res.status(403).json({ message: "Unauthorized - bạn không có quyền admin." });
		}

		next();
	} catch (error) {
		next(error);
	}
};

export const requireArtist = async (req, res, next) => {
    const user = await User.findById(req.auth.userId);
    if (!user || user.role !== "artist") {
        return res.status(403).json({ message: "Unauthorized - you must be an artist" });
    }
    next();
};