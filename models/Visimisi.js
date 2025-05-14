import db from '../config/db.js';

class Visimisi {
    static async getVimis() {
        try {
            const result = await db.query(
                'SELECT * FROM tb_visimisi ORDER BY created_at DESC LIMIT 1'
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error getting school vision and mission:', error);
            throw error;
        }
    }

    static async updateVimis(id, { text_visi, text_misi, text_tujuan, author }) {
        try {
            const result = await db.query(
                `UPDATE tb_visimisi SET 
                text_visi = $1,
                text_misi = $2,
                text_tujuan = $3,
                author = $4,
                updated_at = NOW()
                WHERE id = $5 RETURNING *`,
                [text_visi, text_misi, text_tujuan, author, id]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error updating school vision and mission:', error);
            throw error;
        }
    }

    static async createVimis({ text_visi, text_misi, text_tujuan, author }) {
        try {
            const result = await db.query(
                `INSERT INTO tb_visimisi 
                (text_visi, text_misi, text_tujuan, author, created_at) 
                VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
                [text_visi, text_misi, text_tujuan, author]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error creating school vision and mission:', error);
            throw error;
        }
    }
}

export default Visimisi;