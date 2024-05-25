const userQueries = require("./userQueries");
const postQueries = require("./postQueries");
const commentQueries = require("./commentQueries");

module.exports = {
  ...userQueries,
  ...postQueries,
  ...commentQueries,
};
