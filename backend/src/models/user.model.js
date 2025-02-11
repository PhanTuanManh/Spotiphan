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
        subscriptionPlan: { type: mongoose.Schema.Types.ObjectId, ref: "SubscriptionPlan" },

        paymentHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: "Payment" }], // Lịch sử thanh toán

        likedSongs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Song" }], // Danh sách bài hát đã thích

        followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Những người theo dõi
        following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Người dùng đang theo dõi
        isBlocked: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Phương thức ảo: Kiểm tra xem người dùng có Premium hay không
userSchema.virtual("isPremiumActive").get(function () {
    return this.premiumExpiration && this.premiumExpiration > new Date();
});

export const User = mongoose.model("User", userSchema);
