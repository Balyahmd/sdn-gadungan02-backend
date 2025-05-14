import db from '../config/db.js';

class History {
    static async getHistory() {
        try {
            const result = await db.query(
                'SELECT * FROM tb_sejarah ORDER BY created_at DESC LIMIT 1'
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error getting school history:', error);
            throw error;
        }
    }

    static async updateHistory(id, { text_sejarah, author }) {
        try {
            const result = await db.query(
                `UPDATE tb_sejarah SET 
                text_sejarah = $1,
                author = $2,
                updated_at = NOW()
                WHERE id = $3 RETURNING *`,
                [text_sejarah, author, id]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error updating school history:', error);
            throw error;
        }
    }

    static async createHistory({ text_sejarah, author }) {
        try {
            const result = await db.query(
                `INSERT INTO tb_sejarah 
                (text_sejarah, author, created_at) 
                VALUES ($1, $2, NOW()) RETURNING *`,
                [text_sejarah, author]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error creating school history:', error);
            throw error;
        }
    }
}

export default History;