// src/models/subscriptionPlan.model.js
import mongoose from "mongoose";

const subscriptionPlanSchema = new mongoose.Schema(
    {
        name: { type: String, required: true }, // Tên gói: "1 Tháng", "3 Tháng", "1 Năm"
        durationInDays: { type: Number, required: true }, // Thời hạn của gói (30, 90, 365 ngày)
        price: { type: Number, required: true }, // Giá tiền gói Premium
        currency: { type: String, default: "VND" }, // Đơn vị tiền tệ (VNĐ cho MoMo, USD cho PayPal)
        isActive: { type: Boolean, default: true }, // Gói có đang được kích hoạt không
    },
    { timestamps: true }
);

export const SubscriptionPlan = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
