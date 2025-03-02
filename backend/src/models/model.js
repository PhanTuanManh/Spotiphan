// src/models/userListeningHistory.model.js

import mongoose from "mongoose";
const userListeningHistorySchema = new mongoose.Schema(
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      songId: { type: mongoose.Schema.Types.ObjectId, ref: "Song", required: true },
      listenedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
  );
  
export const UserListeningHistory = mongoose.model("UserListeningHistory", userListeningHistorySchema);

// src/models/advertisement.model.js
import mongoose from "mongoose";

const advertisementSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        mediaUrl: { type: String, required: true },
        redirectUrl: { type: String, required: true },
        duration: { type: Number, required: true },
        startDate: { type: Date, required: true }, // Ngày bắt đầu quảng cáo
        endDate: { type: Date, required: true }, // Ngày kết thúc quảng cáo
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);


export const Advertisement = mongoose.model("Advertisement", advertisementSchema);


// src/models/album.model.js
import mongoose from "mongoose";

const albumSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        artist: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        imageUrl: { type: String, required: true },
        releaseYear: { type: Number, required: true },
        songs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Song" }],
        status: { type: String, enum: ["pending", "approved", "rejected", "archived"], default: "pending" },
        category: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
    },
    { timestamps: true }
); //  createdAt, updatedAt

export const Album = mongoose.model("Album", albumSchema);

// src/models/category.model.js
import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true }, // Tên danh mục (Pop, Rock, Podcast,...)
        description: { type: String },
        imageUrl: { type: String }, // Hình ảnh đại diện cho danh mục

        // Danh sách album thuộc category này
        albums: [{ type: mongoose.Schema.Types.ObjectId, ref: "Album" }],

        // Danh sách playlist của admin thuộc category này
        playlists: [{ type: mongoose.Schema.Types.ObjectId, ref: "Playlist" }],

    },
    { timestamps: true }
);

export const Category = mongoose.model("Category", categorySchema);


// src/models/message.model.js

import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        content: { type: String, required: true },
    },
    { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);


// src/models/payment.model.js
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Người dùng thực hiện thanh toán
        planId: { type: mongoose.Schema.Types.ObjectId, ref: "SubscriptionPlan", required: true }, // Gói Premium đã chọn
        amount: { type: Number, required: true }, // Số tiền thanh toán
        currency: { type: String, required: true }, // Đơn vị tiền tệ (VND, USD)
        paymentMethod: { type: String, enum: ["PayPal", "MoMo"], required: true }, // Phương thức thanh toán
        transactionId: { type: String, required: true, unique: true }, // Mã giao dịch (của PayPal/MoMo)
        status: {
            type: String,
            enum: ["pending", "completed", "failed", "canceled"],
            default: "pending",
        }, // Trạng thái thanh toán
        subscriptionStartDate: { type: Date, required: true, default: Date.now }, // Ngày bắt đầu gói Premium
        subscriptionEndDate: { type: Date, required: true }, // Ngày hết hạn gói Premium
        isAutoRenew: { type: Boolean, default: false }, // Tự động gia hạn hay không
    },
    { timestamps: true }
);

export const Payment = mongoose.model("Payment", paymentSchema);


// src/models/playList.model.js
import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        songs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Song" }],
        isPublic: { type: Boolean, default: false },
        followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Người dùng đã lưu playlist vào thư viện
        category: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
    },
    { timestamps: true }
);

export const Playlist = mongoose.model("Playlist", playlistSchema);


// src/models/queue.model.js
import mongoose from "mongoose";

const queueSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        songs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Song" }],
        currentIndex: { type: Number, default: 0 }, // Vị trí bài hát đang phát
        isShuffled: { type: Boolean, default: false }, // Có bật chế độ random không?
        loopMode: { 
            type: String, 
            enum: ["none", "loop_playlist", "loop_song"], 
            default: "none" 
        }, // Loop 1 bài, loop playlist hoặc không loop
    },
    { timestamps: true }
);

export const Queue = mongoose.model("Queue", queueSchema);

// src/models/song.model.js
import mongoose from "mongoose";

const songSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        artist: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        imageUrl: { type: String, required: true },
        audioUrl: { type: String, required: true },
        duration: { type: Number, required: true },
        albumId: { type: mongoose.Schema.Types.ObjectId, ref: "Album", required: false },
        listenCount: { type: Number, default: 0 },
        isFeatured: { type: Boolean, default: false },
        lastListenedAt: Date,
        likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Danh sách người dùng đã thích bài hát
        status: { type: String, enum: ["pending", "approved", "rejected", "archived"], default: "pending" },
        isSingle: { type: Boolean, default: false }
    },
    { timestamps: true }
);

export const Song = mongoose.model("Song", songSchema);


// src/models/subscriptionPlan.model.js
import mongoose from "mongoose";

const subscriptionPlanSchema = new mongoose.Schema(
    {
        name: { type: String, required: true }, // Tên gói: "1 Tháng", "3 Tháng", "1 Năm"
        durationInDays: { type: Number, required: true }, // Thời hạn của gói (30, 90, 365 ngày)
        price: { type: Number, required: true }, 
        currency: { type: String, default: "VND" }, 
        isActive: { type: Boolean, default: true }, 
    },
    { timestamps: true }
);

export const SubscriptionPlan = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);


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
