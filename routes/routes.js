const express = require("express");
const userRoutes = require("./userRoutes");
const postRoutes = require("./postRoutes");
const commentRoutes = require("./commentRoutes");
const authRoutes = require("./authRoutes");

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Welcome to the home page!");
});

router.use("/users", userRoutes);
router.use("/posts", postRoutes);
router.use("/comments", commentRoutes);
router.use("/auth", authRoutes);

module.exports = router;
