// controllers/album.controller.js

import { Album } from "../models/album.model.js";
import { Category } from "../models/category.model.js";
import {Song} from "../models/song.model.js";
import mongoose from "mongoose";

const uploadToCloudinary = async (file) => {
	try {
		const result = await cloudinary.uploader.upload(file.tempFilePath, {
			resource_type: "auto",
		});
		return result.secure_url;
	} catch (error) {
		throw new Error("Error uploading to cloudinary");
	}
};

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
                status: 1,  // "pending" first, then "approved", and finally "rejected"
                createdAt: -1 // Newest albums first
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

		const album = await Album.findOne({ _id: albumId, status: "approved" }).populate("songs");

		if (!album) {
			return res.status(404).json({ message: "Album not found or not approved" });
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
        const artistId = req.userId;

        // Kiểm tra album có trùng tên không
        const existingAlbum = await Album.findOne({ title, artist: artistId });
        if (existingAlbum) {
            return res.status(400).json({ message: "Album with this title already exists" });
        }

        // Kiểm tra category hợp lệ
        if (!category || category.length === 0) {
            return res.status(400).json({ message: "At least one category is required" });
        }
        const validCategories = await Category.find({ _id: { $in: category } });
        if (validCategories.length !== category.length) {
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
            category,
            status: "pending",
        });

        await album.save();

        // Cập nhật category chứa album này
        await Category.updateMany({ _id: { $in: category } }, { $push: { albums: album._id } });

        res.status(201).json({ message: "Album created successfully and is pending approval", album });
    } catch (error) {
        console.error("Error in createAlbum", error);
        next(error);
    }
};


export const updateAlbum = async (req, res, next) => {
    try {
        const { albumId } = req.params;
        const { title, releaseYear, category } = req.body;
        const artistId = req.userId;

        // Kiểm tra `albumId` hợp lệ
        if (!mongoose.Types.ObjectId.isValid(albumId)) {
            return res.status(400).json({ message: "Invalid album ID format" });
        }

        // Kiểm tra album có tồn tại không
        const album = await Album.findById(albumId);
        if (!album) {
            return res.status(404).json({ message: "Album not found" });
        }

        // Chỉ cho phép artist cập nhật album của họ
        if (album.artist.toString() !== artistId) {
            return res.status(403).json({ message: "You do not have permission to update this album" });
        }

        // Nếu thay đổi title, kiểm tra trùng lặp
        if (title && title !== album.title) {
            const existingAlbum = await Album.findOne({ title, artist: artistId });
            if (existingAlbum) {
                return res.status(400).json({ message: "An album with this title already exists" });
            }
        }

        // Nếu có category, kiểm tra hợp lệ
        let validCategories = [];
        if (category) {
            validCategories = await Category.find({ _id: { $in: category } });
            if (validCategories.length !== category.length) {
                return res.status(400).json({ message: "Some categories are invalid" });
            }
        }

        // Cập nhật thông tin album
        album.title = title || album.title;
        album.releaseYear = releaseYear || album.releaseYear;
        album.category = validCategories.map(c => c._id) || album.category;

        await album.save();

        // Cập nhật danh mục
        if (category) {
            await Category.updateMany({ _id: { $nin: category } }, { $pull: { albums: album._id } });
            await Category.updateMany({ _id: { $in: category } }, { $push: { albums: album._id } });
        }
        
        res.status(200).json({ message: "Album updated successfully", album });
    } catch (error) {
        next(error);
    }
};

export const deleteAlbum = async (req, res, next) => {
    try {
        const { albumId } = req.params;
        const artistId = req.userId;

        // Kiểm tra `albumId` hợp lệ
        if (!mongoose.Types.ObjectId.isValid(albumId)) {
            return res.status(400).json({ message: "Invalid album ID format" });
        }

        const album = await Album.findById(albumId);
        if (!album) return res.status(404).json({ message: "Album not found" });

        // Chỉ cho phép artist xóa album của họ
        if (album.artist.toString() !== artistId && req.user.role !== "admin") {
            return res.status(403).json({ message: "You do not have permission to archive this album" });
        }
        // Xóa album khỏi danh mục
        await Category.updateMany({ albums: albumId }, { $pull: { albums: albumId } });

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
        const artistId = req.userId;

        if (!mongoose.Types.ObjectId.isValid(albumId)) {
            return res.status(400).json({ message: "Invalid album ID format" });
        }

        const album = await Album.findById(albumId);
        if (!album) {
            return res.status(404).json({ message: "Album not found" });
        }

        if (album.artist.toString() !== artistId && req.user.role !== "admin") {
            return res.status(403).json({ message: "You do not have permission to archive this album" });
        }

        album.status = "archived";
        await album.save();

        await Song.updateMany({ albumId: album._id }, { status: "archived" });

        res.status(200).json({ message: "Album and all its songs archived successfully" });
    } catch (error) {
        console.error("❌ Error in archiveAlbum:", error);
        next(error);
    }
};


export const unarchiveAlbum = async (req, res, next) => {
    try {
        const { albumId } = req.params;
        const artistId = req.userId;

        if (!mongoose.Types.ObjectId.isValid(albumId)) {
            return res.status(400).json({ message: "Invalid album ID format" });
        }

        const album = await Album.findById(albumId);
        if (!album) return res.status(404).json({ message: "Album not found" });

        if (album.artist.toString() !== artistId && req.user.role !== "admin") {
            return res.status(403).json({ message: "You do not have permission to unarchive this album" });
        }

        album.status = "pending";
        await album.save();

        // Cập nhật bài hát từ "archived" trở lại "pending"
        await Song.updateMany({ albumId: album._id, status: "archived" }, { status: "pending" });

        res.status(200).json({ message: "Album and all its songs unarchived successfully" });
    } catch (error) {
        next(error);
    }
};




export const removeSongFromAlbum = async (req, res, next) => {
    try {
        const { albumId, songId } = req.params;
        const artistId = req.userId;

        // Kiểm tra `albumId` & `songId` hợp lệ
        if (!mongoose.Types.ObjectId.isValid(albumId) || !mongoose.Types.ObjectId.isValid(songId)) {
            return res.status(400).json({ message: "Invalid ID format" });
        }

        const album = await Album.findById(albumId);
        if (!album) return res.status(404).json({ message: "Album not found" });

        // Chỉ cho phép artist xóa bài hát khỏi album của họ
        if (album.artist.toString() !== artistId) {
            return res.status(403).json({ message: "Only the artist can remove songs from this album" });
        }

        // Kiểm tra xem bài hát có tồn tại trong album không
        if (!album.songs.includes(songId)) {
            return res.status(400).json({ message: "This song is not in the album" });
        }

        // Xóa bài hát khỏi album
        album.songs = album.songs.filter(id => id.toString() !== songId);
        await album.save();

        // Cập nhật albumId của bài hát thành `null`
        await Song.findByIdAndUpdate(songId, { albumId: null });

        res.status(200).json({ message: "Song removed from album successfully", album });
    } catch (error) {
        next(error);
    }
};

