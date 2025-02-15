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
