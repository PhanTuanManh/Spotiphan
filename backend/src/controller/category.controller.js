import { Category } from "../models/category.model";

export const getCategoryDetails = async (req, res, next) => {
    try {
        const { categoryId } = req.params;

        // Kiểm tra xem category có tồn tại không
        const category = await Category.findById(categoryId)
            .populate({
                path: "albums",
                match: { status: "approved" }, // Chỉ lấy album đã được duyệt
                populate: { path: "artist", select: "fullName imageUrl" } // Lấy thông tin nghệ sĩ
            })
            .populate({
                path: "playlists",
                populate: { path: "userId", select: "fullName imageUrl role" }, // Lấy thông tin người tạo playlist
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
        next(error);
    }
};
