// src/models/message.model.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: String, required: true }, // ✅ Lưu `clerkId` thay vì `_id`
    receiverId: { type: String, required: true }, // ✅ Không lưu `_id` của MongoDB
    content: { type: String, required: true },
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);
