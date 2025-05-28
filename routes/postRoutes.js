import express from "express";
import PostsController from "../controllers/postsController.js";
import { authenticate } from "../middleware/authMiddleware.js";
// import { postUpload } from "../middleware/uploadMiddleware.js";
import fileHandlerMiddleware from "../middleware/fileHandler.js";

const router = express.Router();

router.get("/", PostsController.getAllPosts);
router.get("/:id", PostsController.getPostById);
router.post(
  "/",
  authenticate,
  fileHandlerMiddleware,
  PostsController.createPost
);
router.put(
  "/:id",
  authenticate,
  fileHandlerMiddleware,
  PostsController.updatePost
);
router.delete("/:id", authenticate, PostsController.deletePost);

export default router;
