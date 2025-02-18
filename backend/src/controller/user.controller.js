// src/controllers/user.controller.js
import mongoose from "mongoose";
import cloudinary from "../lib/cloudinary.js";
import { io } from "../lib/socket.js"; // WebSocket để gửi thông báo realtime
import { Album } from "../models/album.model.js";
import { Message } from "../models/message.model.js";
import { Payment } from "../models/payment.model.js";
import { Song } from "../models/song.model.js";
import { User } from "../models/user.model.js";
import { Category } from "../models/category.model.js";

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
        await user.populate("subscriptionPlan likedSongs followers following playlists");
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
            return res.status(404).json({ message: "User not found. Please register first." });
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
            return res.status(400).json({ message: "You are already following this user" });
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
        const myId = req.auth.userId;
        const { planId } = req.body;

        const plan = await SubscriptionPlan.findById(planId);
        if (!plan) {
            return res.status(404).json({ message: "Subscription plan not found" });
        }

        // Tính toán thời gian hết hạn gói Premium
        const newExpiration = new Date(Date.now() + plan.durationInDays * 24 * 60 * 60 * 1000);

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

        res.status(200).json({ message: "Subscription updated successfully", user });
    } catch (error) {
        next(error);
    }
};


export const createAlbum = async (req, res, next) => {
    try {
        const { title, releaseYear, category } = req.body;
        const { imageFile } = req.files;
        const artistId = req.auth.userId;

        // Kiểm tra người dùng có phải artist không
        const artist = await User.findOne({ clerkId: artistId });
        if (!artist || artist.role !== "artist") {
            return res.status(403).json({ message: "Only artists can create albums" });
        }

        // Kiểm tra xem album có bị trùng tên không
        const existingAlbum = await Album.findOne({ title, artist: artist._id });
        if (existingAlbum) {
            return res.status(400).json({ message: "Album with this title already exists" });
        }

        // Kiểm tra category hợp lệ
        if (!category || category.length === 0) {
            return res.status(400).json({ message: "At least one category is required" });
        }
        const validCategories = await Category.find({ _id: { $in: category } });
        if (validCategories.length !== category.length) {
            return res.status(400).json({ message: "Invalid category" });
        }

        // Upload ảnh bìa lên Cloudinary
        if (!imageFile) {
            return res.status(400).json({ message: "Album cover image is required" });
        }
        const imageUrl = await uploadToCloudinary(imageFile);

        // Tạo album mới
        const album = new Album({
            title,
            artist: artist._id,
            imageUrl,
            releaseYear,
            category,
            status: "pending", // Album cần được duyệt
        });

        await album.save();

        // Cập nhật category chứa album này
        await Category.updateMany({ _id: { $in: category } }, { $push: { albums: album._id } });

        res.status(201).json({ message: "Album created successfully and is pending approval", album });
    } catch (error) {
        console.error("Error in createAlbum", error);
        next(error);
    }
};


export const updateAlbum = async (req, res, next) => {
    try {
        const { albumId } = req.params;
        const { title, releaseYear, category } = req.body;
        const userId = req.auth.userId;

        // Kiểm tra album có tồn tại không
        const album = await Album.findById(albumId);
        if (!album) {
            return res.status(404).json({ message: "Album not found" });
        }

        // Chỉ cho phép artist cập nhật album của họ
        if (album.artist.toString() !== userId) {
            return res.status(403).json({ message: "You do not have permission to update this album" });
        }

        // Nếu có category, kiểm tra hợp lệ
        let validCategories = [];
        if (category) {
            validCategories = await Category.find({ _id: { $in: category } });
            if (validCategories.length !== category.length) {
                return res.status(400).json({ message: "Some categories are invalid" });
            }
        }

        // Cập nhật thông tin album
        album.title = title || album.title;
        album.releaseYear = releaseYear || album.releaseYear;
        album.category = validCategories.map(c => c._id) || album.category;

        await album.save();

        // Cập nhật danh mục
        if (category) {
            await Category.updateMany({ _id: { $nin: category } }, { $pull: { albums: album._id } });
            await Category.updateMany({ _id: { $in: category } }, { $push: { albums: album._id } });
        }
        
        res.status(200).json({ message: "Album updated successfully", album });
    } catch (error) {
        next(error);
    }
};

export const deleteAlbum = async (req, res, next) => {
    try {
        const { albumId } = req.params;
        const userId = req.auth.userId;

        const album = await Album.findById(albumId);
        if (!album) {
            return res.status(404).json({ message: "Album not found" });
        }

        // Chỉ cho phép artist xóa album của họ
        if (album.artist.toString() !== userId) {
            return res.status(403).json({ message: "You do not have permission to delete this album" });
        }

        // Xóa album khỏi danh mục
        await Category.updateMany(
            { albums: albumId },
            { $pull: { albums: albumId } }
        );

        await album.remove();
        res.status(200).json({ message: "Album deleted successfully" });
    } catch (error) {
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


export const removeSongFromAlbum = async (req, res, next) => {
    try {
        const { albumId, songId } = req.params;
        const userId = req.auth.userId;

        const album = await Album.findById(albumId);
        if (!album) {
            return res.status(404).json({ message: "Album not found" });
        }

        if (album.artist.toString() !== userId) {
            return res.status(403).json({ message: "Only the artist can remove songs from this album" });
        }

        album.songs = album.songs.filter(id => id.toString() !== songId);
        await album.save();

        res.status(200).json({ message: "Song removed from album successfully", album });
    } catch (error) {
        next(error);
    }
};




/**
 * createSong
 */
export const createSong = async (req, res, next) => {
    try {
        // Kiểm tra xem có đủ file không
        if (!req.files || !req.files.audioFile || !req.files.imageFile) {
            return res.status(400).json({ message: "Vui lòng tải lên đầy đủ tệp âm thanh và ảnh bìa" });
        }

        const { title, albumId, duration, isSingle } = req.body;
        const artistId = req.auth.userId;

        // Kiểm tra xem user có phải artist không
        const artist = await User.findById(artistId);
        if (!artist || artist.role !== "artist") {
            return res.status(403).json({ message: "Chỉ artist mới có quyền thêm bài hát" });
        }

        // Kiểm tra chỉ được chọn một trong hai: isSingle hoặc albumId
        if ((!isSingle && !albumId) || (isSingle && albumId)) {
            return res.status(400).json({ message: "Bạn phải chọn một trong hai: Single/EP hoặc Album" });
        }

        // Nếu có albumId, kiểm tra album có tồn tại không
        let album = null;
        if (albumId) {
            album = await Album.findById(albumId);
            if (!album) {
                return res.status(404).json({ message: "Album không tồn tại" });
            }

            // Kiểm tra xem user có phải chủ album không
            if (album.artist.toString() !== artistId) {
                return res.status(403).json({ message: "Bạn không có quyền thêm bài hát vào album này" });
            }

             // Kiểm tra xem bài hát đã tồn tại trong album chưa
             const existingSong = await Song.findOne({ title, albumId });
             if (existingSong) {
                 return res.status(400).json({ message: "Bài hát này đã tồn tại trong album." });
             }
        }

        // Upload file lên Cloudinary
        const audioFile = req.files.audioFile;
        const imageFile = req.files.imageFile;
        const audioUrl = await uploadToCloudinary(audioFile);
        const imageUrl = await uploadToCloudinary(imageFile);

        // Tạo bài hát mới
        const song = new Song({
            title,
            artist: artist._id,
            audioUrl,
            imageUrl,
            duration,
            albumId: album ? album._id : null, // Nếu không có album, set null
            isSingle: !!isSingle, // Nếu không có album, là Single/EP
        });

        await song.save();

        // Nếu bài hát thuộc album, cập nhật album
        if (album) {
            album.songs.push(song._id);
            await album.save();
        }

        res.status(201).json({ message: "Bài hát đã được tạo thành công", song });
    } catch (error) {
        console.log("Lỗi khi tạo bài hát:", error);
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

        // Kiểm tra quyền của artist
        if (song.artist.toString() !== artistId) {
            return res.status(403).json({ message: "Bạn không có quyền archive bài hát này." });
        }

        song.status = "archived";
        await song.save();

        res.status(200).json({ message: "Song archived successfully" });

    } catch (error) {
        res.status(500).json({ message: "Error archiving song" });
    }
};


export const updateSong = async (req, res, next) => {
    try {
        const { songId } = req.params;
        const { title, duration } = req.body;
        const artistId = req.auth.userId;

        // Tìm bài hát
        const song = await Song.findById(songId);
        if (!song) {
            return res.status(404).json({ message: "Bài hát không tồn tại" });
        }

        // Kiểm tra quyền sở hữu
        if (song.artist.toString() !== artistId) {
            return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa bài hát này" });
        }

        // Kiểm tra nếu cần update ảnh bìa hoặc file nhạc
        let imageUrl = song.imageUrl;
        let audioUrl = song.audioUrl;

        if (req.files) {
            if (req.files.imageFile) {
                const imageResult = await uploadToCloudinary(req.files.imageFile);
                imageUrl = imageResult;
            }
            if (req.files.audioFile) {
                const audioResult = await uploadToCloudinary(req.files.audioFile);
                audioUrl = audioResult;
            }
        }

        // Cập nhật bài hát
        song.title = title || song.title;
        song.duration = duration || song.duration;
        song.imageUrl = imageUrl;
        song.audioUrl = audioUrl;

        await song.save();

        res.status(200).json({ message: "Cập nhật bài hát thành công", song });
    } catch (error) {
        console.log("Lỗi khi cập nhật bài hát:", error);
        next(error);
    }
};

