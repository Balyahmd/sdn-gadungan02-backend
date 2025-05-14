import Post from '../models/Post.js';
import fs from 'fs';

const PostsController = {
    getAllPosts: async (req, res) => {
        try {
            const posts = await Post.findAll(req.query.search);

            const postsWithUrls = posts.map(post => ({
                ...post,
                thumbnail_postingan: post.thumbnail_postingan
                    ? `${req.protocol}://${req.get('host')}${post.thumbnail_postingan}`
                    : null
            }));

            res.json({ success: true, data: postsWithUrls });
        } catch (error) {
            console.error('Error fetching posts:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch posts' });
        }
    },

    createPost: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Thumbnail is required'
                });
            }

            const postData = {
                ...req.body,
                thumbnail_postingan: `/static/uploads/feeds/${req.file.filename}`,
                author: req.user.id
            };

            const newPost = await Post.create(postData);

            res.status(201).json({
                success: true,
                data: newPost
            });
        } catch (error) {
            if (req.file) fs.unlinkSync(req.file.path);
            console.error('Error creating post:', error);
            res.status(500).json({ success: false, message: 'Failed to create post' });
        }
    },

    updatePost: async (req, res) => {
        try {
            const { id } = req.params;
            const isOwner = await Post.isOwner(id, req.user.id);

            if (!isOwner) {
                return res.status(403).json({
                    success: false,
                    message: 'Unauthorized access'
                });
            }

            const post = await Post.findById(id);
            if (!post) {
                return res.status(404).json({
                    success: false,
                    message: 'Post not found'
                });
            }

            const thumbnail_postingan = req.file
                ? `/static/uploads/feeds/${req.file.filename}`
                : req.body.keepExistingImage === "true"
                    ? post.thumbnail_postingan
                    : null;

            if (req.file && post.thumbnail_postingan) {
                await Post.deleteImageFile(post.thumbnail_postingan);
            }

            const updatedPost = await Post.update(id, {
                title_postingan: req.body.title_postingan,
                deskripsi_postingan: req.body.deskripsi_postingan,
                text_postingan: req.body.text_postingan,
                kategori: req.body.kategori,
                keyword: req.body.keyword,
                thumbnail_postingan
            });

            res.json({
                success: true,
                data: {
                    ...updatedPost,
                    thumbnail_postingan: thumbnail_postingan
                        ? `${req.protocol}://${req.get('host')}${thumbnail_postingan}`
                        : null
                }
            });
        } catch (error) {
            if (req.file) fs.unlinkSync(req.file.path);
            console.error('Error updating post:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to update post'
            });
        }
    },

    deletePost: async (req, res) => {
        try {
            const { id } = req.params;
            const isOwner = await Post.isOwner(id, req.user.id);

            if (!isOwner) {
                return res.status(403).json({
                    success: false,
                    message: 'Unauthorized access'
                });
            }

            await Post.deletePostAndImage(id);

            res.json({
                success: true,
                message: 'Post deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting post:', error);
            res.status(error.message === 'Post not found' ? 404 : 500).json({
                success: false,
                message: error.message || 'Failed to delete post'
            });
        }
    }
};

export default PostsController;