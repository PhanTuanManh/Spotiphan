import { Category } from "../models/category.model.js";
import { uploadToCloudinary } from "../lib/cloudinary.js"; // ✅ Import hàm đúng
import { Album } from "../models/album.model.js";
import { Playlist } from "../models/playList.model.js";



export const createCategory = async (req, res, next) => {
  try {
    if (!req.files || !req.files.imageFile) {
      return res.status(400).json({ message: "Please upload all files" });
    }

    const { name, description } = req.body;

    // Kiểm tra xem danh mục đã tồn tại chưa
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const imageFile = req.files.imageFile;

    // ✅ Gọi hàm upload đã được định nghĩa trong lib/cloudinary.js
    const imageUrl = await uploadToCloudinary(imageFile);

    const newCategory = new Category({
      name,
      description,
      imageUrl,
    });

    await newCategory.save();

    res.status(201).json({ message: "Category created successfully", category: newCategory });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};


// READ: Lấy danh sách tất cả các danh mục
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find()
      .select("name description imageUrl") // Retrieve necessary fields
      .populate({
        path: "albums",
        select: "title artist",
        populate: { path: "artist", select: "fullName" }
      })
      .populate({
        path: "playlists",
        select: "name userId",
        populate: { path: "userId", select: "fullName" }
      });

    res.status(200).json({ categories });
  } catch (error) {
    console.error("Error getting categories:", error);
    next(error); // Gọi middleware xử lý lỗi
  }
};




// populate
export const getCategoryById = async (req, res, next) => {
  try {
    const { categoryId } = req.params;

    const category = await Category.findById(categoryId)
      .select("name description imageUrl") // Lấy đúng trường cần thiết
      .populate({
        path: "albums",
        match: { status: "approved" },
        select: "title artist status",
        populate: { path: "artist", select: "fullName imageUrl" }
      })
      .populate({
        path: "playlists",
        select: "name userId",
        populate: { path: "userId", select: "fullName imageUrl role" }
      });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json(category); // ✅ TRẢ VỀ ĐÚNG FORMAT
  } catch (error) {
    console.error("Error getting category by id:", error);
    next(error);
  }
};


// UPDATE: Cập nhật thông tin một danh mục
export const updateCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { name, description } = req.body;

    // Tìm danh mục
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Kiểm tra nếu name mới bị trùng với danh mục khác
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ name });
      if (existingCategory) {
        return res.status(400).json({ message: "Category name already exists" });
      }
    }

    let newImageUrl = category.imageUrl; // Giữ nguyên ảnh nếu không có ảnh mới

    // Xử lý upload ảnh mới nếu có file
    if (req.files && req.files.imageFile) {
      newImageUrl = await uploadToCloudinary(req.files.imageFile);
    }

    // Cập nhật thông tin danh mục
    category.name = name || category.name;
    category.description = description || category.description;
    category.imageUrl = newImageUrl;

    await category.save();

    res.status(200).json({ message: "Category updated successfully", category });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};


// DELETE: Xóa một danh mục
export const deleteCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;

    // Tìm danh mục
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }



    // Xóa tất cả album trong danh mục
    await Album.updateMany(
      { categories: categoryId },
      { $pull: { categories: categoryId } }
    );

    // Xóa tất cả playlist trong danh mục
    await Playlist.updateMany(
      { categories: categoryId },
      { $pull: { categories: categoryId } }
    );

        // Xóa danh mục
        await category.deleteOne({ _id: categoryId });
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    next(error); // Gọi middleware xử lý lỗi
  }
};
