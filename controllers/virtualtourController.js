import VirtualTour from "../models/VirtualTour.js";
import db from "../config/db.js";
import UploadService from "../service/uploadService.js";

const VirtualTourController = {
  async getAllVirtualTours(req, res) {
    try {
      const { search } = req.query;
      const tours = await VirtualTour.findAll(search || "");

      const toursWithIds = Array.isArray(tours)
        ? tours.map((tour) => ({
            ...tour,
            id: tour.id,
          }))
        : [];

      res.json({
        success: true,
        data: toursWithIds,
      });
    } catch (error) {
      console.error("Error fetching virtual tours:", error);
      res.status(500).json({
        success: false,
        message: "Gagal mengambil data virtual tour",
        error: error.message,
      });
    }
  },

  async getVirtualTour(req, res) {
    try {
      const id = req.params.id;

      if (!id) {
        return res.status(404).json({
          success: false,
          message: "Invalid virtual tour ID",
        });
      }

      const tour = await VirtualTour.findById(id);
      if (!tour) {
        return res.status(404).json({
          success: false,
          message: "Virtual tour not found",
        });
      }

      res.json({
        success: true,
        data: {
          ...tour,
          id: tour.id,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get virtual tour",
        error: error.message,
      });
    }
  },

  async createVirtualTour(req, res) {
    try {
      const file = req.files?.["gambar_panorama"]?.[0];

      const { nama_ruangan, hotspots } = req.body;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: "Panorama image is required",
        });
      }

      let uploaded;
      try {
        uploaded = await UploadService.upload(
          { gambar_panorama: [file] },
          "virtual-tour",
          ["gambar", "panorama"]
        );
      } catch (uploadError) {
        console.error("Image upload error:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload panorama image",
          error: uploadError.message,
        });
      }

      const panoramaData = {
        nama_ruangan,
        gambar_panorama: uploaded.gambar_panorama.url,
        file_id: uploaded.gambar_panorama.fileId,
        author: req.user.id,
      };

      let newPanorama;
      try {
        newPanorama = await VirtualTour.create(panoramaData);
        // Debug: log hasil create panorama
        console.log("DEBUG: Hasil create panorama:", newPanorama);
      } catch (dbError) {
        console.error("Database create panorama error:", dbError);
        return res.status(500).json({
          success: false,
          message: "Failed to create panorama",
          error: dbError.message,
        });
      }

      // Buat hotspot jika ada
      if (hotspots) {
        try {
          const parsedHotspots = Array.isArray(hotspots)
            ? hotspots
            : JSON.parse(hotspots);

          if (Array.isArray(parsedHotspots)) {
            for (const hotspot of parsedHotspots) {
              let targetId = null;
              if (hotspot.targetPanoramaId) {
                targetId = hotspot.targetPanoramaId;
              }

              await VirtualTour.createHotspot({
                id_panorama: newPanorama.id,
                pitch: Number(hotspot.pitch),
                yaw: Number(hotspot.yaw),
                targetPanoramaId: targetId,
                name: hotspot.text || "Hotspot",
                title: hotspot.text || "Hotspot",
                deskripsi: hotspot.description,
                kategori_hotspot: hotspot.text,
              });
            }
          }
        } catch (error) {
          console.error("Hotspot creation error:", error);
          // Lanjutkan meskipun gagal membuat hotspot
        }
      }

      // Ambil panorama lengkap beserta hotspot
      let fullPanorama;
      try {
        fullPanorama = await VirtualTour.findById(newPanorama.id);
      } catch (findError) {
        console.error("Error fetching full panorama:", findError);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch created panorama",
          error: findError.message,
        });
      }

      return res.status(201).json({
        success: true,
        data: {
          ...fullPanorama,
          id: fullPanorama.id,
        },
      });
    } catch (error) {
      console.error("Error creating virtual tour:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to create virtual tour",
        error: error.stack,
      });
    }
  },

  async updateVirtualTour(req, res) {
    try {
      const id = req.params.id;

      if (!id) {
        return res.status(404).json({
          success: false,
          message: "Invalid virtual tour ID",
        });
      }

      const { nama_ruangan } = req.body;

      // Get existing tour
      const oldTour = await VirtualTour.findById(id);
      if (!oldTour) {
        return res.status(404).json({
          success: false,
          message: "Virtual tour not found",
        });
      }

      let updateData = {
        nama_ruangan,
        gambar_panorama: oldTour.gambar_panorama,
        file_id: oldTour.file_id,
      };

      // If new file uploaded
      if (req.files?.gambar_panorama?.[0]) {
        // Upload new image to ImageKit
        const uploaded = await UploadService.upload(
          { gambar_panorama: [req.files.gambar_panorama[0]] },
          "virtual-tour",
          ["panorama"]
        );

        // Update with new image URL
        updateData.gambar_panorama = uploaded.gambar_panorama.url;

        // Delete old image from ImageKit if exists
        if (oldTour.gambar_panorama) {
          try {
            const fileId = oldTour.gambar_panorama.split("/").pop();
            await UploadService.delete(fileId);
          } catch (error) {
            console.error("Error deleting old image:", error);
          }
        }
      }

      const updated = await VirtualTour.update(id, updateData);

      res.json({
        success: true,
        data: {
          ...updated,
          id: updated.id,
        },
      });
    } catch (error) {
      console.error("Update Virtual Tour Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update virtual tour",
        error: error.message,
      });
    }
  },

  async deleteVirtualTour(req, res) {
    try {
      const id = req.params.id;

      if (!id) {
        return res.status(404).json({
          success: false,
          message: "Invalid virtual tour ID",
        });
      }

      // 1. Get the panorama first
      const tour = await VirtualTour.findById(id);
      if (!tour) {
        return res.status(404).json({
          success: false,
          message: "Virtual tour not found",
        });
      }

      // 2. Delete all hotspots first
      await db.query(
        "DELETE FROM tb_virtual_tour_360 WHERE id_panorama_asal = $1",
        [id]
      );

      if (tour.gambar_panorama) {
        try {
          if (tour.file_id) {
            await UploadService.delete(tour.file_id);
          }
        } catch (error) {
          console.error("Error deleting image from ImageKit:", error);
        }
      }

      // 4. Delete the panorama record
      await VirtualTour.delete(id);

      res.json({
        success: true,
        message: "Virtual tour deleted successfully",
      });
    } catch (error) {
      console.error("Delete virtual tour error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete virtual tour",
        error: error.message,
      });
    }
  },

  async getHotspot(req, res) {
    try {
      const id = req.params.id;

      if (!id) {
        return res.status(404).json({
          success: false,
          message: "Invalid panorama ID",
        });
      }

      const panorama = await VirtualTour.findById(id);

      if (!panorama) {
        return res.status(404).json({
          success: false,
          message: "Panorama not found",
        });
      }

      const hotspotsWithIds =
        panorama.hotspots?.map((hotspot) => ({
          ...hotspot,
          id: hotspot.id,
          targetPanoramaId: hotspot.targetPanoramaId
            ? hotspot.targetPanoramaId
            : null,
          kategori_hotspot: hotspot.kategori_hotspot || null,
        })) || [];

      res.json({
        success: true,
        data: hotspotsWithIds,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get hotspots",
        error: error.message,
      });
    }
  },

  async createHotspot(req, res) {
    console.log("Request Body:", req.body);
    try {
      const id = req.params.id;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Invalid panorama ID",
        });
      }

      const {
        pitch,
        yaw,
        targetPanoramaId,
        text,
        description,
        kategori_hotspot,
      } = req.body;

      // Validate required fields
      if (!pitch || !yaw) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields (pitch, yaw)",
        });
      }

      let decodedTargetId = null;
      // Validate target panorama exists if provided
      if (targetPanoramaId) {
        decodedTargetId = targetPanoramaId;
        const targetExists = await VirtualTour.findById(decodedTargetId);
        if (!targetExists) {
          return res.status(400).json({
            success: false,
            message: "Target panorama does not exist",
          });
        }
      }

      const hotspot = await VirtualTour.createHotspot({
        id_panorama: id,
        pitch,
        yaw,
        targetPanoramaId: decodedTargetId,
        name: text,
        title: text,
        deskripsi: description || "",
        kategori_hotspot: kategori_hotspot || null,
      });

      res.status(201).json({
        success: true,
        data: {
          id: hotspot.id,
          pitch: hotspot.pitch,
          yaw: hotspot.yaw,
          text: hotspot.name,
          description: hotspot.deskripsi,
          kategori_hotspot: hotspot.kategori_hotspot,
          targetPanoramaId: hotspot.targetpanoramald
            ? hotspot.targetpanoramald
            : null,
        },
      });
    } catch (error) {
      console.error("Create hotspot error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create hotspot",
        error: error.message,
      });
    }
  },

  async updateHotspot(req, res) {
    try {
      const panoramaId = req.params.id;
      const hotspotId = req.params.hotspotId;

      if (!panoramaId || !hotspotId) {
        return res.status(400).json({
          success: false,
          message: "Invalid panorama or hotspot ID",
        });
      }

      const {
        pitch,
        yaw,
        targetPanoramaId,
        text,
        description,
        kategori_hotspot,
      } = req.body;

      // Validate required fields
      if (!pitch || !yaw || !text) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      let decodedTargetId = null;
      if (targetPanoramaId) {
        decodedTargetId = targetPanoramaId;
      }

      const hotspot = await VirtualTour.updateHotspot(hotspotId, {
        pitch,
        yaw,
        targetPanoramaId: decodedTargetId,
        name: text,
        title: text,
        deskripsi: description || "",
        kategori_hotspot: kategori_hotspot || null,
      });

      res.json({
        success: true,
        data: {
          id: hotspot.id,
          pitch: hotspot.pitch,
          yaw: hotspot.yaw,
          text: hotspot.name,
          description: hotspot.deskripsi,
          type: hotspot.type,
          kategori_hotspot: hotspot.kategori_hotspot || null,
          targetPanoramaId: hotspot.targetpanoramald
            ? hotspot.targetpanoramald
            : null,
        },
      });
    } catch (error) {
      console.error("Update hotspot error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update hotspot",
        error: error.message,
      });
    }
  },

  async deleteHotspot(req, res) {
    try {
      const hotspotId = req.params.hotspotId;

      if (!hotspotId) {
        return res.status(400).json({
          success: false,
          message: "Invalid hotspot ID",
        });
      }

      await VirtualTour.deleteHotspot(hotspotId);

      res.json({
        success: true,
        message: "Hotspot deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to delete hotspot",
        error: error.message,
      });
    }
  },
};

export default VirtualTourController;
