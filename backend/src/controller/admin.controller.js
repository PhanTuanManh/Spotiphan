// controllers/admin.controller.js

import cloudinary from "../lib/cloudinary.js";
import { Album } from "../models/album.model.js";
import { Playlist } from "../models/playList.model.js";
import { Song } from "../models/song.model.js";
import { SubscriptionPlan } from "../models/subscriptionPlan.model.js";
import { User } from "../models/user.model.js";

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

		const song = new Song({
			title,
			artist,
			audioUrl,
			imageUrl,
			duration,
			albumId: albumId || null,
		});

		await song.save();

		// if song belongs to an album, update the album's songs array
		if (albumId) {
			await Album.findByIdAndUpdate(albumId, {
				$push: { songs: song._id },
			});
		}
		res.status(201).json(song);
	} catch (error) {
		console.log("Error in createSong", error);
		next(error);
	}
};

export const deleteSong = async (req, res, next) => {
	try {
		const { id } = req.params;

		const song = await Song.findById(id);

		// if song belongs to an album, update the album's songs array
		if (song.albumId) {
			await Album.findByIdAndUpdate(song.albumId, {
				$pull: { songs: song._id },
			});
		}

		await Song.findByIdAndDelete(id);

		res.status(200).json({ message: "Song deleted successfully" });
	} catch (error) {
		console.log("Error in deleteSong", error);
		next(error);
	}
};

export const approveAlbum = async (req, res) => {
    try {
        const { albumId } = req.params;

        // Tìm album cần duyệt
        const album = await Album.findById(albumId);
        if (!album) return res.status(404).json({ message: "Album không tồn tại" });

        // Cập nhật trạng thái album
        album.status = "approved";
        await album.save();

        // Cập nhật tất cả bài hát trong album thành "approved"
        await Song.updateMany({ albumId: albumId }, { status: "approved" });

        res.status(200).json({ message: "Album và tất cả bài hát đã được duyệt", album });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error });
    }
};

export const approveSong = async (req, res) => {
    try {
        const { songId } = req.params;

        const song = await Song.findByIdAndUpdate(songId, { status: "approved" }, { new: true });

        if (!song) return res.status(404).json({ message: "Bài hát không tồn tại" });

        res.status(200).json({ message: "Bài hát đã được duyệt", song });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error });
    }
};


export const approveMultipleSongs = async (req, res) => {
    try {
        const { songIds } = req.body; // Nhận danh sách ID bài hát từ request

        // Cập nhật trạng thái tất cả các bài hát thành "approved"
        const updatedSongs = await Song.updateMany(
            { _id: { $in: songIds } },
            { status: "approved" }
        );

        res.status(200).json({ message: `Đã duyệt ${updatedSongs.modifiedCount} bài hát` });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error });
    }
};



export const createAlbum = async (req, res, next) => {
	try {
		const { title, artist, releaseYear } = req.body;
		const { imageFile } = req.files;

		const imageUrl = await uploadToCloudinary(imageFile);

		const album = new Album({
			title,
			artist,
			imageUrl,
			releaseYear,
		});

		await album.save();

		res.status(201).json(album);
	} catch (error) {
		console.log("Error in createAlbum", error);
		next(error);
	}
};

export const deleteAlbum = async (req, res, next) => {
	try {
		const { id } = req.params;
		await Song.deleteMany({ albumId: id });
		await Album.findByIdAndDelete(id);
		res.status(200).json({ message: "Album deleted successfully" });
	} catch (error) {
		console.log("Error in deleteAlbum", error);
		next(error);
	}
};

export const checkAdmin = async (req, res, next) => {
	res.status(200).json({ admin: true }
	)};

/**
 * Create a new user 
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
 * Get all users  with pagination
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
	}

/**
 * Delete a user 
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
	}

/**
 * Block/Unblock a user 
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
 * createSubscriptionPlan 
 */
export const createSubscriptionPlan = async (req, res, next) => {
	try {
		const { name, durationInDays, price } = req.body;
		const subscriptionPlan = new SubscriptionPlan({ name, durationInDays, price });
		await subscriptionPlan.save();
		res.status(201).json(subscriptionPlan);
	} catch (error) {
		next(error);
	}
};

/**
 * deleteSubscriptionPlan 
 */
export const deleteSubscriptionPlan = async (req, res, next) => {
	try {
		const { id } = req.params;
		await SubscriptionPlan.findByIdAndDelete(id);
		res.status(200).json({ message: "Subscription plan deleted successfully" });
	} catch (error) {
		next(error);
	}
};

/**
 * updateSubscriptionPlan 
 */
export const updateSubscriptionPlan = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { name, durationInDays, price } = req.body;
		const subscriptionPlan = await SubscriptionPlan.findByIdAndUpdate(
			id,
			{ name, durationInDays, price },
			{ new: true }
		);
		res.status(200).json(subscriptionPlan);
	} catch (error) {
		next(error);
	}
};

/**
 * getAllSubscriptionPlans 
 */
export const getAllSubscriptionPlans = async (req, res, next) => {
	try {
		const subscriptionPlans = await SubscriptionPlan.find();
		res.status(200).json(subscriptionPlans);
	} catch (error) {
		next(error);
	}
};


/**
 * Admin tạo Public Playlist
 */
export const createPublicPlaylist = async (req, res) => {
    try {
        const { name, songIds } = req.body;
        const userId = req.auth.userId; // Admin ID

        // Kiểm tra bài hát có hợp lệ không
        const approvedSongs = await Song.find({ _id: { $in: songIds }, status: "approved" });
        if (approvedSongs.length !== songIds.length) {
            return res.status(400).json({ message: "Một số bài hát chưa được duyệt" });
        }

        // Tạo Playlist
        const newPlaylist = new Playlist({
            name,
            userId,
            songs: songIds,
            isPublic: true, // Admin tạo Playlist công khai
        });

        await newPlaylist.save();
        res.status(201).json({ message: "Playlist công khai đã được tạo", playlist: newPlaylist });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error });
    }
};
