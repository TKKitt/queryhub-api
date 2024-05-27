require("dotenv").config();

module.exports = {
  port: process.env.PORT || 8080,
  session: {
    name: process.env.SESSION_NAME || "connect.sid",
    secret: process.env.SESSION_SECRET || "default_secret",
    resave: process.env.SESSION_RESAVE === "true",
    saveUninitialized: process.env.SAVE_UNINITIALIZED === "true",
  },
  allowedOrigins: ["http://localhost:3000", "https://www.queryhub-24.com"],
};
