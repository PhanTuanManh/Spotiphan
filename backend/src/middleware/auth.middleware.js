//src/middleware/auth.middleware.js

import { clerkClient } from "@clerk/express";
import { User } from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
    try {
        if (!req.auth || !req.auth.userId) {
            return res.status(401).json({ message: "Unauthorized - Please log in" });
        }
        next();
    } catch (error) {
        console.error("Error in protectRoute:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};


export const requireAdmin = async (req, res, next) => {
	try {
		const currentUser = await clerkClient.users.getUser(req.auth.userId);
		const isAdmin = process.env.ADMIN_EMAIL === currentUser.primaryEmailAddress?.emailAddress;

		if (!isAdmin) {
			return res.status(403).json({ message: "Unauthorized - you must be an admin" });
		}

		next();
	} catch (error) {
		next(error);
	}
};


export const syncUserWithMongoDB = async (req, res, next) => {
	try {
		const clerkUser = await clerkClient.users.getUser(req.auth.userId);
		const existingUser = await User.findOne({ clerkId: clerkUser.id });

		// Nếu user chưa tồn tại -> Tạo user mới
		if (!existingUser) {
			const newUser = new User({
				clerkId: clerkUser.id,
				fullName: clerkUser.fullName || "Anonymous",
				email: clerkUser.primaryEmailAddress?.emailAddress || "",
				imageUrl: clerkUser.imageUrl || "",
			});

			await newUser.save();
			console.log("✅ User created in MongoDB:", newUser);
		}

		next(); // Tiếp tục xử lý request
	} catch (error) {
		console.error("❌ Error syncing user with MongoDB:", error);
		next(error);
	}
};


