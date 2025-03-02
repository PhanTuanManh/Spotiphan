import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (file, resourceType = "image") => {
    try {
        const result = await cloudinary.uploader.upload(file.tempFilePath, {
            resource_type: resourceType, // "image" cho ảnh, "video" cho audio
        });

        return result.secure_url; // Trả về URL file sau khi upload
    } catch (error) {
        console.error("❌ Lỗi khi upload file lên Cloudinary:", error);
        throw new Error("Upload file thất bại.");
    }
};
