import db from '../config/db.js';

class VirtualTour {


  static async create({ nama_ruangan, gambar_panorama, author }) {
    const query = `
      INSERT INTO tb_panorama (nama_ruangan, gambar_panorama, author, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `;
    const values = [nama_ruangan, gambar_panorama, author];
    const { rows } = await db.query(query, values);
    return rows[0];
  }


  // In VirtualTour model
  static async findAll(search = '') {
    const query = `
      SELECT 
        p.*,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', v.id,
                'pitch', v.pitch,
                'yaw', v.yaw,
                'text', v.name_deskripsi,
                'description', v.deskripsi,
                'targetPanoramaId', v.targetpanoramald,
                'type', CASE WHEN v.targetpanoramald IS NOT NULL THEN 'scene' ELSE 'info' END
              )
            )
            FROM tb_virtual_tour_360 v
            WHERE v.id_panorama_asal = p.id
          ),
          '[]'
        ) as hotspots
      FROM tb_panorama p
      ${search ? `WHERE p.nama_ruangan ILIKE '%${search}%'` : ''}
    `;
    const { rows } = await db.query(query);
    return rows;
  }

  static async findById(id) {
    const query = `
      SELECT 
        p.*, 
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', v.id,
                'pitch', v.pitch,
                'yaw', v.yaw,
                'targetPanoramaId', v.targetpanoramald,
                'text', v.name_deskripsi,
                'title', v.title,
                'description', v.deskripsi,
                'type', CASE WHEN v.targetpanoramald IS NOT NULL THEN 'scene' ELSE 'info' END
              )
            )
            FROM tb_virtual_tour_360 v
            WHERE v.id_panorama_asal = p.id
          ), 
          '[]'
        ) as hotspots,
        (
          SELECT json_agg(json_build_object('id', t.id, 'nama_ruangan', t.nama_ruangan))
          FROM tb_panorama t
          WHERE t.id != p.id
        ) as target_options
      FROM tb_panorama p
      WHERE p.id = $1
    `;
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }

  // models/VirtualTour.js
  static async update(id, { nama_ruangan, gambar_panorama }) {
    const query = `
      UPDATE tb_panorama
      SET 
        nama_ruangan = $1,
        gambar_panorama = COALESCE($2, gambar_panorama),
        updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;
    const values = [nama_ruangan, gambar_panorama, id];
    const { rows } = await db.query(query, values);
    return rows[0];
  }

  static async createHotspot({ id_panorama, pitch, yaw, targetPanoramaId, name, title, deskripsi }) {
    const query = `
        INSERT INTO tb_virtual_tour_360 
        (id_panorama_asal, pitch, yaw, targetpanoramald, name_deskripsi, title, deskripsi, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *
    `;
    const values = [
      Number(id_panorama), // Ensure numeric
      pitch,
      yaw,
      targetPanoramaId ? Number(targetPanoramaId) : null, // Ensure numeric or null
      name,
      title,
      deskripsi
    ];

    try {
      const { rows } = await db.query(query, values);
      return rows[0];
    } catch (error) {
      console.error('Database error in createHotspot:', {
        query,
        values,
        error: error.message
      });
      throw error;
    }
  }
  static async updateHotspot(id, { pitch, yaw, targetPanoramaId, name, title, deskripsi }) {
    const query = `
        UPDATE tb_virtual_tour_360
        SET 
            pitch = $1,
            yaw = $2,
            targetpanoramald = $3,
            name_deskripsi = $4,
            title = $5,
            deskripsi = $6,
            updated_at = NOW()
        WHERE id = $7
        RETURNING *
    `;
    const values = [pitch, yaw, targetPanoramaId, name, title, deskripsi, id];

    try {
      const { rows } = await db.query(query, values);
      return rows[0];
    } catch (error) {
      console.error('Database error in updateHotspot:', {
        query,
        values,
        error: error.message
      });
      throw error;
    }
  }

  static async delete(id) {
    const query = 'DELETE FROM tb_panorama WHERE id = $1 RETURNING id';
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }


  static async deleteHotspot(id) {
    const query = 'DELETE FROM tb_virtual_tour_360 WHERE id = $1 RETURNING id';
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }
}

export default VirtualTour;