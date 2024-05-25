const express = require("express");
const path = require("path");
const routes = require("../routes/routes");
const { middleware } = require("./middleware");
const config = require("./config");

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
  app.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);
  });
};

module.exports = { start, createApp };
