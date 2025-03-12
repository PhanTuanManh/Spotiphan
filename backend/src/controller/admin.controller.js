// controllers/admin.controller.js
import { uploadToCloudinary } from "../lib/cloudinary.js";
import { Advertisement } from "../models/advertisement.model.js";
import { Album } from "../models/album.model.js";
import { Playlist } from "../models/playList.model.js";
import { Song } from "../models/song.model.js";
import { SubscriptionPlan } from "../models/subscriptionPlan.model.js";
import { User } from "../models/user.model.js";
import { clerkClient } from "@clerk/express";
import dotenv from "dotenv";

dotenv.config();

// Todo: Single/EP logic API
export const approveSingleOrEP = async (req, res) => {
  try {
    const { songId } = req.params;

    const song = await Song.findById(songId);
    if (!song) {
      return res.status(404).json({ message: "Song not found" });
    }

    if (!song.isSingle) {
      return res
        .status(400)
        .json({
          message: "This song is part of an album. Approve the album instead.",
        });
    }

    if (song.status === "approved") {
      return res.status(400).json({ message: "Song is already approved." });
    }

    song.status = "approved";
    await song.save();

    res.status(200).json({ message: "Single/EP approved successfully", song });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error approving single/EP", error: error.message });
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
      return res
        .status(400)
        .json({
          message: "This song is part of an album. Reject the album instead.",
        });
    }

    if (song.status === "rejected") {
      return res.status(400).json({ message: "Song is already rejected." });
    }

    song.status = "rejected";
    await song.save();

    res.status(200).json({ message: "Single/EP rejected successfully", song });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error rejecting single/EP", error: error.message });
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
        status: 1, // "pending" trước (theo bảng mã ASCII: pending < approved < rejected)
        createdAt: -1, // Mới nhất trước
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

export const archiveSingleOrEP = async (req, res) => {
  try {
    const { songId } = req.params;
    const artistId = req.userId;

    const song = await Song.findById(songId);
    if (!song) {
      return res.status(404).json({ message: "Song not found" });
    }

    if (!song.isSingle) {
      return res
        .status(400)
        .json({
          message: "This song is part of an album. Archive the album instead.",
        });
    }

    if (song.artist.toString() !== artistId && req.user.role !== "admin") {
      return res
        .status(403)
        .json({
          message: "You do not have permission to archive this single/EP.",
        });
    }

    song.status = "archived";
    await song.save();

    res.status(200).json({ message: "Single/EP archived successfully", song });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error archiving single/EP", error: error.message });
  }
};

export const unarchiveSingleOrEP = async (req, res) => {
  try {
    const { songId } = req.params;
    const artistId = req.userId;

    const song = await Song.findById(songId);
    if (!song) {
      return res.status(404).json({ message: "Song not found" });
    }

    if (!song.isSingle) {
      return res
        .status(400)
        .json({
          message: "This song is part of an album. Archive the album instead.",
        });
    }

    if (song.artist.toString() !== artistId && req.user.role !== "admin") {
      return res
        .status(403)
        .json({
          message: "You do not have permission to archive this single/EP.",
        });
    }

    song.status = "pending";
    await song.save();

    res.status(200).json({ message: "Single/EP archived successfully", song });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error archiving single/EP", error: error.message });
  }
};

export const deleteSingleOrEP = async (req, res) => {
  try {
    const { songId } = req.params;

    // 🔍 Tìm bài hát cần xóa
    const song = await Song.findById(songId);
    if (!song) {
      return res.status(404).json({ message: "Song not found" });
    }

    if (song.artist.toString() !== req.userId && req.user.role !== "admin") {
      return res
        .status(403)
        .json({
          message: "You do not have permission to delete this single/EP",
        });
    }

    // 🗑 Xóa bài hát khỏi playlist
    await Playlist.updateMany({ songs: songId }, { $pull: { songs: songId } });

    // 🗑 Xóa lịch sử nghe bài hát
    await UserListeningHistory.deleteMany({ songId });

    // 🗑 Xóa bài hát khỏi hệ thống
    await Song.deleteOne({ _id: songId });

    res.status(200).json({ message: "Single/EP deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting single/EP", error: error.message });
  }
};

// Todo: Album logic API
export const approveAlbum = async (req, res) => {
  try {
    const { albumId } = req.params;

    const album = await Album.findById(albumId);
    if (!album || album.status !== "pending") {
      return res
        .status(404)
        .json({ message: "Album not found or not pending approval" });
    }

    album.status = "approved";
    await album.save();

    await Song.updateMany({ albumId: album._id }, { status: "approved" });

    res
      .status(200)
      .json({ message: "Album and all its songs approved successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error approving album" });
  }
};

export const rejectAlbum = async (req, res) => {
  try {
    const { albumId } = req.params;

    const album = await Album.findById(albumId);
    if (!album || album.status !== "pending") {
      return res
        .status(404)
        .json({ message: "Album not found or not pending approval" });
    }

    album.status = "rejected";
    await album.save();

    await Song.updateMany({ albumId: album._id }, { status: "rejected" });

    res
      .status(200)
      .json({ message: "Album and all its songs rejected successfully" });
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

    if (album.artist.toString() !== req.userId && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "You do not have permission to delete this album" });
    }

    await Song.deleteMany({ albumId: album._id });

    await album.deleteOne();

    res
      .status(200)
      .json({ message: "Album and all its songs deleted successfully" });
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
        status: 1, // "pending" trước, sau đó "approved", cuối cùng "rejected"
        createdAt: -1, // Album mới nhất trước
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
};

export const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Tìm user trước khi xóa
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 1️⃣ **Xóa Playlist của user**
    await Playlist.deleteMany({ userId });

    // 2️⃣ **Xóa Albums & Songs nếu user là artist**
    if (user.role === "artist") {
      const albums = await Album.find({ artist: userId });

      for (const album of albums) {
        // Xóa tất cả bài hát trong album
        await Song.deleteMany({ albumId: album._id });
      }

      // Xóa album của user
      await Album.deleteMany({ artist: userId });

      // Xóa tất cả bài hát Single của artist
      await Song.deleteMany({ artist: userId, isSingle: true });
    }

    // 3️⃣ **Xóa lịch sử nghe nhạc**
    await UserListeningHistory.deleteMany({ userId });

    // 4️⃣ **Xóa lịch sử thanh toán**
    await Payment.deleteMany({ userId });

    // 5️⃣ **Xóa tin nhắn của user**
    await Message.deleteMany({ senderId: userId });
    await Message.deleteMany({ receiverId: userId });

    // 6️⃣ **Gỡ user khỏi danh sách followers/following**
    await User.updateMany(
      { following: userId },
      { $pull: { following: userId } }
    );

    await User.updateMany(
      { followers: userId },
      { $pull: { followers: userId } }
    );

    // 7️⃣ **Xóa user**
    await User.findByIdAndDelete(userId);

    res
      .status(200)
      .json({ message: "User and associated data deleted successfully." });
  } catch (error) {
    console.error("Error deleting user:", error);
    next(error);
  }
};

export const toggleBlockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res
      .status(200)
      .json({
        message: `User ${
          user.isBlocked ? "blocked" : "unblocked"
        } successfully`,
      });
  } catch (error) {
    next(error);
  }
};

// Todo Subscription Plan Logic API
export const createSubscriptionPlan = async (req, res, next) => {
  try {
    const { name, durationInDays, price } = req.body;
    const subscriptionPlan = new SubscriptionPlan({
      name,
      durationInDays,
      price,
    });
    await subscriptionPlan.save();
    res.status(201).json(subscriptionPlan);
  } catch (error) {
    next(error);
  }
};

export const deleteSubscriptionPlan = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Kiểm tra nếu có user đang sử dụng gói này
    const usersUsingPlan = await User.countDocuments({ subscriptionPlan: id });

    if (usersUsingPlan > 0) {
      return res.status(400).json({
        message:
          "Cannot delete this subscription plan because users are currently using it.",
      });
    }

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
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const totalPlans = await SubscriptionPlan.countDocuments();
    const subscriptionPlans = await SubscriptionPlan.find()
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      totalPlans,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalPlans / limit),
      subscriptionPlans,
    });
  } catch (error) {
    next(error);
  }
};

export const checkAdmin = async (req, res, next) => {
  try {
    const currentUser = await clerkClient.users.getUser(req.auth.userId);
    const userEmail = currentUser.primaryEmailAddress?.emailAddress;

    // Kiểm tra nếu email khớp với ADMIN_EMAIL trong env
    const isAdminByEmail = userEmail === process.env.ADMIN_EMAIL;

    // Kiểm tra nếu user có role là admin trong database
    const user = await User.findOne({ clerkId: currentUser.id });
    const isAdminByRole = user?.role === "admin";

    // Nếu user là admin theo email hoặc role
    if (isAdminByEmail || isAdminByRole) {
      return res.status(200).json({ admin: true });
    }

    return res
      .status(403)
      .json({ admin: false, message: "Unauthorized - you must be an admin" });
  } catch (error) {
    next(error);
  }
};
