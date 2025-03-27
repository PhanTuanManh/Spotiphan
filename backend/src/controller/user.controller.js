// backend/src/controllers/user.controller.js
import mongoose from "mongoose";
import { io } from "../lib/socket.js"; // WebSocket để gửi thông báo realtime
import { Message } from "../models/message.model.js";
import { Payment } from "../models/payment.model.js";
import { User } from "../models/user.model.js";
import { Song } from "../models/song.model.js";

// helper function for cloudinary uploads
// const uploadToCloudinary = async (file) => {
// 	try {
// 		const result = await cloudinary.uploader.upload(file.tempFilePath, {
// 			resource_type: "auto",`
// 		});
// 		return result.secure_url;
// 	} catch (error) {
// 		console.log("Error in uploadToCloudinary", error);
// 		throw new Error("Error uploading to cloudinary");
// 	}
// };

/**
 * Get user profile by ID
 */
export const getUserProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;

    let user;

    // Kiểm tra nếu userId là ObjectId hợp lệ
    if (mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId);
    } else {
      user = await User.findOne({ clerkId: userId });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: "This user is blocked" });
    }

    // Populate dữ liệu
    await user.populate(
      "subscriptionPlan likedSongs followers following playlists"
    );
    if (user.role === "artist") {
      await user.populate("albums");
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("🔥 Error in getUserProfile:", error);
    next(error);
  }
};

/**
 * Get multiple user profiles by IDs
 */
export const getUsersByIds = async (req, res, next) => {
  try {
    const { ids } = req.body;
    const artists = await User.find({ _id: { $in: ids } }).select(
      "_id fullName"
    );
    res.status(200).json(artists);
  } catch (error) {
    console.error("Error in getUsersByIds:", error);
    next(error);
  }
};

export const likeSong = async (req, res, next) => {
  try {
    const { songId } = req.params; // Lấy songId từ params
    const userId = req.auth.userId;

    // Tìm user và song
    const user = await User.findOne({ clerkId: userId });
    const song = await Song.findById(songId);

    if (!user || !song) {
      return res.status(404).json({ message: "User or song not found" });
    }

    // Kiểm tra xem bài hát đã được thích chưa
    const isLiked = user.likedSongs.includes(songId);

    if (isLiked) {
      // Nếu đã thích, bỏ thích
      user.likedSongs = user.likedSongs.filter(
        (id) => id.toString() !== songId
      );
      song.likes = song.likes.filter(
        (id) => id.toString() !== user._id.toString()
      );
    } else {
      // Nếu chưa thích, thêm vào danh sách thích
      user.likedSongs.push(songId);
      song.likes.push(user._id);
    }

    await user.save();
    await song.save();

    res.status(200).json({
      message: isLiked
        ? "Song unliked successfully"
        : "Song liked successfully",
      isLiked: !isLiked, // Trả về trạng thái mới của bài hát (đã thích hay chưa)
    });
  } catch (error) {
    console.error("Error toggling like:", error);
    next(error);
  }
};

/**
 * Get current authenticated user profile
 */
export const getMe = async (req, res, next) => {
  try {
    // Ensure user is authenticated
    if (!req.auth || !req.auth.userId) {
      return res.status(401).json({ message: "Unauthorized - Please log in" });
    }

    const myId = req.auth.userId;

    // Find user by clerkId
    const user = await User.findOne({ clerkId: myId })
      .populate("subscriptionPlan")
      .populate("likedSongs")
      .populate("followers")
      .populate("following")
      .populate("playlists");

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found. Please register first." });
    }

    // If user is an artist, populate their albums
    if (user.role === "artist") {
      await user.populate("albums");
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error in getMe:", error);
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

    if (imageUrl && !imageUrl.startsWith("http")) {
      return res.status(400).json({ message: "Invalid image URL" });
    }

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

    if (user.isBlocked || me.isBlocked) {
      return res.status(403).json({ message: "Cannot follow a blocked user" });
    }

    if (me.following.includes(userId)) {
      return res
        .status(400)
        .json({ message: "You are already following this user" });
    }

    me.following.push(userId);
    user.followers.push(me._id);

    await me.save();
    await user.save();

    io.emit("new_follower", { userId: user._id, followerId: me._id });

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
    user.followers = user.followers.filter(
      (id) => id.toString() !== me._id.toString()
    );

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

    const payments = await Payment.find({ userId: user._id }).populate(
      "planId"
    );

    if (payments.length === 0) {
      return res.status(404).json({ message: "No payment history found" });
    }

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
    const myClerkId = req.auth.userId; // Lấy ID của người gửi request từ Clerk
    const { userId } = req.params; // Lấy ID của người nhận từ request params

    let { limit = 20, lastMessageId } = req.query;
    limit = parseInt(limit);

    // 🔹 Truy vấn theo `clerkId` (KHÔNG dùng ObjectId nữa)
    let query = {
      $or: [
        { senderId: myClerkId, receiverId: userId },
        { senderId: userId, receiverId: myClerkId },
      ],
    };

    // Nếu có lastMessageId, lọc tin nhắn cũ hơn
    if (lastMessageId) {
      const lastMessage = await Message.findById(lastMessageId);
      if (lastMessage) {
        query.createdAt = { $lt: lastMessage.createdAt };
      }
    }

    // 🔹 Lấy tin nhắn mới nhất trước
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    res.status(200).json({
      hasMore: messages.length === limit,
      messages: messages.reverse(), // Hiển thị tin nhắn theo thứ tự từ cũ đến mới
    });
  } catch (error) {
    console.error("❌ Lỗi khi lấy tin nhắn:", error);
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { senderId, receiverId, content } = req.body;

    // ✅ Tìm user bằng `clerkId` và lấy `_id` MongoDB
    const sender = await User.findOne({ clerkId: senderId });
    const receiver = await User.findOne({ clerkId: receiverId });

    if (!sender || !receiver) {
      return res.status(404).json({ error: "Người dùng không tồn tại" });
    }

    const message = await Message.create({
      senderId: sender._id, // Sử dụng `_id` từ MongoDB thay vì `clerkId`
      receiverId: receiver._id,
      content,
    });

    res.status(201).json({ message });
  } catch (error) {
    console.error("❌ Lỗi khi lưu tin nhắn vào database:", error);
    res.status(500).json({ error: "Lỗi server khi lưu tin nhắn" });
  }
};

/**
 * Update user's subscription plan
 */
export const updateSubscriptionPlan = async (req, res, next) => {
  try {
    const myId = req.auth.userId;
    const { planId } = req.body;

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: "Subscription plan not found" });
    }

    // Tính toán thời gian hết hạn gói Premium
    const newExpiration = new Date(
      Date.now() + plan.durationInDays * 24 * 60 * 60 * 1000
    );

    const user = await User.findOneAndUpdate(
      { clerkId: myId },
      {
        subscriptionPlan: plan._id,
        premiumExpiration: newExpiration,
        role: "premium", // **Cập nhật role thành "premium" khi user mua gói**
      },
      { new: true }
    ).populate("subscriptionPlan");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res
      .status(200)
      .json({ message: "Subscription updated successfully", user });
  } catch (error) {
    next(error);
  }
};

export const checkArtist = async (req, res, next) => {
  try {
    const currentUser = await clerkClient.users.getUser(req.auth.userId);
    const user = await User.findOne({ clerkId: currentUser.id });

    if (!user || user.role !== "artist") {
      return res.status(403).json({
        artist: false,
        message: "Unauthorized - you must be an artist",
      });
    }

    res.status(200).json({ artist: true });
  } catch (error) {
    next(error);
  }
};

export const checkPremium = async (req, res, next) => {
  try {
    const currentUser = await clerkClient.users.getUser(req.auth.userId);
    const user = await User.findOne({ clerkId: currentUser.id });

    if (!user || user.role !== "premium") {
      return res.status(403).json({
        premium: false,
        message: "Unauthorized - you must be a premium user",
      });
    }

    res.status(200).json({ premium: true });
  } catch (error) {
    next(error);
  }
};

/**
 * createSong
 */
