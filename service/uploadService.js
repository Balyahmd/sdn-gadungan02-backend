import imagekit from "../config/imagekit.js";

export class UploadService {
  static async upload(files, folder, tags) {
    try {
      const uploadedFiles = {
        pas_foto: null,
        gambar_panorama: null,
        thumbnail_postingan: null,
      };
      for (const [fileType, fileArray] of Object.entries(files)) {
        if (fileArray && fileArray.length > 0) {
          const file = fileArray[0];
          const split = file.originalname.split(".");
          const extension = split.length > 1 ? split[split.length - 1] : "jpg";

          const uploadedFile = await imagekit.upload({
            folder,
            tags,
            file: file.buffer,
            fileName: `${fileType}-${Date.now()}.${extension}`,
          });

          uploadedFiles[fileType] = uploadedFile;
        }
      }

      return uploadedFiles;
    } catch (error) {
      const err = new Error(error.message);
      err.statusCode = 500;
      throw err;
    }
  }

  static async delete(fileId) {
    try {
      if (!fileId) {
        const err = new Error("File ID is required");
        err.statusCode = 400;
        throw err;
      }

      // Tambahkan logging untuk debug
      console.log("Attempting to delete file with ID:", fileId);

      const result = await imagekit.deleteFile(fileId);
      console.log("Delete result:", result);

      return result;
    } catch (error) {
      console.error("Error deleting file:", error);

      // Cek apakah error dari ImageKit
      if (error.message && error.message.includes("File not found")) {
        const err = new Error("File ID tidak ditemukan");
        err.statusCode = 404;
        throw err;
      }

      const err = new Error(`Failed to delete image: ${error.message}`);
      err.statusCode = error.statusCode || 500;
      throw err;
    }
  }
}

export default UploadService;
