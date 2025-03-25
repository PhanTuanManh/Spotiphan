// backend/src/controllers/auth.controller.js

import { User } from "../models/user.model.js";

export const authCallback = async (req, res, next) => {
  try {
    const { id, firstName, lastName, imageUrl } = req.body;

    // check if user already exists
    const user = await User.findOne({ clerkId: id });

    if (!user) {
      // signup
      await User.create({
        clerkId: id,
        fullName: `${firstName || ""} ${lastName || ""}`.trim(),
        imageUrl,
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.log("Error in auth callback", error);
    next(error);
  }
};

export const getUserStatus = async (req, res, next) => {
  try {
    // Lấy userId từ middleware xác thực (protectRoute)
    const myId = req.auth.userId;

    // Tìm người dùng theo clerkId
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

    // Nếu user là artist, populate thêm albums
    if (user.role === "artist") {
      await user.populate("albums");
    }

    // Xác định các quyền của user
    const role = user.role;
    const isAdmin = role === "admin";
    const isPremium = ["premium", "artist", "admin"].includes(role);
    const isArtist = role === "artist";

    // ✅ Trả về thêm `id` của user để dùng trong frontend
    res.status(200).json({
      id: user._id, // ✅ Bổ sung id của user từ MongoDB
      user,
      isAdmin,
      isPremium,
      isArtist,
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate("subscriptionPlan")
    .populate("likedSongs")
    .populate("playlists");

  res.json({
    id: user._id,
    user,
    isAdmin: user.role === "admin",
    isPremium: ["premium", "artist", "admin"].includes(user.role),
    isArtist: user.role === "artist",
  });
};
