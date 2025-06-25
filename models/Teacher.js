import db from "../config/db.js";

class Teacher {
  static async findAll(search = "") {
    let query = "SELECT * FROM tb_guru";
    const params = [];

    if (search) {
      query +=
        " WHERE nama_guru ILIKE $1 OR nip ILIKE $2 OR keterangan_guru ILIKE $3";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += " ORDER BY created_at DESC";

    const result = await db.query(query, params);
    return result.rows; // Langsung return rows
  }
  static async create(teacherData) {
    const { nama_guru, pas_foto, nip, keterangan_guru, file_id, author } =
      teacherData;

    const query = `
      INSERT INTO tb_guru (
        nama_guru,
        pas_foto,
        nip,
        keterangan_guru,
        author,
        file_id,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *`;

    try {
      const result = await db.query(query, [
        nama_guru,
        pas_foto,
        nip,
        keterangan_guru,
        author,
        file_id,
      ]);

      if (!result.rows?.[0]) {
        throw new Error("Failed to create teacher");
      }

      return result.rows[0];
    } catch (error) {
      console.error("Error in Teacher.create:", error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const result = await db.query("SELECT * FROM tb_guru WHERE id = $1", [
        id,
      ]);
      return result.rows[0];
    } catch (error) {
      console.error("Error in Teacher.findById:", error);
      throw error;
    }
  }

  static async update(
    id,
    { nama_guru, pas_foto, nip, file_id, keterangan_guru }
  ) {
    try {
      const result = await db.query(
        `UPDATE tb_guru SET 
                nama_guru = $1, pas_foto = $2, nip = $3, 
                keterangan_guru = $4, file_id = $5, updated_at = NOW()
                WHERE id = $6 RETURNING *`,
        [nama_guru, pas_foto, nip, keterangan_guru, file_id, id]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error in Teacher.update:", error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const result = await db.query(
        "DELETE FROM tb_guru WHERE id = $1 RETURNING *",
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error in Teacher.delete:", error);
      throw error;
    }
  }

  static async getImagePath(id) {
    try {
      const result = await db.query(
        "SELECT pas_foto FROM tb_guru WHERE id = $1",
        [id]
      );
      return result.rows[0]?.pas_foto;
    } catch (error) {
      console.error("Error in Teacher.getImagePath:", error);
      throw error;
    }
  }
}

export default Teacher;
