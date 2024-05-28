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
  }),

  // Middleware to handle OPTIONS requests
  function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    res.header("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") {
      res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
      return res.status(200).json({});
    }
    next();
  },

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
      secure: process.env.NODE_ENV === "production",
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
