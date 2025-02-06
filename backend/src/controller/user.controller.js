// controllers/user.controller.js

import { User } from "../models/user.model.js";
import { Message } from "../models/message.model.js";

export const getAllUsers = async (currentUserId, page = 1, limit = 10) => {
	const skip = (page - 1) * limit;
	const users = await User.find({ clerkId: { $ne: currentUserId } })
	  .skip(skip)
	  .limit(limit);
	const total = await User.countDocuments({ clerkId: { $ne: currentUserId } });
	return { users, total };
  };

export const getMessages = async (req, res, next) => {
	try {
		const myId = req.auth.userId;
		const { userId } = req.params;

		const messages = await Message.find({
			$or: [
				{ senderId: userId, receiverId: myId },
				{ senderId: myId, receiverId: userId },
			],
		}).sort({ createdAt: 1 });

		res.status(200).json(messages);
	} catch (error) {
		next(error);
	}
};
