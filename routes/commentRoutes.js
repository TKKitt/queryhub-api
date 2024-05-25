const express = require("express");
const db = require("../queries/queries");
const { ensureAuthenticated } = require("../config/middleware");

const router = express.Router();

router.get("/post/:postId", async (req, res, next) => {
  try {
    const postId = req.params.postId;

    if (isNaN(postId)) {
      return res.status(400).json({ message: "Invalid Post ID" });
    }

    const post = await db.getPostById(postId);

    if (!post) {
      return res.status(404).json({ message: "No post found" });
    }

    const comments = await db.getCommentsByPostId(postId);
    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { postId, content, authorId } = req.body;
    const commentData = { postId, content, authorId };
    if (!postId || !content || !authorId) {
      return res.status(400).json({ message: "Missing required field" });
    }

    console.log(commentData);

    const comment = await db.createComment(commentData);
    res.json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Database error" });
  }
});

router.put("/:id", ensureAuthenticated, async (req, res, next) => {
  if (!req.user || comment.authorId !== req.user.id) {
    return res
      .status(403)
      .json({ message: "You are not authorized to update this comment" });
  }
  try {
    const comment = await db.updateComment(req.params.id, req.body);
    if (!comment) {
      return res.status(500).json({ message: "Comment update failed" });
    }
    res.json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Database error" });
  }
});

router.delete("/:id", ensureAuthenticated, async (req, res, next) => {
  try {
    const comment = await db.deleteComment(req.params.id);
    if (!comment) {
      return res.status(500).json({ message: "Comment deletion failed" });
    }
    res.json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Database error" });
  }
});

module.exports = router;
