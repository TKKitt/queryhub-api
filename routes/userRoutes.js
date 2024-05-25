const express = require("express");
const db = require("../queries/queries");
const { ensureAuthenticated } = require("../config/middleware");
const bcrypt = require("bcrypt");
const upload = require("../utils/multer");

const router = express.Router();

router.get("/:id", async (req, res) => {
  try {
    const user = await db.getUserById(req.params.id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put(
  "/:id",
  ensureAuthenticated,
  upload.single("avatar"),
  async (req, res) => {
    if (req.user.id !== req.params.id) {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this profile" });
    }
    if (
      (req.body.bio === undefined &&
        (!req.file || req.file.filename === "avatar.png")) ||
      req.body.email ||
      req.body.password
    ) {
      return res.status(400).json({ message: "No update data provided" });
    }

    try {
      let updateData = {};

      if (req.body.bio) {
        updateData.bio = req.body.bio;
      }

      if (req.file) {
        updateData.avatar = req.file.filename;
      }

      console.log(`updateData.avatar: ${updateData.avatar}`);

      await db.updateUser(req.params.id, updateData);
      return res.status(200).json({ message: "User updated successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.delete("/:id", ensureAuthenticated, async (req, res) => {
  try {
    const user = await db.deleteUser(req.params.id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
