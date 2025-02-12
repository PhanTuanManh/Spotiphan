// src/controllers/user.controller.js
import { Message } from "../models/message.model.js";
import { Payment } from "../models/payment.model.js";
import { User } from "../models/user.model.js";


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

/**
 * Update user's subscription plan
 */
export const updateSubscriptionPlan = async (req, res, next) => {
    try {
        const myId = req.auth.userId; // ID người dùng hiện tại (được xác thực)
        const { planId } = req.body; // ID của gói subscription mới

        // Kiểm tra xem gói subscription có tồn tại không
        const plan = await SubscriptionPlan.findById(planId);
        if (!plan) {
            return res.status(404).json({ message: "Subscription plan not found" });
        }

        // Tìm user và cập nhật gói subscription + ngày hết hạn
        const user = await User.findOneAndUpdate(
            { clerkId: myId },
            {
                subscriptionPlan: plan._id,
                premiumExpiration: new Date(Date.now() + plan.durationInDays * 24 * 60 * 60 * 1000),
            },
            { new: true }
        ).populate("subscriptionPlan");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "Subscription updated successfully", user });
    } catch (error) {
        next(error);
    }
};
