// src/models/advertisement.model.js
import mongoose from "mongoose";

const advertisementSchema = new mongoose.Schema(
    {
        title: { type: String, required: true }, // Tiêu đề quảng cáo
        mediaUrl: { type: String, required: true }, // URL ảnh hoặc video quảng cáo
        redirectUrl: { type: String, required: true }, // Link khi người dùng bấm vào quảng cáo
        duration: { type: Number, required: true }, // Thời lượng quảng cáo (giây)
        isActive: { type: Boolean, default: true }, // Trạng thái hoạt động
    },
    { timestamps: true }
);

export const Advertisement = mongoose.model("Advertisement", advertisementSchema);
