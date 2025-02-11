import { User } from "../models/user.model.js";
import { Message } from "../models/message.model.js";
import { param, validationResult } from "express-validator";

// Service Layer: Lấy danh sách người dùng
export const getAllUsersService = async (currentUserId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const users = await User.find({ clerkId: { $ne: currentUserId } })
    .skip(skip)
    .limit(limit);
  const total = await User.countDocuments({ clerkId: { $ne: currentUserId } });
  return { users, total };
};

// Service Layer: Lấy tin nhắn giữa hai người dùng
export const getMessagesService = async (myId, userId) => {
  return Message.find({
    $or: [
      { senderId: userId, receiverId: myId },
      { senderId: myId, receiverId: userId },
    ],
  }).sort({ createdAt: 1 });
};

// Controller: Lấy danh sách người dùng
export const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const currentUserId = req.auth.userId;

    const { users, total } = await getAllUsersService(currentUserId, page, limit);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page: +page,
        limit: +limit,
        total,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Controller: Lấy tin nhắn giữa hai người dùng
export const getMessages = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const myId = req.auth.userId;
    const { userId } = req.params;

    const messages = await getMessagesService(myId, userId);

    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
};

// Validation cho userId
export const validateUserId = [
  param("userId").isMongoId().withMessage("Invalid user ID"),
];