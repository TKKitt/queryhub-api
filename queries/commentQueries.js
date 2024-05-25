const Comment = require("../models/comment");
const User = require("../models/user");

const getCommentsByPostId = async (postId) => {
  try {
    if (!postId) {
      throw new Error("Invalid post id");
    }

    const comments = await Comment.findAll({
      where: { postId },
      include: [
        {
          model: User,
          as: "author",
          attributes: ["email"],
        },
      ],
    });

    return comments;
  } catch (error) {
    console.error(error);
    if (error.name === "SequelizeDatabaseError") {
      throw new Error("Database error");
    }
    throw error;
  }
};

const createComment = async (commentData) => {
  console.log(`commentData: ${JSON.stringify(commentData)}`);

  try {
    if (
      !commentData ||
      !commentData.content ||
      !commentData.authorId ||
      !commentData.postId
    ) {
      throw new Error("Invalid comment data");
    }

    const createdComment = await Comment.create(commentData);

    if (!createdComment) {
      throw new Error("Comment creation failed");
    }

    const comment = await Comment.findByPk(createdComment.id, {
      include: [
        {
          model: User,
          as: "author",
          attributes: ["email"],
        },
      ],
    });

    if (!comment) {
      throw new Error("Could not find comment after creation");
    }

    return comment;
  } catch (error) {
    console.error(error);
    if (error.name === "SequelizeDatabaseError") {
      throw new Error("Database error");
    }
    throw error;
  }
};

const updateComment = async (id, commentData) => {
  try {
    if (!id || !commentData) {
      throw new Error("Invalid comment id or data");
    }

    const [updated] = await Comment.update(commentData, { where: { id } });

    if (!updated) {
      throw new Error("Comment not found or update failed");
    }

    return updated;
  } catch (error) {
    console.error(error);
    if (error.name === "SequelizeDatabaseError") {
      throw new Error("Database error");
    }
    throw error;
  }
};

const deleteComment = async (id) => {
  try {
    if (!id) {
      throw new Error("Invalid comment id");
    }

    const deleted = await Comment.destroy({ where: { id } });

    if (!deleted) {
      throw new Error("Comment not found or deletion failed");
    }

    return deleted;
  } catch (error) {
    console.error(error);
    if (error.name === "SequelizeDatabaseError") {
      throw new Error("Database error");
    }
    throw error;
  }
};

const deleteCommentsByPostId = async (postId) => {
  try {
    if (!postId) {
      throw new Error("Invalid post id");
    }

    const deleted = await Comment.destroy({ where: { postId } });

    return deleted;
  } catch (error) {
    console.error(error);
    if (error.name === "SequelizeDatabaseError") {
      throw new Error("Database error");
    }
    throw error;
  }
};

module.exports = {
  getCommentsByPostId,
  createComment,
  updateComment,
  deleteComment,
  deleteCommentsByPostId,
};
