const express = require("express");
const session = require("express-session");
const passport = require("./passport");
const cors = require("cors");
const config = require("./config");

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
    origin: "https://main.d16slcwpn8sj8r.amplifyapp.com",
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
    name: config.session.name,
    secret: config.session.secret,
    resave: config.session.resave,
    saveUninitialized: config.session.saveUninitialized,
    cookie: {
      secure: false,
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
      domain: "https://main.d16slcwpn8sj8r.amplifyapp.com",
    },
  }),

  // Passport middleware
  passport.initialize(),
  passport.session(),

  errorHandler,
];

module.exports = { middleware, ensureAuthenticated, errorHandler };
