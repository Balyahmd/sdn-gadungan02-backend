import express from "express";
import VirtualTourController from "../controllers/virtualtourController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import fileHandlerMiddleware from "../middleware/fileHandler.js";
const router = express.Router();

router.get("/", VirtualTourController.getAllVirtualTours);
router.get("/:id", VirtualTourController.getVirtualTour);

router.post(
  "/",
  authenticate,
  fileHandlerMiddleware,
  VirtualTourController.createVirtualTour
);
router.put(
  "/:id",
  authenticate,
  fileHandlerMiddleware,
  VirtualTourController.updateVirtualTour
);
router.delete("/:id", authenticate, VirtualTourController.deleteVirtualTour);

router.get("/:id/hotspots", VirtualTourController.getHotspot);
router.post("/:id/hotspots", authenticate, VirtualTourController.createHotspot);
router.put(
  "/:id/hotspots/:hotspotId",
  authenticate,
  VirtualTourController.updateHotspot
);
router.delete(
  "/:id/hotspots/:hotspotId",
  authenticate,
  VirtualTourController.deleteHotspot
);

export default router;
