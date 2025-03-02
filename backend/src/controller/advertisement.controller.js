import { Advertisement } from "../models/advertisement.model.js";

export const getActiveAdvertisements = async (req, res, next) => {
    try {
        const now = new Date();

        // Chỉ lấy quảng cáo còn hiệu lực
        const ads = await Advertisement.find({
            isActive: true,
            startDate: { $lte: now },  // Quảng cáo đã bắt đầu chạy
            endDate: { $gte: now },    // Quảng cáo chưa kết thúc
        }).sort({ createdAt: -1 });

        res.status(200).json({ ads });
    } catch (error) {
        console.error("❌ Lỗi khi lấy danh sách quảng cáo:", error);
        next(error);
    }
};
