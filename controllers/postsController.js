import Post from "../models/Post.js";
import fs from "fs";
import UploadService from "../service/uploadService.js";

const PostsController = {
  getAllPosts: async (req, res) => {
    try {
      const posts = await Post.findAll(req.query.search || "");

      const postsWithUrls = posts.map((post) => ({
        ...post,
        id: req.app.locals.hashids.encode(post.id),
        thumbnail_postingan: post.thumbnail_postingan,
      }));

      res.json({ success: true, data: postsWithUrls });
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch posts",
        error: error.message,
      });
    }
  },

  getPostById: async (req, res) => {
    try {
      const hashedId = req.params.id;
      const id = req.app.locals.hashids.decode(hashedId)[0];

      if (!id) {
        return res.status(404).json({
          success: false,
          message: "Invalid post ID",
        });
      }

      const post = await Post.findById(id);

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Postingan tidak ditemukan",
        });
      }

      res.json({
        success: true,
        data: {
          ...post,
          id: req.app.locals.hashids.encode(post.id),
          thumbnail_postingan: post.thumbnail_postingan,
        },
      });
    } catch (error) {
      console.error("Error fetching post by ID:", error);
      res.status(500).json({
        success: false,
        message: "Gagal mengambil postingan",
        error: error.message,
      });
    }
  },

  createPost: async (req, res) => {
    try {
      console.log("Request Files:", req.files);

      const file = req.files?.["thumbnail_postingan"]?.[0];

      const {
        title_postingan,
        deskripsi_postingan,
        text_postingan,
        kategori,
        keyword,
      } = req.body;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: "file is required",
        });
      }

      const uploaded = await UploadService.upload(
        { thumbnail_postingan: [file] },
        "post-thumbnail",
        ["postingan", "thumbnail"]
      );

      const postData = {
        title_postingan,
        deskripsi_postingan,
        text_postingan,
        kategori,
        keyword,
        file_id: uploaded.thumbnail_postingan.fileId,
        thumbnail_postingan: uploaded.thumbnail_postingan.url,
        author: req.user.id,
      };

      const newPost = await Post.create(postData);

      return res.status(201).json({
        success: true,
        data: {
          ...newPost,
          id: req.app.locals.hashids.encode(newPost.id),
        },
      });
    } catch (error) {
      console.error("Error creating post:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to create post",
        error: error.stack,
      });
    }
  },

  updatePost: async (req, res) => {
    try {
      const hashedId = req.params.id;
      const id = req.app.locals.hashids.decode(hashedId)[0];
      const userId = req.user.id;

      if (!id) {
        return res.status(404).json({
          success: false,
          message: "Invalid post ID",
        });
      }

      const post = await Post.findById(id);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      const isOwner = await Post.isOwner(id, userId);
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to update this post",
        });
      }

      let thumbnail_postingan = post.thumbnail_postingan;
      let file_id = post.file_id;

      // Handle file upload if new file is provided
      if (req.files?.thumbnail_postingan?.[0]) {
        const file = req.files.thumbnail_postingan[0];
        const uploaded = await UploadService.upload(
          { thumbnail_postingan: [file] },
          "post-thumbnail",
          ["postingan", "thumbnail"]
        );

        if (uploaded.thumbnail_postingan) {
          if (file_id) {
            try {
              await UploadService.delete(file_id);
            } catch (error) {
              console.error("Error deleting old thumbnail:", error);
            }
          }

          thumbnail_postingan = uploaded.thumbnail_postingan.url;
          file_id = uploaded.thumbnail_postingan.fileId;
        }
      } else if (req.body.removeImage === "true") {
        if (file_id) {
          try {
            await UploadService.delete(file_id);
          } catch (error) {
            console.error("Error deleting thumbnail:", error);
          }
        }
        thumbnail_postingan = null;
        file_id = null;
      }

      const updatedPost = await Post.update(id, {
        title_postingan: req.body.title_postingan,
        deskripsi_postingan: req.body.deskripsi_postingan,
        text_postingan: req.body.text_postingan,
        kategori: req.body.kategori,
        keyword: req.body.keyword,
        thumbnail_postingan,
        file_id,
      });

      res.json({
        success: true,
        data: {
          ...updatedPost,
          id: req.app.locals.hashids.encode(updatedPost.id),
          thumbnail_postingan,
        },
      });
    } catch (error) {
      // Clean up uploaded files if error occurs
      if (req.files) {
        for (const fileArray of Object.values(req.files)) {
          fileArray.forEach((file) => {
            if (file.path && fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          });
        }
      }
      console.error("Error updating post:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to update post",
      });
    }
  },

  deletePost: async (req, res) => {
    try {
      const hashedId = req.params.id;
      const id = req.app.locals.hashids.decode(hashedId)[0];

      if (!id) {
        return res.status(404).json({
          success: false,
          message: "Invalid post ID",
        });
      }

      const post = await Post.findById(id);

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      const isOwner = await Post.isOwner(id, req.user.id);
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized access",
        });
      }

      if (post.file_id) {
        try {
          await UploadService.delete(post.file_id);
        } catch (err) {
          console.error("Error deleting thumbnail data:", err);
        }
      }

      await Post.delete(id);

      res.json({
        success: true,
        message: "Post deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(error.message === "Post not found" ? 404 : 500).json({
        success: false,
        message: error.message || "Failed to delete post",
      });
    }
  },
};

export default PostsController;
