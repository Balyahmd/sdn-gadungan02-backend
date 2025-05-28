import VirtualTour from "../models/VirtualTour.js";
import db from "../config/db.js";
import UploadService from "../service/uploadService.js";

const VirtualTourController = {
  async getAllVirtualTours(req, res) {
    try {
      const { search } = req.query;
      const tours = await VirtualTour.findAll(search);

      // Ensure we return an array in the data property
      res.json({
        success: true,
        data: Array.isArray(tours) ? tours : [],
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get virtual tours",
        error: error.message,
      });
    }
  },

  async getVirtualTour(req, res) {
    try {
      const tour = await VirtualTour.findById(req.params.id);
      if (!tour) {
        return res.status(404).json({
          success: false,
          message: "Virtual tour not found",
        });
      }
      res.json({
        success: true,
        data: tour,
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
      console.log("Full request:", {
        body: req.body,
        files: req.files,
        user: req.user,
      });

      const { nama_ruangan, hotspots } = req.body;
      const author = req.user.id;

      const file = req.files?.["gambar_panorama"]?.[0];

      if (!file) {
        return res.status(400).json({
          success: false,
          message: "Panorama image is required",
        });
      }

      // Upload ke ImageKit
      const uploaded = await UploadService.upload(
        { gambar_panorama: [file] },
        "virtual-tour",
        ["panorama"]
      );

      // 1. Create the panorama first
      const panorama = await VirtualTour.create({
        nama_ruangan,
        gambar_panorama: uploaded.gambar_panorama.url,
        author,
      });

      console.log("Created panorama:", panorama);

      // 2. Create hotspots if they exist
      if (hotspots) {
        try {
          const parsedHotspots = JSON.parse(hotspots);
          console.log("Parsed hotspots:", parsedHotspots);

          for (const hotspot of parsedHotspots) {
            await VirtualTour.createHotspot({
              id_panorama: panorama.id,
              pitch: hotspot.pitch,
              yaw: hotspot.yaw,
              targetPanoramaId: hotspot.targetPanoramaId || null,
              name: hotspot.text || "Hotspot",
              title: hotspot.text || "Hotspot",
              deskripsi: hotspot.text || "Hotspot description",
            });
          }
        } catch (error) {
          console.error("Hotspot creation error:", error);
          // Continue even if hotspots fail
        }
      }

      // 3. Get full panorama with hotspots
      const fullPanorama = await VirtualTour.findById(panorama.id);
      console.log("Full panorama with hotspots:", fullPanorama);

      res.status(201).json({
        success: true,
        data: fullPanorama,
      });
    } catch (error) {
      console.error("Create virtual tour error:", {
        message: error.message,
        stack: error.stack,
      });
      res.status(500).json({
        success: false,
        message: "Failed to create virtual tour",
        error: error.message,
      });
    }
  },

  async updateVirtualTour(req, res) {
    try {
      const { id } = req.params;
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
        gambar_panorama: oldTour.gambar_panorama, // Keep existing image by default
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
        data: updated,
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
      const { id } = req.params;

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

      // 3. Delete image from ImageKit if exists
      if (tour.gambar_panorama) {
        try {
          const fileId = tour.gambar_panorama;
          await UploadService.delete(fileId);
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
      const { id } = req.params;
      const panorama = await VirtualTour.findById(id);

      if (!panorama) {
        return res.status(404).json({
          success: false,
          message: "Panorama not found",
        });
      }

      res.json({
        success: true,
        data: panorama.hotspots || [],
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get hotspots",
        error: error.message,
      });
    }
  },

  // In virtualtourController.js
  async createHotspot(req, res) {
    try {
      const { id } = req.params;
      const { pitch, yaw, targetPanoramaId, text, description } = req.body;

      // Validate panorama ID is a number
      if (isNaN(Number(id))) {
        return res.status(400).json({
          success: false,
          message: "Invalid panorama ID",
        });
      }

      // Validate required fields
      if (!pitch || !yaw || !text) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields (pitch, yaw, text)",
        });
      }

      // Validate target panorama exists if provided
      if (targetPanoramaId) {
        const targetExists = await VirtualTour.findById(targetPanoramaId);
        if (!targetExists) {
          return res.status(400).json({
            success: false,
            message: "Target panorama does not exist",
          });
        }
      }

      const hotspot = await VirtualTour.createHotspot({
        id_panorama: Number(id), // Ensure numeric ID
        pitch,
        yaw,
        targetPanoramaId: targetPanoramaId ? Number(targetPanoramaId) : null,
        name: text,
        title: text,
        deskripsi: description || "",
      });

      res.status(201).json({
        success: true,
        data: {
          id: hotspot.id,
          pitch: hotspot.pitch,
          yaw: hotspot.yaw,
          text: hotspot.name,
          description: hotspot.deskripsi,
          targetPanoramaId: hotspot.targetpanoramald,
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
      const { id, hotspotId } = req.params;
      const { pitch, yaw, targetPanoramaId, text, description, type } =
        req.body;

      // Validate required fields
      if (!pitch || !yaw || !text) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      // In your controller's updateHotspot method
      const hotspot = await VirtualTour.updateHotspot(hotspotId, {
        pitch,
        yaw,
        targetPanoramaId, // Directly use the target ID
        name: text,
        title: text,
        deskripsi: description || "",
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
          targetPanoramaId: hotspot.targetpanoramald,
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
      const { hotspotId } = req.params;
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
