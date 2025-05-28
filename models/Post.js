import db from "../config/db.js";
import fs from "fs";
import path from "path";

class Post {
  static async findAll(search = "") {
    let query = `
    SELECT
    p.id,
    p.title_postingan,
    p.thumbnail_postingan,
    p.deskripsi_postingan,
    p.text_postingan,
    p.kategori,
    p.keyword,
    p.created_at,
    p.updated_at,
    u.id AS author_id,
    u.username AS author_username,
    u.email AS author_email
    FROM tb_postingan p
    LEFT JOIN tb_users u ON p.author = u.id
    ORDER BY p.created_at DESC;
  `;
    const params = [];

    if (search && search.trim() !== "") {
      query += `
      WHERE p.title_postingan ILIKE $1
        OR p.deskripsi_postingan ILIKE $2
        OR p.kategori ILIKE $3
        OR u.nama ILIKE $4
    `;
      const likeSearch = `%${search}%`;
      params.push(likeSearch, likeSearch, likeSearch, likeSearch);
    }

    const result = await db.query(query, params);

    return result.rows;
  }
  static async findById(id) {
    const result = await db.query(
      `SELECT 
         p.*, 
         u.username AS author_username
       FROM tb_postingan p
       JOIN tb_users u ON p.author = u.id
       WHERE p.id = $1`,
      [id]
    );

    return result.rows[0]; // Mengembalikan baris pertama (hasil tunggal)
  }

  static async create(postData) {
    const {
      title_postingan,
      thumbnail_postingan,
      deskripsi_postingan,
      text_postingan,
      kategori,
      keyword,
      author,
    } = postData;

    const query = `
            INSERT INTO tb_postingan 
            (title_postingan, thumbnail_postingan, deskripsi_postingan, text_postingan, kategori, keyword, author, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            RETURNING *`;

    try {
      const result = await db.query(query, [
        title_postingan,
        thumbnail_postingan,
        deskripsi_postingan,
        text_postingan,
        kategori,
        keyword,
        author,
      ]);

      // Check if result has rows and return the first one
      if (result.rows && result.rows.length > 0) {
        return result.rows[0];
      }
      throw new Error("No data returned from query");
    } catch (error) {
      console.error("Error in Post.create:", error);
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

    // Tambahkan updated_at
    fields.push(`updated_at = NOW()`, `created_at = NOW()`);

    // Tambahkan ID sebagai parameter terakhir
    values.push(id);

    const query = `
    UPDATE tb_postingan 
    SET ${fields.join(", ")}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

    try {
      const result = await db.query(query, values);
      if (result.rows.length === 0) {
        throw new Error("Post not found or nothing updated");
      }
      return result.rows[0];
    } catch (error) {
      console.error("Error updating post:", error.message);
      throw new Error("Gagal mengupdate postingan");
    }
  }

  static async delete(id) {
    await db.query("DELETE FROM tb_postingan WHERE id = $1", [id]);
  }

  static async isOwner(id, userId) {
    const result = await db.query(
      "SELECT author FROM tb_postingan WHERE id = $1",
      [id]
    );
    return result.rows[0]?.author === userId;
  }

  static async updateWithImageCleanup(id, newData, oldImagePath) {
    const updatedPost = await this.update(id, newData);

    // Delete old image if it's being replaced or removed
    if (
      newData.thumbnail_postingan &&
      oldImagePath &&
      newData.thumbnail_postingan !== oldImagePath
    ) {
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
