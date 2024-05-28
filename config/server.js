const express = require("express");
const path = require("path");
const routes = require("../routes/routes");
const { middleware } = require("./middleware");

function createApp() {
  const app = express();

  app.use(express.json());

  middleware.forEach((mw) => app.use(mw));

  app.use("/", routes);
  app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
  return app;
}

const start = () => {
  const app = createApp();
  app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
    console.log(`SESSION_NAME: ${process.env.SESSION_NAME}`);
    console.log(`SESSION_SECRET: ${process.env.SESSION_SECRET}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  });
};

module.exports = { start, createApp };
