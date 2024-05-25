const express = require("express");
const db = require("../queries/queries");
const { ensureAuthenticated } = require("../config/middleware");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const posts = await db.getAllPosts();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const post = await db.getPostById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/author/:authorId", async (req, res) => {
  try {
    const authorId = req.params.authorId;

    if (isNaN(authorId)) {
      return res.status(400).json({ message: "Invalid author ID" });
    }

    const posts = await db.getPostsByAuthorId(authorId);

    const author = await db.getUserById(authorId);
    if (!author) {
      return res.status(404).json({ message: "No author found for this ID" });
    }

    // If no posts are found for the author, return an empty array
    if (posts.length === 0) {
      return res.json([]);
    }

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", ensureAuthenticated, async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        message: "Missing required fields: 'title' and 'content' are required.",
      });
    }

    const authorId = req.user.id;
    const post = await db.createPost({ title, content, authorId });

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", ensureAuthenticated, async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        message: "Missing required fields: 'title' and 'content' are required.",
      });
    }

    const post = await db.getPostById(req.params.id);

    if (!req.user || post.authorId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this post" });
    }

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const updatedPost = await db.updatePost(req.params.id, req.body);
    res.json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", ensureAuthenticated, async (req, res) => {
  try {
    const post = await db.getPostById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (!req.user || post.authorId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this post" });
    }

    await db.deleteCommentsByPostId(req.params.id);

    const deletedPost = await db.deletePost(req.params.id);
    res.json(deletedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
