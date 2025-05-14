import Teacher from '../models/Teacher.js';
import fs from 'fs';

const TeacherController = {
    getAllTeachers: async (req, res) => {
        try {
            // Call the static method to fetch teachers
            const teachers = await Teacher.findAll(req.query.search);

            const teachersWithUrls = teachers.map(teacher => ({
                ...teacher,
                pas_foto: teacher.pas_foto
                    ? `${req.protocol}://${req.get('host')}${teacher.pas_foto}`
                    : null
            }));

            res.json({
                success: true,
                data: teachersWithUrls
            });
        } catch (error) {
            console.error('Error fetching teachers:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch teachers',
                error: error.message
            });
        }
    },

    createTeacher: async (req, res) => {
        try {
            const { nama_guru, nip, keterangan_guru } = req.body;
            const author = req.user.id;

            if (!nama_guru || !nip) {
                return res.status(400).json({
                    success: false,
                    message: 'Nama dan NIP wajib diisi'
                });
            }

            const pas_foto = req.file
                ? `/static/uploads/teachers/${req.file.filename}`
                : null;

            const newTeacher = await Teacher.create({
                nama_guru,
                pas_foto,
                nip,
                keterangan_guru,
                author
            });

            res.status(201).json({
                success: true,
                data: newTeacher
            });
        } catch (error) {
            if (req.file) fs.unlinkSync(req.file.path);
            console.error('Error creating teacher:', error);
            res.status(500).json({ success: false, message: 'Failed to create teacher' });
        }
    },

    updateTeacher: async (req, res) => {
        try {
            const { id } = req.params;
            const { nama_guru, nip, keterangan_guru } = req.body;

            const teacher = await Teacher.findById(id);
            if (!teacher) {
                return res.status(404).json({
                    success: false,
                    message: 'Guru tidak ditemukan'
                });
            }

            const pas_foto = req.file
                ? `/static/uploads/teachers/${req.file.filename}`
                : teacher.pas_foto;

            if (req.file && teacher.pas_foto) {
                await Teacher.deleteImageFile(teacher.pas_foto);
            }

            await Teacher.update(id, {
                nama_guru,
                pas_foto,
                nip,
                keterangan_guru,
            });

            res.json({
                success: true,
                data: { id, nama_guru, pas_foto, nip, keterangan_guru }
            });
        } catch (error) {
            if (req.file) fs.unlinkSync(req.file.path);
            console.error('Error updating teacher:', error);
            res.status(500).json({ success: false, message: 'Failed to update teacher' });
        }
    },

    deleteTeacher: async (req, res) => {
        try {
            const { id } = req.params;
            const imagePath = await Teacher.getImagePath(id);

            const result = await Teacher.delete(id);
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Guru tidak ditemukan'
                });
            }

            if (imagePath) await Teacher.deleteImageFile(imagePath);

            res.json({ success: true, message: 'Guru berhasil dihapus' });
        } catch (error) {
            console.error('Error deleting teacher:', error);
            res.status(500).json({ success: false, message: 'Failed to delete teacher' });
        }
    }
};

export default TeacherController;