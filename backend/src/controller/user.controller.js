// src/controllers/user.controller.js
import { Message } from "../models/message.model.js";
import { Payment } from "../models/payment.model.js";
import { User } from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import { Album } from "../models/album.model.js";
import { Song } from "../models/song.model.js";

// helper function for cloudinary uploads
const uploadToCloudinary = async (file) => {
	try {
		const result = await cloudinary.uploader.upload(file.tempFilePath, {
			resource_type: "auto",
		});
		return result.secure_url;
	} catch (error) {
		console.log("Error in uploadToCloudinary", error);
		throw new Error("Error uploading to cloudinary");
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


export const createAlbum = async (req, res, next) => {
    try {
        const { title, releaseYear } = req.body;
        const { imageFile } = req.files;
        const artistId = req.auth.userId; // Lấy ID từ auth middleware

        // Kiểm tra người dùng có phải artist không
        const artist = await User.findOne({ clerkId: artistId });
        if (!artist || artist.role !== "artist") {
            return res.status(403).json({ message: "Only artists can create albums" });
        }

        // Upload ảnh bìa lên Cloudinary
        if (!imageFile) {
            return res.status(400).json({ message: "Album cover image is required" });
        }
        const imageUrl = await uploadToCloudinary(imageFile);

        // Tạo album mới
        const album = new Album({
            title,
            artist: artist._id, // Liên kết với User (Artist)
            imageUrl,
            releaseYear,
            status: "pending", // Mặc định album cần được admin duyệt
        });

        await album.save();

        res.status(201).json({ message: "Album created successfully and is pending approval", album });
    } catch (error) {
        console.log("Error in createAlbum", error);
        next(error);
    }
};

export const archiveAlbum = async (req, res) => {
    try {
        const { albumId } = req.params;

        const album = await Album.findById(albumId);
        if (!album) {
            return res.status(404).json({ message: "Album not found" });
        }

        album.status = "archived";
        await album.save();
        await Song.updateMany({ albumId: album._id }, { status: "archived" });

        res.status(200).json({ message: "Album and all its songs archived successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error archiving album" });
    }
};


/**
 * createSong
 */
export const createSong = async (req, res, next) => {
    try {
        if (!req.files || !req.files.audioFile || !req.files.imageFile) {
            return res.status(400).json({ message: "Please upload all files" });
        }

        const { title, artist, albumId, duration } = req.body;
        const audioFile = req.files.audioFile;
        const imageFile = req.files.imageFile;

        const audioUrl = await uploadToCloudinary(audioFile);
        const imageUrl = await uploadToCloudinary(imageFile);

        const isSingle = !albumId; // Nếu không có albumId, đây là một Single

        const song = new Song({
            title,
            artist,
            audioUrl,
            imageUrl,
            duration,
            albumId: albumId || null,
            isSingle
        });

        await song.save();

        // Nếu bài hát thuộc album, cập nhật album
        if (albumId) {
            await Album.findByIdAndUpdate(albumId, {
                $push: { songs: song._id }
            });
        }

        res.status(201).json(song);
    } catch (error) {
        console.log("Error in createSong", error);
        next(error);
    }
};

export const archiveSong = async (req, res) => {
    try {
        const { songId } = req.params;

        const song = await Song.findById(songId);
        if (!song) {
            return res.status(404).json({ message: "Song not found" });
        }

        song.status = "archived";
        await song.save();

        res.status(200).json({ message: "Song archived successfully" });

    } catch (error) {
        res.status(500).json({ message: "Error archiving song" });
    }
};
