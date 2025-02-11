// src/models/category.model.js
import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true }, // Tên danh mục (Pop, K-pop, Podcast,...)
        description: { type: String },
        imageUrl: { type: String }, // Hình ảnh đại diện cho danh mục
    },
    { timestamps: true }
);

export const Category = mongoose.model("Category", categorySchema);
