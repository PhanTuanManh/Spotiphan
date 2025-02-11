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
