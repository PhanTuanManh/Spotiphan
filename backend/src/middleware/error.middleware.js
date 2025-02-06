export const errorHandler = (err, req, res, next) => {
    console.error("Error:", err.message);
  
    res.status(err.status || 500).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
    });
  };
  