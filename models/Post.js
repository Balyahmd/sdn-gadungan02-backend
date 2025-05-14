import db from '../config/db.js';
import fs from 'fs';
import path from 'path';

class Post {
    static async findAll(search = '') {
        let query = 'SELECT * FROM tb_postingan';
        const params = [];

        if (search) {
            query += ' WHERE title_postingan ILIKE $1 OR deskripsi_postingan ILIKE $2 OR kategori ILIKE $3';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        const result = await db.query(query, params);
        return result.rows; // Langsung return rows
    }

    static async findById(id) {
        const result = await db.query('SELECT * FROM tb_postingan WHERE id = $1', [id]);
        return result.rows[0]; // Ambil baris pertama
    }

    static async create(postData) {
        const { title_postingan, thumbnail_postingan, deskripsi_postingan, text_postingan, kategori, keyword, author } = postData;

        const query = `
            INSERT INTO tb_postingan 
            (title_postingan, thumbnail_postingan, deskripsi_postingan, text_postingan, kategori, keyword, author)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;

        try {
            // Modified this part to handle query response properly
            const result = await db.query(query, [
                title_postingan,
                thumbnail_postingan,
                deskripsi_postingan,
                text_postingan,
                kategori,
                keyword,
                author
            ]);

            // Check if result has rows and return the first one
            if (result.rows && result.rows.length > 0) {
                return result.rows[0];
            }
            throw new Error('No data returned from query');
        } catch (error) {
            console.error('Error in Post.create:', error);
            throw error;
        }
    }

    static async update(id, data) {
        const fields = [];
        const values = [];
        let paramIndex = 1;

        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined) {
                fields.push(`${key} = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            }
        }

        values.push(id);
        const query = `
            UPDATE tb_postingan 
            SET ${fields.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `;

        const result = await db.query(query, values);
        return result.rows[0];
    }

    static async delete(id) {
        await db.query('DELETE FROM tb_postingan WHERE id = $1', [id]);
    }

    static async isOwner(id, userId) {
        const result = await db.query('SELECT author FROM tb_postingan WHERE id = $1', [id]);
        return result.rows[0]?.author === userId;
    }

    static async deleteImageFile(filePath) {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`Deleted image file: ${filePath}`);
                return true;
            }
            return false;
        } catch (err) {
            console.error(`Error deleting image file ${filePath}:`, err);
            return false;
        }
    }

    static async deletePostAndImage(id) {
        const post = await this.findById(id);
        if (!post) throw new Error('Post not found');

        await db.query('DELETE FROM tb_postingan WHERE id = $1', [id]);

        if (post.thumbnail_postingan) {
            const imagePath = path.join(process.cwd(), post.thumbnail_postingan);
            await this.deleteImageFile(imagePath);
        }
    }

    static async updateWithImageCleanup(id, newData, oldImagePath) {
        const updatedPost = await this.update(id, newData);

        // Delete old image if it's being replaced or removed
        if (newData.thumbnail_postingan && oldImagePath && newData.thumbnail_postingan !== oldImagePath) {
            const fullPath = path.join(process.cwd(), oldImagePath);
            await this.deleteImageFile(fullPath);
        } else if (!newData.thumbnail_postingan && oldImagePath) {
            // Jika thumbnail dihapus (di-set null)
            const fullPath = path.join(process.cwd(), oldImagePath);
            await this.deleteImageFile(fullPath);
        }

        return updatedPost;
    }
}

export default Post;