require("dotenv").config();

const express = require("express");
const session = require("express-session");
const passport = require("./passport");
const sequelize = require("./db");
const SequelizeStore = require("connect-session-sequelize")(session.Store);
const cors = require("cors");

const sessionStore = new SequelizeStore({
  db: sequelize,
});

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .send(
      process.env.NODE_ENV === "production" ? "Something went wrong" : err.stack
    );
};

const ensureAuthenticated = function (req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.status(401).json({ error: "User not authenticated" });
  }
};

const middleware = [
  // Middleware for enabling CORS
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? "https://main.d16slcwpn8sj8r.amplifyapp.com"
        : "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept"],
    optionsSuccessStatus: 200,
  }),

  // Middleware for parsing the request body
  express.urlencoded({ extended: true }),
  express.json(),

  // Session middleware
  session({
    name: process.env.SESSION_NAME,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore, // Use the session store
    cookie: {
      // secure: process.env.NODE_ENV === "production",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
      domain:
        process.env.NODE_ENV === "production"
          ? "main.d16slcwpn8sj8r.amplifyapp.com"
          : "localhost:3000",
    },
  }),

  // Passport middleware
  passport.initialize(),
  passport.session(),

  errorHandler,
];

module.exports = { middleware, ensureAuthenticated, errorHandler };
