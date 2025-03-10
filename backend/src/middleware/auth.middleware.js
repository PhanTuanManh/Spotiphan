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

        if (!req.auth || !req.auth.userId) {
            return res.status(401).json({ message: "Unauthorized - User not authenticated" });
        }

        const clerkUser = await clerkClient.users.getUser(req.auth.userId);

        let existingUser = await User.findOne({ clerkId: clerkUser.id });

        if (!existingUser) {

            existingUser = new User({
                clerkId: clerkUser.id,
                fullName: clerkUser.firstName + " " + clerkUser.lastName || "Anonymous",
                email: clerkUser.emailAddresses[0]?.emailAddress || "",
                imageUrl: clerkUser.imageUrl || "",
                role: "free" // Đặt role mặc định nếu không có
            });

            await existingUser.save();
        }

        req.user = existingUser; // Gán user vào req.user để middleware sau có thể dùng
        next();
    } catch (error) {
        next(error);
    }
};



