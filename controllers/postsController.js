import Post from "../models/Post.js";
import UploadService from "../service/uploadService.js";
import fs from "fs";

const PostsController = {
  getAllPosts: async (req, res) => {
    try {
      const posts = await Post.findAll(req.query.search || ""); // Ensure search param is never undefined

      const postsWithUrls = posts.map((post) => ({
        ...post,
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
      const { id } = req.params;

      const post = await Post.findById(id); // menggunakan method kustom kamu

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
          thumbnail_postingan: post.thumbnail_postingan, // jika ada field khusus
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
      console.log("REQ.BODY:", req.body);
      console.log("REQ.FILES:", req.files);

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

      // Upload ke ImageKit
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
        thumbnail_postingan: uploaded.thumbnail_postingan.url,
        author: req.user.id,
      };

      const newPost = await Post.create(postData);

      return res.status(201).json({
        success: true,
        data: newPost,
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
      const { id } = req.params;
      const userId = req.user.id;

      // Cari post dulu sebelum cek owner
      const post = await Post.findById(id);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      // Cek owner setelah post ditemukan
      const isOwner = await Post.isOwner(id, userId);
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to update this post",
        });
      }

      // Handle upload thumbnail_postingan via UploadService
      let thumbnail_postingan = post.thumbnail_postingan; // default ke yang lama (object dari ImageKit)

      // Jika ada file baru di req.files
      if (
        req.files &&
        req.files.thumbnail_postingan &&
        req.files.thumbnail_postingan.length > 0
      ) {
        // Upload file baru ke ImageKit
        const uploadedFiles = await UploadService.upload(
          req.files,
          "thumbnail_postingan",
          ["post-thumbnail"]
        );
        const newThumbnail = uploadedFiles.thumbnail_postingan;

        if (newThumbnail) {
          try {
            // Hapus thumbnail lama dari ImageKit (kalau ada)
            if (thumbnail_postingan && thumbnail_postingan.fileId) {
              await UploadService.delete(thumbnail_postingan.fileId);
            }
            thumbnail_postingan = newThumbnail;
          } catch (error) {
            console.error("Error deleting old thumbnail:", error);
            // Continue with update even if delete fails
          }
        }
      } else if (req.body.keepExistingImage === "false") {
        try {
          // Kalau user tidak ingin keep image, berarti hapus thumbnail lama
          if (thumbnail_postingan && thumbnail_postingan.fileId) {
            await UploadService.delete(thumbnail_postingan.fileId);
          }
          thumbnail_postingan = null;
        } catch (error) {
          console.error("Error deleting old thumbnail:", error);
          // Continue with update even if delete fails
        }
      }

      // Update post data
      const updatedPost = await Post.update(id, {
        title_postingan: req.body.title_postingan,
        deskripsi_postingan: req.body.deskripsi_postingan,
        text_postingan: req.body.text_postingan,
        kategori: req.body.kategori,
        keyword: req.body.keyword,
        thumbnail_postingan,
      });

      const thumbnailUrl = thumbnail_postingan ? thumbnail_postingan.url : null;

      res.json({
        success: true,
        data: {
          ...updatedPost,
          thumbnail_postingan: thumbnailUrl,
        },
      });
    } catch (error) {
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
      const { id } = req.params;

      // Get post data first to get the fileId
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

      // Delete thumbnail from storage if exists
      if (post.thumbnail_postingan) {
        try {
          const thumbnailData = JSON.parse(post.thumbnail_postingan);
          if (thumbnailData.fileId) {
            await UploadService.delete(thumbnailData.fileId);
          }
        } catch (err) {
          console.error("Error parsing thumbnail data:", err);
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
