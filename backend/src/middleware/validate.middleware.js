import { param, query, validationResult } from "express-validator";

// Kiểm tra query phân trang
export const validatePagination = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1 }).withMessage("Limit must be a positive integer"),
];

// Kiểm tra songId hợp lệ
export const validateSongId = [
  param("songId").isMongoId().withMessage("Invalid song ID"),
];

// Middleware kiểm tra lỗi sau khi validate
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};
