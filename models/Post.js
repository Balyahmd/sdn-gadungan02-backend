import db from "../config/db.js";
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
        p.file_id,
        p.created_at,
        p.updated_at,
        u.id AS author_id,
        u.username AS author_username,
        u.email AS author_email
      FROM tb_postingan p
      LEFT JOIN tb_users u ON p.author = u.id
    `;
    const params = [];

    if (search?.trim()) {
      query += `
        WHERE p.title_postingan ILIKE $1
          OR p.deskripsi_postingan ILIKE $2
          OR p.kategori ILIKE $3
          OR u.username ILIKE $4
      `;
      const likeSearch = `%${search}%`;
      params.push(likeSearch, likeSearch, likeSearch, likeSearch);
    }

    query += ` ORDER BY p.created_at DESC`;

    const result = await db.query(query, params);
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query(
      `SELECT 
        p.*,
        u.id AS author_id,
        u.username AS author_username,
        u.email AS author_email
      FROM tb_postingan p
      JOIN tb_users u ON p.author = u.id
      WHERE p.id = $1`,
      [id]
    );

    return result.rows[0];
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
      file_id,
    } = postData;

    const query = `
      INSERT INTO tb_postingan (
        title_postingan,
        thumbnail_postingan,
        deskripsi_postingan,
        text_postingan,
        kategori,
        keyword,
        author,
        file_id,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
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
        file_id,
      ]);

      if (!result.rows?.[0]) {
        throw new Error("Failed to create post");
      }

      return result.rows[0];
    } catch (error) {
      console.error("Error in Post.create:", error);
      throw error;
    }
  }

  static async update(id, data) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    // Filter out undefined values and build query parts
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error("No valid fields to update");
    }

    // Add updated_at timestamp
    fields.push(`updated_at = NOW()`);

    // Add id as last parameter
    values.push(id);

    const query = `
      UPDATE tb_postingan 
      SET ${fields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *`;

    try {
      const result = await db.query(query, values);

      if (!result.rows?.[0]) {
        throw new Error("Post not found");
      }

      return result.rows[0];
    } catch (error) {
      console.error("Error updating post:", error);
      throw new Error("Failed to update post");
    }
  }

  static async delete(id) {
    try {
      const result = await db.query(
        "DELETE FROM tb_postingan WHERE id = $1 RETURNING *",
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error in Post.delete:", error);
      throw error;
    }
  }

  static async isOwner(id, userId) {
    const result = await db.query(
      "SELECT author FROM tb_postingan WHERE id = $1",
      [id]
    );
    return result.rows[0]?.author === userId;
  }
}

export default Post;
