import { Advertisement } from "../models/advertisement.model.js";
import { uploadToCloudinary } from "../lib/cloudinary.js";

// 🔹 Lấy danh sách quảng cáo đang hoạt động
export const getActiveAdvertisements = async (req, res, next) => {
  try {
    const now = new Date();

    const ads = await Advertisement.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).sort({ createdAt: -1 });

    res.status(200).json({ ads });
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách quảng cáo:", error);
    next(error);
  }
};

// 🔹 Lấy tất cả quảng cáo (hỗ trợ phân trang)
export const getAllAdvertisements = async (req, res, next) => {
  try {
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;
    const ads = await Advertisement.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalAds = await Advertisement.countDocuments();
    const totalPages = Math.ceil(totalAds / limit);

    res.status(200).json({
      page,
      totalPages,
      totalAds,
      limit,
      ads,
    });
  } catch (error) {
    next(error);
  }
};

// 🔹 Tạo quảng cáo mới
export const createAdvertisement = async (req, res, next) => {
  try {
    const { title, redirectUrl, duration, startDate, endDate } = req.body;

    if (!title || !redirectUrl || !duration || !startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Vui lòng điền đầy đủ thông tin quảng cáo" });
    }

    if (!req.files || !req.files.mediaFile) {
      return res
        .status(400)
        .json({ message: "Vui lòng tải lên ảnh quảng cáo" });
    }

    // Upload ảnh lên Cloudinary
    const imageFile = req.files.mediaFile;
    const imageUrl = await uploadToCloudinary(imageFile);

    // Tạo quảng cáo mới
    const newAd = new Advertisement({
      title,
      mediaUrl: imageUrl, // Lưu link ảnh từ Cloudinary
      redirectUrl,
      duration,
      startDate,
      endDate,
    });

    await newAd.save();
    res.status(201).json(newAd);
  } catch (error) {
    console.error("❌ Lỗi khi tạo quảng cáo:", error);
    next(error);
  }
};

// 🔹 Cập nhật quảng cáo
export const updateAdvertisement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, redirectUrl, duration, startDate, endDate, isActive } =
      req.body;

    // Tìm quảng cáo cũ
    const existingAd = await Advertisement.findById(id);
    if (!existingAd) {
      return res.status(404).json({ message: "Advertisement not found" });
    }

    let imageUrl = existingAd.mediaUrl; // Giữ nguyên ảnh cũ nếu không có ảnh mới
    if (req.files && req.files.mediaFile) {
      imageUrl = await uploadToCloudinary(req.files.mediaFile);
    }

    // Cập nhật quảng cáo
    const updatedAd = await Advertisement.findByIdAndUpdate(
      id,
      {
        title,
        mediaUrl: imageUrl,
        redirectUrl,
        duration,
        startDate,
        endDate,
        isActive,
      },
      { new: true }
    );

    res.status(200).json(updatedAd);
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật quảng cáo:", error);
    next(error);
  }
};

// 🔹 Xóa quảng cáo (chỉ xóa khi đã hết hạn)
export const deleteAdvertisement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ad = await Advertisement.findById(id);

    if (!ad) {
      return res.status(404).json({ message: "Advertisement not found" });
    }

    if (new Date() < new Date(ad.endDate)) {
      return res
        .status(400)
        .json({ message: "Không thể xóa quảng cáo đang hoạt động" });
    }

    await Advertisement.findByIdAndDelete(id);
    res.status(200).json({ message: "Advertisement deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// 🔹 Bật / tắt trạng thái hoạt động của quảng cáo
export const toggleAdvertisementActive = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ad = await Advertisement.findById(id);
    if (!ad) {
      return res.status(404).json({ message: "Advertisement not found" });
    }

    ad.isActive = !ad.isActive;
    await ad.save();

    res.status(200).json({
      message: `Advertisement ${
        ad.isActive ? "activated" : "deactivated"
      } successfully`,
      ad,
    });
  } catch (error) {
    next(error);
  }
};
