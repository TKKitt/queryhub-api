const session = require("express-session");
const bcrypt = require("bcrypt");
const sequelize = require("../config/db");
const express = require("express");
const authRoutes = require("../routes/authRoutes");
const User = require("../models/user");
const supertestSession = require("supertest-session");
const FileStore = require("session-file-store")(session);

let app;
let testSession = null;
let existingUserId;

jest.mock("../config/middleware", () => ({
  middleware: [],
  ensureAuthenticated: jest.fn((req, res, next) => {
    req.user = { id: 1 };
    next();
  }),
}));

function buildUser(overrides) {
  const user = {
    email: "test@test.com",
    password: "password123",
    ...overrides,
  };
  return user;
}

beforeAll(async () => {
  app = express();
  app.use(express.json());
  app.use(
    session({
      store: new FileStore(),
      secret: "keyboard cat",
      resave: false,
      saveUninitialized: false,
    })
  );
  app.use("/auth", authRoutes);

  await sequelize.sync();
});

beforeEach(async () => {
  const existingUser = buildUser({
    email: "existingEmail@test.com",
  });
  const hashedPassword = await bcrypt.hash(existingUser.password, 10);
  const savedUser = await User.create({
    email: existingUser.email,
    password: hashedPassword,
  });
  existingUserId = savedUser.id;
  testSession = supertestSession(app);
});

afterEach(async () => {
  await sequelize.models.User.destroy({ where: {} });
});

afterAll(async () => {
  await sequelize.close();
});

describe("POST /register", () => {
  it("should register a new user", async () => {
    const newUser = buildUser();
    const res = await testSession.post("/auth/register").send(newUser);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("message", "User created successfully");
  });
  it("should not register a user with an existing email", async () => {
    const existingUser = buildUser({
      email: "existingEmail@test.com",
      password: "password123",
    });
    const res = await testSession.post("/auth/register").send(existingUser);
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("message", "Email already in use");
  });
  it("should not register a user with an empty password", async () => {
    const user = buildUser({ password: "" });
    const res = await testSession.post("/auth/register").send(user);
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("message", "Password is required");
  });
  it("should not register a user with an invalid email", async () => {
    const user = buildUser({ email: "invalidemail" });
    const res = await testSession.post("/auth/register").send(user);
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("message", "Invalid email");
  });
  it("should not register a user with a short password", async () => {
    const res = await testSession.post("/auth/register").send({
      email: "test3@test.com",
      password: "short",
    });
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty(
      "message",
      "Password must be at least 8 characters long"
    );
  });
});

describe("POST /login", () => {
  it("should login a user", async () => {
    const existingUser = buildUser({ email: "existingEmail@test.com" });
    const res = await testSession.post("/auth/login").send(existingUser);

    if (res.statusCode !== 200) {
      console.log(res.body);
    }

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("message", "User logged in successfully");
  });

  it("should not login a non-existent user", async () => {
    const nonExistentUser = buildUser();
    const res = await testSession.post("/auth/login").send(nonExistentUser);
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("message", "User not found");
  });

  it("should not login a user with incorrect password", async () => {
    const existingUserWrongPassword = buildUser({
      email: "existingEmail@test.com",
      password: "wrongPassword",
    });
    const res = await testSession
      .post("/auth/login")
      .send(existingUserWrongPassword);
    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty("message", "Invalid email or password");
  });

  it("should not login a user with an invalid email", async () => {
    const userInvalidEmail = buildUser({ email: "invalidEmail" });
    const res = await testSession.post("/auth/login").send(userInvalidEmail);
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("message", "Invalid email");
  });
});

describe("GET /login", () => {
  it('should redirect to "/"', async () => {
    const res = await testSession.get("/auth/login").send();
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toBe("/");
  });
});

describe("GET /checkAuthentication", () => {
  it("should check if user is authenticated", async () => {
    const existingUser = buildUser({ email: "existingEmail@test.com" });
    const loginRes = await testSession.post("/auth/login").send(existingUser);

    const loginResBody = JSON.parse(loginRes.text);
    const userId = loginResBody.user.dataValues.id;

    const res = await testSession.get("/auth/checkAuthentication");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: userId,
      email: "existingEmail@test.com",
      bio: null,
      avatar: "avatar.png",
    });
  });
});

describe("POST /logout", () => {
  it("should logout a user", async () => {
    const existingUser = buildUser({ email: "existingEmail@test.com" });
    const loginRes = await testSession.post("/auth/login").send(existingUser);

    expect(loginRes.status).toBe(200);
    expect(loginRes.body).toHaveProperty(
      "message",
      "User logged in successfully"
    );

    const logoutRes = await testSession.post("/auth/logout");
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body).toEqual({
      message: "Logged out successfully",
    });
  });

  it("should not logout a user who is not logged in", async () => {
    const res = await testSession.post("/auth/logout");
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("message", "No user to log out");
  });
});

describe("PUT /:id/password", () => {
  it("should update a user's password", async () => {
    const updateData = {
      oldPassword: "password123",
      newPassword: "newPassword123",
    };

    const res = await testSession
      .put(`/auth/${existingUserId}/password`)
      .send(updateData);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Password updated successfully" });
  });

  it("should send a 404 status if the user does not exist", async () => {
    const invalidId = 999;
    const updateData = {
      oldPassword: "password123",
      newPassword: "newPassword123",
    };

    const res = await testSession
      .put(`/auth/${invalidId}/password`)
      .send(updateData);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "User not found");
  });

  it("should send a 400 status if the old password is not provided", async () => {
    const updateData = {
      newPassword: "newPassword123",
    };

    const res = await testSession
      .put(`/auth/${existingUserId}/password`)
      .send(updateData);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty(
      "message",
      "Old password and new password are required"
    );
  });

  it("should send a 400 status if the new password is not provided", async () => {
    const updateData = {
      oldPassword: "password123",
    };

    const res = await testSession
      .put(`/auth/${existingUserId}/password`)
      .send(updateData);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty(
      "message",
      "Old password and new password are required"
    );
  });

  it("should send a 400 status if the old password is incorrect", async () => {
    const updateData = {
      oldPassword: "wrongPassword",
      newPassword: "newPassword123",
    };

    const res = await testSession
      .put(`/auth/${existingUserId}/password`)
      .send(updateData);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message", "Current password is incorrect");
  });

  it("should send a 400 status if the new password is the same as the old password", async () => {
    const updateData = {
      oldPassword: "password123",
      newPassword: "password123",
    };

    const res = await testSession
      .put(`/auth/${existingUserId}/password`)
      .send(updateData);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty(
      "message",
      "New password must be different from old password"
    );
  });

  it("should send a 400 status if the new password is too short", async () => {
    const updateData = {
      oldPassword: "password123",
      newPassword: "short",
    };

    const res = await testSession
      .put(`/auth/${existingUserId}/password`)
      .send(updateData);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty(
      "message",
      "Password must be at least 8 characters long"
    );
  });
});

describe("Session persistence", () => {
  it("should persist the session between requests", async () => {
    const existingUser = buildUser({ email: "existingEmail@test.com" });
    await testSession.post("/auth/login").send(existingUser);

    const res = await testSession.get("/auth/checkAuthentication");
    expect(res.status).toBe(200);
  });
});

describe("Protected routes", () => {
  it("should not allow unauthenticated access", async () => {
    const res = await testSession.get("/auth/checkAuthentication");
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: "Not authenticated" });
  });

  it("should allow authenticated access", async () => {
    const existingUser = buildUser({ email: "existingEmail@test.com" });
    await testSession.post("/auth/login").send(existingUser);

    const res = await testSession.get("/auth/checkAuthentication");
    expect(res.status).toBe(200);
  });
});
