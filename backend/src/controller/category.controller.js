import { Category } from "../models/category.model.js";

// CREATE: Tạo mới một danh mục
export const createCategory = async (req, res, next) => {
  try {
    const { name, description, imageUrl } = req.body;

    // Kiểm tra xem danh mục đã tồn tại chưa
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ message: "Category already exists" });
    }

    // Tạo mới danh mục
    const newCategory = new Category({
      name,
      description,
      imageUrl,
    });

    await newCategory.save();
    res.status(201).json({ message: "Category created successfully", category: newCategory });
  } catch (error) {
    console.error("Error creating category:", error);
    next(error); // Gọi middleware xử lý lỗi
  }
};

// READ: Lấy danh sách tất cả các danh mục
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find()
      .select("name description imageUrl")  // Lấy các trường cần thiết
      .populate("albums", "title")  // Lấy album và chỉ chọn tên album
      .populate("playlists", "name userId");

    res.status(200).json({ categories });
  } catch (error) {
    console.error("Error getting categories:", error);
    next(error); // Gọi middleware xử lý lỗi
  }
};

// READ: Lấy thông tin chi tiết của một danh mục
export const getCategoryById = async (req, res, next) => {
  try {
    const { categoryId } = req.params;

    const category = await Category.findById(categoryId)
      .populate({
        path: "albums",
        match: { status: "approved" },  // Chỉ lấy album đã được duyệt
        select: "title artist status", // Chọn trường cần thiết
        populate: { path: "artist", select: "fullName imageUrl" } // Lấy thông tin nghệ sĩ
      })
      .populate({
        path: "playlists",
        select: "name userId",
        populate: { path: "userId", select: "fullName imageUrl role" }
      });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({
      category: category.name,
      albums: category.albums,
      playlists: category.playlists
    });
  } catch (error) {
    console.error("Error getting category by id:", error);
    next(error); // Gọi middleware xử lý lỗi
  }
};

// UPDATE: Cập nhật thông tin một danh mục
export const updateCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { name, description, imageUrl } = req.body;

    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Cập nhật thông tin danh mục
    category.name = name || category.name;
    category.description = description || category.description;
    category.imageUrl = imageUrl || category.imageUrl;

    await category.save();
    res.status(200).json({ message: "Category updated successfully", category });
  } catch (error) {
    console.error("Error updating category:", error);
    next(error); // Gọi middleware xử lý lỗi
  }
};

// DELETE: Xóa một danh mục
export const deleteCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    await category.remove();
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    next(error); // Gọi middleware xử lý lỗi
  }
};
