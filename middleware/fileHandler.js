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
      const err = new Error("Invalid file type");
      err.statusCode = 400;
      return cb(err, false);
    }
    cb(null, true);
  },
});

const fileHandlerMiddleware = multerConfig.fields([
  { name: "pas_foto", maxCount: 1 },
  { name: "gambar_panorama", maxCount: 1 },
  { name: "thumbnail_postingan", maxCount: 1 },

  // Hanya mengizinkan satu file dengan field name 'image'
]);

export default fileHandlerMiddleware;
