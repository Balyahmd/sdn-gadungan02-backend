import db from "../config/db.js";

class History {
  // Ambil sejarah terbaru
  static async getHistory() {
    try {
      const result = await db.query(
        `SELECT s.id, s.text_sejarah, s.created_at, s.updated_at, u.id AS user_id, u.username AS user_username,
          u.email AS user_email FROM tb_sejarah s LEFT JOIN tb_users u ON s.author = u.id ORDER BY s.created_at DESC;`
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error getting school history:", error.message);
      throw new Error("Failed to get school history");
    }
  }

  // Perbarui sejarah berdasarkan ID
  static async updateHistory(id, { text_sejarah, author }) {
    try {
      const result = await db.query(
        `UPDATE tb_sejarah SET 
          text_sejarah = $1,
          author = $2,
          updated_at = NOW()
        WHERE id = $3
        RETURNING *`,
        [text_sejarah, author, id]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error updating school history:", error.message);
      throw new Error("Failed to update school history");
    }
  }

  // Tambah sejarah baru
  static async createHistory({ text_sejarah, author }) {
    try {
      const result = await db.query(
        `INSERT INTO tb_sejarah 
          (text_sejarah, author, created_at, updated_at) 
        VALUES ($1, $2, NOW(), NOW()) 
        RETURNING *`,
        [text_sejarah, author]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error creating school history:", error.message);
      throw new Error("Failed to create school history");
    }
  }
}

export default History;
