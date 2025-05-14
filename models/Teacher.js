import db from '../config/db.js';
import path from 'path';
import fs from 'fs';

class Teacher {
    static async findAll(search = '') {
        let query = 'SELECT * FROM tb_guru';
        const params = [];

        if (search) {
            query += ' WHERE nama_guru ILIKE $1 OR nip ILIKE $2 OR keterangan_guru ILIKE $3';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        const result = await db.query(query, params);
        return result.rows; // Langsung return rows
    }
    static async create({ nama_guru, pas_foto, nip, keterangan_guru, author }) {
        try {
            console.log('Data to insert:', {
                nama_guru,
                pas_foto: pas_foto?.length,
                nip,
                keterangan_guru: keterangan_guru?.length,
                author
            });

            const result = await db.query(
                `INSERT INTO tb_guru 
                (nama_guru, pas_foto, nip, keterangan_guru, author) 
                VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [nama_guru, pas_foto, nip, keterangan_guru, author]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error in Teacher.create:', error);
            throw error;
        }
    }

    static async findById(id) {
        try {
            const result = await db.query(
                'SELECT * FROM tb_guru WHERE id = $1',
                [id]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error in Teacher.findById:', error);
            throw error;
        }
    }

    static async update(id, { nama_guru, pas_foto, nip, keterangan_guru }) {
        try {
            const result = await db.query(
                `UPDATE tb_guru SET 
                nama_guru = $1, pas_foto = $2, nip = $3, 
                keterangan_guru = $4
                WHERE id = $5 RETURNING *`,
                [nama_guru, pas_foto, nip, keterangan_guru, id]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error in Teacher.update:', error);
            throw error;
        }
    }

    static async delete(id) {
        try {
            const result = await db.query(
                'DELETE FROM tb_guru WHERE id = $1 RETURNING *',
                [id]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error in Teacher.delete:', error);
            throw error;
        }
    }

    static async getImagePath(id) {
        try {
            const result = await db.query(
                'SELECT pas_foto FROM tb_guru WHERE id = $1',
                [id]
            );
            return result.rows[0]?.pas_foto;
        } catch (error) {
            console.error('Error in Teacher.getImagePath:', error);
            throw error;
        }
    }

    static async deleteImageFile(filePath) {
        try {
            if (filePath) {
                const fullPath = path.join(process.cwd(), filePath);
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Error in Teacher.deleteImageFile:', error);
            throw error;
        }
    }
}

export default Teacher;