// Imports
const sequelize = require("./config/db");
const server = require("./config/server");

// Syncing the database and starting the server
sequelize.sync({ force: process.env.NODE_ENV !== "production" }).then(() => {
  console.log("Database & tables created!");
  server.start();
});

// Error handling
process.on("uncaughtException", (err) => {
  console.error("There was an uncaught error", err);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down gracefully...");
  sequelize.close().then(() => process.exit(0));
});
