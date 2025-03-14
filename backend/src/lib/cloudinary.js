import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (file, resourceType = "auto") => {
  try {
    // 🔹 Kiểm tra nếu file có `tempFilePath` → dùng nó
    const filePath = file.tempFilePath || file.path || null;

    if (!filePath) {
      throw new Error("Không tìm thấy đường dẫn file để upload.");
    }

    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: resourceType, // "auto" để Cloudinary tự nhận diện loại file
    });

    return result.secure_url;
  } catch (error) {
    console.error("❌ Lỗi khi upload file lên Cloudinary:", error.message);
    throw new Error("Upload file thất bại.");
  }
};
