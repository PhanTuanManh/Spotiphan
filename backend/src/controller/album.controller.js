// controllers/album.controller.js

import { uploadToCloudinary } from "../lib/cloudinary.js";
import { Album } from "../models/album.model.js";
import { Category } from "../models/category.model.js";
import { Song } from "../models/song.model.js";
import mongoose from "mongoose";

export const getAllAlbums = async (req, res, next) => {
  try {
    let { page = 1, limit = 10 } = req.query;

    // Convert types
    page = parseInt(page);
    limit = parseInt(limit);

    // Calculate the number of albums to skip
    const skip = (page - 1) * limit;

    // Retrieve album list, sorted by status with pending first
    const albums = await Album.find()
      .populate("artist")
      .sort({
        status: 1, // "pending" first, then "approved", and finally "rejected"
        createdAt: -1, // Newest albums first
      })
      .skip(skip)
      .limit(limit);

    // Count the total number of albums
    const totalAlbums = await Album.countDocuments();
    const totalPages = Math.ceil(totalAlbums / limit);

    res.status(200).json({
      page,
      totalPages,
      totalAlbums,
      limit,
      albums,
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving albums" });
  }
};

export const getApprovedAlbums = async (req, res, next) => {
  try {
    let { page = 1, limit = 10 } = req.query;

    // Convert types
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    // Lọc các album có status là "approved"
    const albums = await Album.find({ status: "approved" })
      .populate("artist")
      .sort({ createdAt: -1 }) // Sắp xếp theo thời gian tạo mới nhất
      .skip(skip)
      .limit(limit);

    // Đếm số album đã được approved
    const totalAlbums = await Album.countDocuments({ status: "approved" });
    const totalPages = Math.ceil(totalAlbums / limit);

    res.status(200).json({
      page,
      totalPages,
      totalAlbums,
      limit,
      albums,
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving approved albums" });
  }
};

export const getAlbumById = async (req, res, next) => {
  try {
    const { albumId } = req.params;

    const album = await Album.findOne({
      _id: albumId,
      status: "approved",
    }).populate("songs");

    if (!album) {
      return res
        .status(404)
        .json({ message: "Album not found or not approved" });
    }

    res.status(200).json(album);
  } catch (error) {
    next(error);
  }
};

// Todo: Album API
export const getMyAlbums = async (req, res, next) => {
  try {
    // Lấy `userId` từ `req.userId` (đã được lưu trong middleware `requireArtist`)
    const userId = req.userId;

    // Tìm album của người dùng theo `userId`
    const albums = await Album.find({ artist: userId })
      .populate("artist", "fullName")
      .populate("songs")
      .populate("category");

    if (!albums || albums.length === 0) {
      return res.status(404).json({ message: "No albums found" });
    }

    res.status(200).json({
      message: "Danh sách album của bạn",
      albums,
    });
  } catch (error) {
    next(error);
  }
};

export const createAlbum = async (req, res, next) => {
  try {
    const { title, releaseYear, category } = req.body;
    const { imageFile } = req.files;
    const artistId = req.user?._id.toString();

    // Kiểm tra album có trùng tên không
    const existingAlbum = await Album.findOne({ title, artist: artistId });
    if (existingAlbum) {
      return res
        .status(400)
        .json({ message: "Album with this title already exists" });
    }

    // ✅ Chuyển `category` từ string JSON về mảng ObjectId
    const categoryArray =
      typeof category === "string" ? JSON.parse(category) : category;

    // Kiểm tra category hợp lệ
    if (!Array.isArray(categoryArray) || categoryArray.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one category is required" });
    }

    // ✅ Kiểm tra ObjectId hợp lệ trước khi truy vấn
    if (!categoryArray.every((id) => mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ message: "Invalid category ID format" });
    }

    const validCategories = await Category.find({
      _id: { $in: categoryArray },
    });
    if (validCategories.length !== categoryArray.length) {
      return res.status(400).json({ message: "Invalid category" });
    }

    // Upload ảnh bìa lên Cloudinary
    if (!imageFile) {
      return res.status(400).json({ message: "Album cover image is required" });
    }
    const imageUrl = await uploadToCloudinary(imageFile);

    // Tạo album mới
    const album = new Album({
      title,
      artist: artistId,
      imageUrl,
      releaseYear,
      category: categoryArray, // ✅ Lưu category dưới dạng mảng ObjectId
      status: "pending",
    });

    await album.save();

    // Cập nhật category chứa album này
    await Category.updateMany(
      { _id: { $in: categoryArray } },
      { $push: { albums: album._id } }
    );

    res.status(201).json({
      message: "Album created successfully and is pending approval",
      album,
    });
  } catch (error) {
    console.error("❌ Error in createAlbum:", error);
    next(error);
  }
};

export const updateAlbum = async (req, res, next) => {
  try {
    const { albumId } = req.params;
    let { title, releaseYear, category } = req.body;
    const artistId = req.user?._id.toString();

    // Kiểm tra `albumId` hợp lệ
    if (!mongoose.Types.ObjectId.isValid(albumId)) {
      return res.status(400).json({ message: "Invalid album ID format" });
    }

    // Xử lý category: đảm bảo là một mảng hợp lệ
    if (typeof category === "string") {
      try {
        category = JSON.parse(category);
      } catch (e) {
        return res.status(400).json({ message: "Invalid category format" });
      }
    }

    if (!Array.isArray(category)) {
      return res.status(400).json({ message: "Category must be an array" });
    }

    // Kiểm tra album có tồn tại không
    const album = await Album.findById(albumId);
    if (!album) {
      return res.status(404).json({ message: "Album not found" });
    }

    // Chỉ cho phép artist cập nhật album của họ
    if (album.artist.toString() !== artistId) {
      return res.status(403).json({
        message: "You do not have permission to update this album",
      });
    }

    // Nếu thay đổi title, kiểm tra trùng lặp
    if (title && title !== album.title) {
      const existingAlbum = await Album.findOne({ title, artist: artistId });
      if (existingAlbum) {
        return res
          .status(400)
          .json({ message: "An album with this title already exists" });
      }
    }

    // Nếu có category, kiểm tra hợp lệ
    if (category.length > 0) {
      const validCategories = await Category.find({ _id: { $in: category } });

      if (validCategories.length !== category.length) {
        return res.status(400).json({ message: "Some categories are invalid" });
      }

      album.category = validCategories.map((c) => c._id);

      // Cập nhật danh mục mới, xóa album khỏi danh mục cũ nếu có
      await Category.updateMany(
        { _id: { $nin: category } },
        { $pull: { albums: album._id } }
      );
      await Category.updateMany(
        { _id: { $in: category } },
        { $addToSet: { albums: album._id } } // Sử dụng `$addToSet` để tránh trùng lặp
      );
    }

    // ✅ Nếu có ảnh mới, upload lên Cloudinary
    if (req.files && req.files.imageFile) {
      const imageFile = req.files.imageFile;
      const imageUrl = await uploadToCloudinary(imageFile, "image");
      album.imageUrl = imageUrl; // Cập nhật ảnh mới
    }

    // Cập nhật thông tin album
    album.title = title || album.title;
    album.releaseYear = releaseYear || album.releaseYear;

    await album.save();

    res.status(200).json({ message: "Album updated successfully", album });
  } catch (error) {
    console.error("❌ Error updating album:", error);
    next(error);
  }
};

export const deleteAlbum = async (req, res, next) => {
  try {
    const { albumId } = req.params;
    const artistId = req.user?._id.toString();

    // Kiểm tra `albumId` hợp lệ
    if (!mongoose.Types.ObjectId.isValid(albumId)) {
      return res.status(400).json({ message: "Invalid album ID format" });
    }

    const album = await Album.findById(albumId);
    if (!album) return res.status(404).json({ message: "Album not found" });

    // Chỉ cho phép artist xóa album của họ
    if (album.artist.toString() !== artistId && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "You do not have permission to archive this album" });
    }

    // Xóa album khỏi danh mục
    await Category.updateMany(
      { albums: albumId },
      { $pull: { albums: albumId } }
    );

    // Xóa bài hát khỏi album trước khi xóa album
    await Song.updateMany({ albumId: album._id }, { albumId: null });

    await album.deleteOne();
    res.status(200).json({ message: "Album deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// how to write api get or post
export const archiveAlbum = async (req, res, next) => {
  try {
    const { albumId } = req.params;
    const artistId = req.user?._id.toString();
    if (!mongoose.Types.ObjectId.isValid(albumId)) {
      return res.status(400).json({ message: "Invalid album ID format" });
    }

    const album = await Album.findById(albumId);
    if (!album) {
      return res.status(404).json({ message: "Album not found" });
    }
    console.log("✅ album.artist:", album.artist.toString());
    console.log("✅ artistId from req.userId:", req);

    if (album.artist.toString() !== artistId && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "You do not have permission to archive this album" });
    }

    album.status = "archived";
    await album.save();

    await Song.updateMany({ albumId: album._id }, { status: "archived" });

    res
      .status(200)
      .json({ message: "Album and all its songs archived successfully" });
  } catch (error) {
    console.error("❌ Error in archiveAlbum:", error);
    next(error);
  }
};

export const unarchiveAlbum = async (req, res, next) => {
  try {
    const { albumId } = req.params;
    const artistId = req.user?._id.toString();

    if (!mongoose.Types.ObjectId.isValid(albumId)) {
      return res.status(400).json({ message: "Invalid album ID format" });
    }

    const album = await Album.findById(albumId);
    if (!album) return res.status(404).json({ message: "Album not found" });

    if (album.artist.toString() !== artistId && req.user.role !== "admin") {
      return res.status(403).json({
        message: "You do not have permission to unarchive this album",
      });
    }

    album.status = "pending";
    await album.save();

    // Cập nhật bài hát từ "archived" trở lại "pending"
    await Song.updateMany(
      { albumId: album._id, status: "archived" },
      { status: "pending" }
    );

    res
      .status(200)
      .json({ message: "Album and all its songs unarchived successfully" });
  } catch (error) {
    next(error);
  }
};

export const removeSongFromAlbum = async (req, res, next) => {
  try {
    const { albumId, songId } = req.params;
    const artistId = req.userId;

    // Kiểm tra `albumId` & `songId` hợp lệ
    if (
      !mongoose.Types.ObjectId.isValid(albumId) ||
      !mongoose.Types.ObjectId.isValid(songId)
    ) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const album = await Album.findById(albumId);
    if (!album) return res.status(404).json({ message: "Album not found" });

    // Chỉ cho phép artist xóa bài hát khỏi album của họ
    if (album.artist.toString() !== artistId) {
      return res
        .status(403)
        .json({ message: "Only the artist can remove songs from this album" });
    }

    // Kiểm tra xem bài hát có tồn tại trong album không
    if (!album.songs.includes(songId)) {
      return res.status(400).json({ message: "This song is not in the album" });
    }

    // Xóa bài hát khỏi album
    album.songs = album.songs.filter((id) => id.toString() !== songId);
    await album.save();

    // Cập nhật albumId của bài hát thành `null`
    await Song.findByIdAndUpdate(songId, { albumId: null });

    res
      .status(200)
      .json({ message: "Song removed from album successfully", album });
  } catch (error) {
    next(error);
  }
};
