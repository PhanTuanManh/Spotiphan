// controllers/admin.controller.js

import cloudinary from "../lib/cloudinary.js";
import { Advertisement } from "../models/advertisement.model.js";
import { Album } from "../models/album.model.js";
import { Playlist } from "../models/playList.model.js";
import { Song } from "../models/song.model.js";
import { SubscriptionPlan } from "../models/subscriptionPlan.model.js";
import { User } from "../models/user.model.js";


// Todo: Single/EP logic API
export const approveSingleOrEP = async (req, res) => {
    try {
        const { songId } = req.params;

        // Tìm bài hát cần duyệt
        const song = await Song.findById(songId);
        if (!song) {
            return res.status(404).json({ message: "Song not found" });
        }

        // Chỉ cho phép duyệt bài hát Single hoặc EP
        if (!song.isSingle) {
            return res.status(400).json({ message: "This song is part of an album. Approve the album instead." });
        }

        // Duyệt bài hát
        song.status = "approved";
        await song.save();

        res.status(200).json({ message: "Single/EP approved successfully", song });
    } catch (error) {
        res.status(500).json({ message: "Error approving single/EP" });
    }
};

export const rejectSingleOrEP = async (req, res) => {
    try {
        const { songId } = req.params;

        const song = await Song.findById(songId);
        if (!song) {
            return res.status(404).json({ message: "Song not found" });
        }

        if (!song.isSingle) {
            return res.status(400).json({ message: "This song is part of an album. Reject the album instead." });
        }

        // Từ chối bài hát Single/EP
        song.status = "rejected";
        await song.save();

        res.status(200).json({ message: "Single/EP rejected successfully", song });
    } catch (error) {
        res.status(500).json({ message: "Error rejecting single/EP" });
    }
};

export const getAllSinglesOrEPs = async (req, res) => {
    try {
        let { page = 1, limit = 10 } = req.query;

        // Chuyển đổi kiểu dữ liệu
        page = parseInt(page);
        limit = parseInt(limit);

        // Tính số lượng bài hát bỏ qua (skip)
        const skip = (page - 1) * limit;

        // Lấy danh sách Single/EP, sắp xếp theo trạng thái chờ duyệt trước
        const singles = await Song.find({ isSingle: true })
            .populate("artist")
            .sort({ 
                status: 1,  // "pending" trước (theo bảng mã ASCII: pending < approved < rejected)
                createdAt: -1 // Mới nhất trước
            })
            .skip(skip)
            .limit(limit);

        // Đếm tổng số bài hát Single/EP
        const totalSingles = await Song.countDocuments({ isSingle: true });
        const totalPages = Math.ceil(totalSingles / limit);

        res.status(200).json({
            page,
            totalPages,
            totalSingles,
            limit,
            singles,
        });
    } catch (error) {
        res.status(500).json({ message: "Error retrieving pending singles/EPs" });
    }
};


// Todo: Album logic API
export const approveAlbum = async (req, res) => {
    try {
        const { albumId } = req.params;

        const album = await Album.findById(albumId);
        if (!album || album.status !== "pending") {
            return res.status(404).json({ message: "Album not found or not pending approval" });
        }

        album.status = "approved";
        await album.save();

        await Song.updateMany({ albumId: album._id }, { status: "approved" });

        res.status(200).json({ message: "Album and all its songs approved successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error approving album" });
    }
};


export const rejectAlbum = async (req, res) => {
    try {
        const { albumId } = req.params;

        const album = await Album.findById(albumId);
        if (!album || album.status !== "pending") {
            return res.status(404).json({ message: "Album not found or not pending approval" });
        }

        album.status = "rejected";
        await album.save();

        await Song.updateMany({ albumId: album._id }, { status: "rejected" });

        res.status(200).json({ message: "Album and all its songs rejected successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error rejecting album" });
    }
};


export const deleteAlbum = async (req, res) => {
    try {
        const { albumId } = req.params;

        const album = await Album.findById(albumId);
        if (!album) {
            return res.status(404).json({ message: "Album not found" });
        }

        await Song.deleteMany({ albumId: album._id });

        await Album.findByIdAndDelete(albumId);

        res.status(200).json({ message: "Album and all its songs deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting album" });
    }
};

export const getAllAlbums = async (req, res) => {
    try {
        let { page = 1, limit = 10 } = req.query;

        // Chuyển đổi kiểu dữ liệu
        page = parseInt(page);
        limit = parseInt(limit);

        // Tính số lượng album bỏ qua (skip)
        const skip = (page - 1) * limit;

        // Lấy danh sách Album, sắp xếp theo trạng thái chờ duyệt trước
        const albums = await Album.find()
            .populate("artist")
            .sort({ 
                status: 1,  // "pending" trước, sau đó "approved", cuối cùng "rejected"
                createdAt: -1 // Album mới nhất trước
            })
            .skip(skip)
            .limit(limit);

        // Đếm tổng số album
        const totalAlbums = await Album.countDocuments();
        const totalPages = Math.ceil(totalAlbums / limit);

        res.status(200).json({
            page,
            totalPages,
            totalAlbums,
            limit,
            albums,
        });
    } catch (error) {
        res.status(500).json({ message: "Error retrieving albums" });
    }
};


// Todo: User logic API
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

// Todo Subscription Plan Logic API
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

export const deleteSubscriptionPlan = async (req, res, next) => {
	try {
		const { id } = req.params;
		await SubscriptionPlan.findByIdAndDelete(id);
		res.status(200).json({ message: "Subscription plan deleted successfully" });
	} catch (error) {
		next(error);
	}
};

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

export const getAllSubscriptionPlans = async (req, res, next) => {
	try {
		const subscriptionPlans = await SubscriptionPlan.find();
		res.status(200).json(subscriptionPlans);
	} catch (error) {
		next(error);
	}
};

// Todo: Playlist Logic API
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

// Todo: Advertisement Logic API
export const createAdvertisement = async (req, res, next) => {
    try {
        const { title, mediaUrl, redirectUrl, duration } = req.body;
        const newAd = new Advertisement({ title, mediaUrl, redirectUrl, duration });
        await newAd.save();
        res.status(201).json(newAd);
    } catch (error) {
        next(error);
    }
};

export const deleteAdvertisement = async (req, res, next) => {
    try {
        const { id } = req.params;
        await Advertisement.findByIdAndDelete(id);
        res.status(200).json({ message: "Advertisement deleted successfully" });
    } catch (error) {
        next(error);
    }
};