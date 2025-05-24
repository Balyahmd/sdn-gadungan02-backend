import express from "express";
import TeacherController from "../controllers/teacherController.js";
import { authenticate } from "../middleware/authMiddleware.js";
// import { teacherUpload } from "../middleware/uploadMiddleware.js";
import fileHandlerMiddleware from "../middleware/fileHandler.js";

const router = express.Router();

router.get("/", TeacherController.getAllTeachers);
router.post(
  "/",
  authenticate,
  fileHandlerMiddleware,
  TeacherController.createTeacher
);
router.put(
  "/:id",
  authenticate,
  fileHandlerMiddleware,
  TeacherController.updateTeacher
);
router.delete("/:id", authenticate, TeacherController.deleteTeacher);

export default router;
