require("dotenv").config();
const Sequelize = require("sequelize");
const User = require("../models/user");
const Post = require("../models/post");
const Comment = require("../models/comment");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    logging: false,
    dialectOptions:
      process.env.DB_USE_SSL === "true"
        ? {
            ssl: {
              require: true,
              rejectUnauthorized: false,
            },
          }
        : {},
  }
);

// Initializing models
User.init(User.schema, { sequelize, modelName: "User" });
Post.init(Post.schema, { sequelize, modelName: "Post" });
Comment.init(Comment.schema, { sequelize, modelName: "Comment" });

// Setting up model associations
User.hasMany(Post, {
  foreignKey: "authorId",
  as: "posts",
});

User.hasMany(Comment, {
  foreignKey: "authorId",
});

Post.belongsTo(User, {
  foreignKey: "authorId",
  as: "author",
});

Post.hasMany(Comment, {
  foreignKey: "postId",
  as: "comments",
});

Comment.belongsTo(Post, {
  foreignKey: "postId",
  as: "post",
});

Comment.belongsTo(User, {
  foreignKey: "authorId",
  as: "author",
});

module.exports = sequelize;
