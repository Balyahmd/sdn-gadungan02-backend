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

  static async delete(fileID) {
    try {
      if (!fileID) {
        const err = new Error("File ID is required");
        err.statusCode = 400;
        throw err;
      }

      return await imagekit.deleteFile(fileID);
    } catch (error) {
      const err = new Error(error.message);
      err.statusCode = error.statusCode || 500;
      throw err;
    }
  }
}

export default UploadService;
