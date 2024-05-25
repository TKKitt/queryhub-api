const request = require("supertest");
const { createApp } = require("../config/server");
const sequelize = require("../config/db");
const User = require("../models/user");
const testSession = require("supertest-session");
const bcrypt = require("bcrypt");

const app = createApp();

let testAgent;
let server;

function buildUser(overrides) {
  const user = {
    email: "test@test.com",
    password: "password123",
    ...overrides,
  };
  return user;
}

beforeAll(async () => {
  server = app.listen(3000);
  testAgent = testSession(app);
  await sequelize.sync();
});

beforeEach(async () => {
  await User.destroy({ where: {}, truncate: { cascade: true } }); // Clear the users table

  const user = buildUser();
  const hashedPassword = await bcrypt.hash(user.password, 10);
  await User.create({ email: user.email, password: hashedPassword });
});

afterAll(async () => {
  await User.destroy({ where: {}, truncate: { cascade: true } });
  await testAgent.get("/auth/logout");
  await new Promise((resolve) => server.close(resolve));
});

describe("SQL Injection", () => {
  it("should prevent SQL injection in the login route", async () => {
    const res = await request(app).post("/auth/login").send({
      email: "' OR '1'='1'; --",
      password: "password123",
    });
    expect(res.statusCode).not.toEqual(500);
  });

  it("should prevent SQL injection in the register route", async () => {
    const res = await request(app).post("/auth/register").send({
      email: "' OR '1'='1'; --",
      password: "password123",
    });
    expect(res.statusCode).not.toEqual(500);
  });
});
