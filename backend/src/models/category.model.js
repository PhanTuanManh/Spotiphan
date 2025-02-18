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
