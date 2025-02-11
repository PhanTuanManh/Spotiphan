// src/controllers/user.controller.js
import { Message } from "../models/message.model.js";
import { Payment } from "../models/payment.model.js";
import { User } from "../models/user.model.js";

/**
 * Create a new user (Admin only)
 */
export const createUser = async (req, res, next) => {
	try {
		const { fullName, email, imageUrl, role } = req.body;

		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return res.status(400).json({ message: "User already exists" });
		}

		const newUser = new User({
			fullName,
			email,
			imageUrl,
			role,
			clerkId: "manual-" + Date.now(), // Fake Clerk ID for manually created users
		});

		await newUser.save();
		res.status(201).json(newUser);
	} catch (error) {
		next(error);
	}
};

/**
 * Get all users (Admin only) with pagination
 */
export const getAllUsers = async (req, res, next) => {
	try {
		let { page = 1, limit = 10 } = req.query;
		page = parseInt(page);
		limit = parseInt(limit);

		const totalUsers = await User.countDocuments();
		const users = await User.find()
			.populate("subscriptionPlan")
			.skip((page - 1) * limit)
			.limit(limit)
			.sort({ createdAt: -1 });

		res.status(200).json({
			totalUsers,
			currentPage: page,
			totalPages: Math.ceil(totalUsers / limit),
			users,
		});
	} catch (error) {
		next(error);
	}
};

/**
 * Get user profile by ID
 */
export const getUserProfile = async (req, res, next) => {
	try {
		const { userId } = req.params;
		const user = await User.findById(userId)
			.populate("subscriptionPlan")
			.populate("likedSongs")
			.populate("followers")
			.populate("following");

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		res.status(200).json(user);
	} catch (error) {
		next(error);
	}
};

/**
 * Get current authenticated user profile
 */
export const getMe = async (req, res, next) => {
	try {
		const myId = req.auth.userId;
		const user = await User.findOne({ clerkId: myId })
			.populate("subscriptionPlan")
			.populate("likedSongs")
			.populate("followers")
			.populate("following");

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		res.status(200).json(user);
	} catch (error) {
		next(error);
	}
};

/**
 * Update user profile
 */
export const updateUserProfile = async (req, res, next) => {
	try {
		const myId = req.auth.userId;
		const { fullName, imageUrl } = req.body;

		const updatedUser = await User.findOneAndUpdate(
			{ clerkId: myId },
			{ fullName, imageUrl },
			{ new: true }
		);

		if (!updatedUser) {
			return res.status(404).json({ message: "User not found" });
		}

		res.status(200).json(updatedUser);
	} catch (error) {
		next(error);
	}
};

/**
 * Delete a user (Admin only)
 */
export const deleteUser = async (req, res, next) => {
	try {
		const { userId } = req.params;
		const user = await User.findByIdAndDelete(userId);

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		res.status(200).json({ message: "User deleted successfully" });
	} catch (error) {
		next(error);
	}
};

/**
 * Block/Unblock a user (Admin only)
 */
export const toggleBlockUser = async (req, res, next) => {
	try {
		const { userId } = req.params;
		const user = await User.findById(userId);

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		user.isBlocked = !user.isBlocked;
		await user.save();

		res.status(200).json({ message: `User ${user.isBlocked ? "blocked" : "unblocked"} successfully` });
	} catch (error) {
		next(error);
	}
};

/**
 * Follow a user
 */
export const followUser = async (req, res, next) => {
	try {
		const myId = req.auth.userId;
		const { userId } = req.params;

		if (myId === userId) {
			return res.status(400).json({ message: "You cannot follow yourself" });
		}

		const user = await User.findById(userId);
		const me = await User.findOne({ clerkId: myId });

		if (!user || !me) {
			return res.status(404).json({ message: "User not found" });
		}

		if (me.following.includes(userId)) {
			return res.status(400).json({ message: "You are already following this user" });
		}

		me.following.push(userId);
		user.followers.push(me._id);

		await me.save();
		await user.save();

		res.status(200).json({ message: "Followed successfully" });
	} catch (error) {
		next(error);
	}
};

/**
 * Unfollow a user
 */
export const unfollowUser = async (req, res, next) => {
	try {
		const myId = req.auth.userId;
		const { userId } = req.params;

		const user = await User.findById(userId);
		const me = await User.findOne({ clerkId: myId });

		if (!user || !me) {
			return res.status(404).json({ message: "User not found" });
		}

		me.following = me.following.filter((id) => id.toString() !== userId);
		user.followers = user.followers.filter((id) => id.toString() !== me._id.toString());

		await me.save();
		await user.save();

		res.status(200).json({ message: "Unfollowed successfully" });
	} catch (error) {
		next(error);
	}
};

/**
 * Get user's payment history
 */
export const getPaymentHistory = async (req, res, next) => {
	try {
		const myId = req.auth.userId;
		const user = await User.findOne({ clerkId: myId });

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		const payments = await Payment.find({ userId: user._id }).populate("planId");

		res.status(200).json(payments);
	} catch (error) {
		next(error);
	}
};

/**
 * Get paginated messages between two users (optimized for chat apps)
 */
export const getMessages = async (req, res, next) => {
	try {
		const myId = req.auth.userId;
		const { userId } = req.params;
		let { limit = 20, lastMessageId } = req.query;

		limit = parseInt(limit);

		// Điều kiện tìm kiếm
		let query = {
			$or: [
				{ senderId: userId, receiverId: myId },
				{ senderId: myId, receiverId: userId },
			],
		};

		// Nếu có lastMessageId -> Chỉ lấy tin nhắn cũ hơn tin nhắn này
		if (lastMessageId) {
			const lastMessage = await Message.findById(lastMessageId);
			if (lastMessage) {
				query.createdAt = { $lt: lastMessage.createdAt };
			}
		}

		// Lấy tin nhắn mới nhất trước
		const messages = await Message.find(query)
			.sort({ createdAt: -1 }) // Tin nhắn mới nhất trước
			.limit(limit);

		// Kiểm tra còn tin nhắn không
		const hasMore = messages.length === limit;

		res.status(200).json({
			hasMore,
			messages: messages.reverse(), // Đảo lại để hiển thị đúng thứ tự
		});
	} catch (error) {
		next(error);
	}
};

