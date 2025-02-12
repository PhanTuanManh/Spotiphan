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
