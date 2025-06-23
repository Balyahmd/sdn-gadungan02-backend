import Teacher from "../models/Teacher.js";
import UploadService from "../service/uploadService.js";
import fs from "fs";

const TeacherController = {
  getAllTeachers: async (req, res) => {
    try {
      const teachers = await Teacher.findAll(req.query.search);

      const teachersWithUrls = teachers.map((teacher) => ({
        ...teacher,
        id: req.app.locals.hashids.encode(teacher.id),
        pas_foto: teacher.pas_foto,
      }));

      res.json({ success: true, data: teachersWithUrls });
    } catch (error) {
      console.error("Error fetching teachers:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch teachers" });
    }
  },
  createTeacher: async (req, res) => {
    try {
      const file = req.files?.["pas_foto"]?.[0];

      const { nama_guru, nip, keterangan_guru } = req.body;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: "File is required",
        });
      }

      // Upload ke ImageKit
      const uploaded = await UploadService.upload(
        { pas_foto: [file] },
        "teacher-photo",
        ["teacher", "photo"]
      );

      const teacherData = {
        nama_guru,
        nip,
        keterangan_guru,
        pas_foto: uploaded.pas_foto.url,
        file_id: uploaded.pas_foto.fileId,
        author: req.user.id,
      };

      const newTeacher = await Teacher.create(teacherData);

      return res.status(201).json({
        success: true,
        data: {
          ...newTeacher,
          id: req.app.locals.hashids.encode(newTeacher.id),
        },
      });
    } catch (error) {
      console.error("Error creating teacher:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to create teacher",
        error: error.stack,
      });
    }
  },

  updateTeacher: async (req, res) => {
    try {
      const hashedId = req.params.id;
      const id = req.app.locals.hashids.decode(hashedId)[0];

      if (!id) {
        return res.status(404).json({
          success: false,
          message: "Invalid teacher ID",
        });
      }

      // Cari teacher dulu
      const teacher = await Teacher.findById(id);
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: "Teacher not found",
        });
      }

      let pas_foto = teacher.pas_foto; // default ke yang lama
      let file_id = teacher.file_id; // default ke yang lama

      // Jika ada file baru di req.files
      if (req.files && req.files.pas_foto && req.files.pas_foto.length > 0) {
        const file = req.files.pas_foto[0]; // Get the file from req.files
        // Upload file baru ke ImageKit
        const uploadedFiles = await UploadService.upload(
          { pas_foto: [file] },
          "teacher-photo",
          ["teacher", "photo"]
        );
        const newPhoto = uploadedFiles.pas_foto;

        if (newPhoto) {
          try {
            // Hapus foto lama dari ImageKit (kalau ada)
            if (file_id) {
              await UploadService.delete(file_id);
            }
          } catch (error) {
            console.error("Error deleting old photo:", error);
            // Continue with update even if delete fails
          }
          pas_foto = newPhoto.url;
          file_id = newPhoto.fileId;
        }
      } else if (req.body.keepExistingImage === "false") {
        try {
          // Kalau user tidak ingin keep image, berarti hapus foto lama
          if (file_id) {
            await UploadService.delete(file_id);
          }
          pas_foto = null;
          file_id = null;
        } catch (error) {
          console.error("Error deleting old photo:", error);
          // Continue with update even if delete fails
        }
      }

      // Update teacher data
      const updatedTeacher = await Teacher.update(id, {
        nama_guru: req.body.nama_guru,
        nip: req.body.nip,
        keterangan_guru: req.body.keterangan_guru,
        pas_foto,
        file_id,
      });

      res.json({
        success: true,
        data: {
          ...updatedTeacher,
          id: req.app.locals.hashids.encode(updatedTeacher.id),
          pas_foto,
        },
      });
    } catch (error) {
      if (req.files) {
        for (const fileArray of Object.values(req.files)) {
          fileArray.forEach((file) => {
            if (file.path && fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          });
        }
      }
      console.error("Error updating teacher:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to update teacher",
      });
    }
  },

  deleteTeacher: async (req, res) => {
    try {
      const hashedId = req.params.id;
      const id = req.app.locals.hashids.decode(hashedId)[0];

      if (!id) {
        return res.status(404).json({
          success: false,
          message: "Invalid teacher ID",
        });
      }

      // Get teacher data first to get the fileId
      const teacher = await Teacher.findById(id);

      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: "Teacher not found",
        });
      }

      // Delete photo from ImageKit if exists
      if (teacher.file_id) {
        try {
          await UploadService.delete(teacher.file_id);
        } catch (err) {
          console.error("Error deleting photo from ImageKit:", err);
        }
      }

      await Teacher.delete(id);

      res.json({
        success: true,
        message: "Teacher deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting teacher:", error);
      res.status(error.message === "Teacher not found" ? 404 : 500).json({
        success: false,
        message: error.message || "Failed to delete teacher",
      });
    }
  },
};

export default TeacherController;
