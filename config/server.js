const express = require("express");
const path = require("path");
const routes = require("../routes/routes");
const { middleware } = require("./middleware");

function createApp() {
  const app = express();

  app.set("trust proxy", 1);

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
  });
};

module.exports = { start, createApp };
