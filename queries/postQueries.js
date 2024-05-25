const Post = require("../models/post");
const User = require("../models/user");
const Comment = require("../models/comment");

const getAllPosts = async () => {
  try {
    const posts = await Post.findAll({
      include: [
        {
          model: User,
          as: "author",
          attributes: ["email", "avatar"],
        },
        {
          model: Comment,
          as: "comments",
          include: [
            {
              model: User,
              as: "author",
              attributes: ["email", "avatar"],
            },
          ],
        },
      ],
    });

    return posts;
  } catch (error) {
    console.error(error);
    if (error.name === "SequelizeDatabaseError") {
      throw new Error("Database error");
    }
    throw error;
  }
};

const getPostById = async (id) => {
  try {
    if (!id) {
      throw new Error("Invalid post id");
    }

    const post = await Post.findByPk(id, {
      include: [
        {
          model: User,
          as: "author",
          attributes: ["email", "avatar"],
        },
        {
          model: Comment,
          as: "comments",
          include: [
            {
              model: User,
              as: "author",
              attributes: ["email", "avatar"],
            },
          ],
        },
      ],
    });

    if (!post) {
      throw new Error("Post not found");
    }

    return post;
  } catch (error) {
    console.error(error);
    if (error.name === "SequelizeDatabaseError") {
      throw new Error("Database error");
    }
    throw error;
  }
};

const getPostsByAuthorId = async (authorId) => {
  try {
    if (!authorId) {
      throw new Error("Invalid author id");
    }

    const posts = await Post.findAll({
      where: { authorId },
      include: [
        {
          model: User,
          as: "author",
          attributes: ["email", "avatar"],
        },
        {
          model: Comment,
          as: "comments",
          include: [
            {
              model: User,
              as: "author",
              attributes: ["email", "avatar"],
            },
          ],
        },
      ],
    });

    if (!posts.length) {
      return [];
    }

    return posts;
  } catch (error) {
    console.error(error);
    if (error.name === "SequelizeDatabaseError") {
      throw new Error("Database error");
    }
    throw error;
  }
};

const createPost = async (postData) => {
  try {
    if (!postData) {
      throw new Error("Invalid post data");
    }

    const post = await Post.create(postData);

    if (!post) {
      throw new Error("Post creation failed");
    }

    const newPost = await Post.findByPk(post.id, {
      include: [
        {
          model: User,
          as: "author",
          attributes: ["email", "avatar"],
        },
      ],
    });

    if (!newPost) {
      throw new Error("Post creation failed");
    }

    return newPost;
  } catch (error) {
    console.error(error);
    if (error.name === "SequelizeDatabaseError") {
      throw new Error("Database error");
    }
    throw error;
  }
};

const updatePost = async (id, postData) => {
  try {
    if (!id) {
      throw new Error("Invalid post id");
    }

    if (!postData) {
      throw new Error("Invalid post data");
    }

    const [updated] = await Post.update(postData, { where: { id } });

    if (!updated) {
      throw new Error("Post not found");
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

const deletePost = async (id) => {
  try {
    if (!id) {
      throw new Error("Invalid post id");
    }

    const deleted = await Post.destroy({ where: { id } });

    if (!deleted) {
      throw new Error("Post not found");
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

module.exports = {
  getAllPosts,
  getPostById,
  getPostsByAuthorId,
  createPost,
  updatePost,
  deletePost,
};
