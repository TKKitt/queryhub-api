const express = require("express");
const db = require("../queries/userQueries");
const bcrypt = require("bcrypt");
const { ensureAuthenticated } = require("../config/middleware");
const passport = require("../config/passport");

const User = require("../models/user");

const router = express.Router();

// Local Strategy Authentication
router.post("/register", async (req, res, next) => {
  const { email, password } = req.body;

  const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;

  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email" });
  }

  if (!password || password.trim() === "") {
    return res.status(400).json({ message: "Password is required" });
  }

  if (password.length < 8) {
    return res
      .status(400)
      .json({ message: "Password must be at least 8 characters long" });
  }

  try {
    let user = await User.findOne({ where: { email } });

    if (user) {
      return res.status(400).json({ message: "Email already in use" });
    } else {
      user = await db.createUser({ email, password });
      console.log(user);
      if (user) {
        delete user.password;
      }
      res.status(200).json({ user, message: "User created successfully" });
    }
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.post("/login", (req, res, next) => {
  const { email } = req.body;

  const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;

  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email" });
  }

  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.error("Error during authentication:", err);
      return res
        .status(500)
        .json({ message: "An error occurred during authentication." });
    }
    if (info && info.message === "Invalid password") {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error("Error during login:", err);
        return res
          .status(500)
          .json({ message: "An error occurred during login." });
      }
      const { password, ...userWithoutPassword } = user;
      return res.json({
        user: userWithoutPassword,
        message: "User logged in successfully",
      });
    });
  })(req, res, next);
});

router.get("/login", (req, res) => {
  res.redirect("/");
});

// Google Strategy Authentication
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get("/google/callback", function (req, res, next) {
  passport.authenticate("google", async function (err, user, info) {
    if (err) {
      console.error(err);
      return next(err);
    }
    if (!user) {
      return res.redirect("/auth/login");
    }
    req.logIn(user, async function (err) {
      if (err) {
        console.error(err);
        return next(err);
      }

      try {
        let existingUser = await User.findOne({ where: { email: user.email } });
        if (existingUser) {
          existingUser.googleId = user.googleId;
          await existingUser.save();
        } else {
          await User.create({
            email: user.email,
            password: null,
            googleId: user.googleId,
          });
        }
        req.session.userId = user.id;

        return res.redirect("https://main.d16slcwpn8sj8r.amplifyapp.com/home");
      } catch (err) {
        console.error(err);
        return next(err);
      }
    });
  })(req, res, next);
});

// Checks if user is authenticated
router.get("/checkAuthentication", async (req, res) => {
  try {
    if (!req.session || !req.session.passport) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await db.getUserById(req.session.passport.user);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      id: user.id,
      email: user.email,
      bio: user.bio,
      avatar: user.avatar,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An error occurred" });
  }
});

router.post("/logout", (req, res) => {
  if (!req.session.passport || !req.session.passport.user) {
    return res.status(400).json({ message: "No user to log out" });
  }

  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: err });
    }

    res.clearCookie("queryhub-session-cookie");
    return res.json({ message: "Logged out successfully" });
  });
});

router.put("/:id/password", ensureAuthenticated, async (req, res) => {
  const { id } = req.params;
  const { oldPassword, newPassword } = req.body;

  if (req.user.id !== id) {
    return res
      .status(403)
      .json({ message: "You are not authorized to change this password" });
  }

  if (!oldPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "Old password and new password are required" });
  }

  if (oldPassword === newPassword) {
    return res
      .status(400)
      .json({ message: "New password must be different from old password" });
  }

  if (newPassword.length < 8) {
    return res
      .status(400)
      .json({ message: "Password must be at least 8 characters long" });
  }

  try {
    const currentPasswordHash = await db.getUserPassword(id);

    const isMatch = await bcrypt.compare(oldPassword, currentPasswordHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updated = await db.updateUser(id, { password: hashedPassword });
    if (updated === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    if (error.message === "User not found") {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
