import multer from "multer";

export class ErrorHandler extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;

    Error.captureStackTrace(this, this.constructor);
  }
}

const allowedImageTypes = ["image/jpg", "image/jpeg", "image/png"];
const maxFileSize = 2 * 1024 * 1024;

const multerConfig = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxFileSize },
  fileFilter: (req, file, cb) => {
    if (!allowedImageTypes.includes(file.mimetype)) {
      const err = new ErrorHandler(400, "Invalid file type");
      return cb(err, false);
    }
    cb(null, true);
  },
});

// Handle multer errors
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size is ${
          maxFileSize / (1024 * 1024)
        }MB`,
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: "Unexpected field in form data",
      });
    }
  }
  next(err);
};

const fileHandlerMiddleware = [
  multerConfig.fields([
    { name: "pas_foto", maxCount: 1 },
    { name: "gambar_panorama", maxCount: 1 },
    { name: "thumbnail_postingan", maxCount: 1 },
  ]),
  handleMulterError,
];

export default fileHandlerMiddleware;
