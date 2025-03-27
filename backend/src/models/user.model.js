// src/models/user.model.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    imageUrl: { type: String, required: true },
    clerkId: { type: String, required: true, unique: true },

    role: {
      type: String,
      enum: ["free", "premium", "artist", "admin"],
      default: "free",
    },

    premiumExpiration: { type: Date, default: null },
    isPremium: { type: Boolean, default: false },
    subscriptionPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
    },

    paymentHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: "Payment" }],
    likedSongs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Song" }],
    playlists: [{ type: mongoose.Schema.Types.ObjectId, ref: "Playlist" }],
    albums: [{ type: mongoose.Schema.Types.ObjectId, ref: "Album" }],

    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isBlocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Middleware tự động cập nhật isPremium
userSchema.pre("save", function (next) {
  this.isPremium =
    this.premiumExpiration && this.premiumExpiration > new Date();
  next();
});

// Middleware kiểm tra artist trước khi có albums
userSchema.pre("save", function (next) {
  if (this.role !== "artist" && this.albums.length > 0) {
    return next(new Error("Chỉ artist mới có thể có albums."));
  }
  next();
});

// Chỉ populate albums khi user là artist
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  if (user.role !== "artist") {
    delete user.albums;
  }
  return user;
};

// Phương thức quản lý follow
userSchema.methods = {
  followUser: async function (userIdToFollow) {
    if (this._id.equals(userIdToFollow)) {
      throw new Error("Cannot follow yourself");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (!this.following.includes(userIdToFollow)) {
        // 1. Thêm vào danh sách following của user hiện tại
        this.following.push(userIdToFollow);
        await this.save({ session });

        // 2. Thêm vào danh sách followers của user được follow
        await mongoose
          .model("User")
          .findByIdAndUpdate(
            userIdToFollow,
            { $addToSet: { followers: this._id } },
            { session }
          );

        await session.commitTransaction();
      }
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  unfollowUser: async function (userIdToUnfollow) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (this.following.includes(userIdToUnfollow)) {
        // 1. Xóa khỏi danh sách following của user hiện tại
        this.following.pull(userIdToUnfollow);
        await this.save({ session });

        // 2. Xóa khỏi danh sách followers của user kia
        await mongoose
          .model("User")
          .findByIdAndUpdate(
            userIdToUnfollow,
            { $pull: { followers: this._id } },
            { session }
          );

        await session.commitTransaction();
      }
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  isFollowing: function (userId) {
    return this.following.some((id) => id.equals(userId));
  },

  getFollowerCount: function () {
    return this.followers.length;
  },

  getFollowingCount: function () {
    return this.following.length;
  },
};

export const User = mongoose.model("User", userSchema);
