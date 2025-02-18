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
        isPremium: { type: Boolean, default: false }, // ✅ Tự động cập nhật premium status
        subscriptionPlan: { type: mongoose.Schema.Types.ObjectId, ref: "SubscriptionPlan" },

        paymentHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: "Payment" }], // Lịch sử thanh toán

        likedSongs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Song" }], // Danh sách bài hát đã thích

        playlists: [{ type: mongoose.Schema.Types.ObjectId, ref: "Playlist" }], // Danh sách playlist do user tạo

        albums: [{ type: mongoose.Schema.Types.ObjectId, ref: "Album" }], // ✅ Chỉ artist có albums (xử lý bằng middleware)

        followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Những người theo dõi
        following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Người dùng đang theo dõi
        
        isBlocked: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// ✅ Middleware tự động cập nhật `isPremium` khi có subscription
userSchema.pre("save", function (next) {
    this.isPremium = this.premiumExpiration && this.premiumExpiration > new Date();
    next();
});

// ✅ Chặn non-artist có albums
userSchema.pre("save", function (next) {
    if (this.role !== "artist" && this.albums.length > 0) {
        return next(new Error("Chỉ artist mới có thể có albums."));
    }
    next();
});

// ✅ Chỉ populate `albums` khi user là artist
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    if (user.role !== "artist") {
        delete user.albums;
    }
    return user;
};

export const User = mongoose.model("User", userSchema);
