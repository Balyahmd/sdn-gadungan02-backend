import express from 'express';
import TeacherController from '../controllers/teacherController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { teacherUpload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/', TeacherController.getAllTeachers);
router.post('/', authenticate, teacherUpload.single('pas_foto'), TeacherController.createTeacher);
router.put('/:id', authenticate, teacherUpload.single('pas_foto'), TeacherController.updateTeacher);
router.delete('/:id', authenticate, TeacherController.deleteTeacher);

export default router;