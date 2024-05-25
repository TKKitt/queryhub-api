const request = require("supertest");
const { createApp } = require("../config/server");
const db = require("../queries/queries");

const app = createApp();

jest.mock("../queries/queries", () => ({
  getUserById: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  updateUserPassword: jest.fn(),
  deleteUser: jest.fn(),
  updateUserAvatar: jest.fn(),
}));

jest.mock("../config/middleware", () => ({
  middleware: [],
  ensureAuthenticated: (req, res, next) => next(),
}));

jest.mock("../utils/multer", () => ({
  single: jest.fn(() => (req, res, next) => {
    req.file = { filename: "avatar.png" };
    next();
  }),
}));

jest.mock("bcrypt");

describe("GET /:id", () => {
  it("should return a user with the given id", async () => {
    const userId = 1;
    const mockUser = { id: userId, email: "test@test.com" };

    db.getUserById.mockResolvedValue(mockUser);

    const res = await request(app).get(`/users/${userId}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(mockUser);
  });
});

describe("PUT /:id", () => {
  it("should update a user and return the updated user", async () => {
    const userId = 1;
    const mockUser = { id: userId, avatar: "avatar.png", bio: "test bio" };
    const updatedUser = { ...mockUser, bio: "updated bio" };

    db.updateUser.mockResolvedValue(updatedUser);

    const res = await request(app)
      .put(`/users/${userId}`)
      .send({ bio: "updated bio" });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(updatedUser);
  });

  it("should return a 400 error if the update data is not provided", async () => {
    const userId = 1;
    const res = await request(app).put(`/users/${userId}`).send({});
    expect(res.statusCode).toEqual(400);
    expect(res.body).toEqual({ message: "No update data provided" });
  });

  it("should return a 500 error if the database update fails", async () => {
    const mockUser = {
      id: 1,
      email: "test@test.com",
      bio: null,
      avatar: "avatar.png",
    };

    db.updateUser.mockRejectedValue(new Error("Database error"));

    const res = await request(app)
      .put(`/users/${mockUser.id}`)
      .send({ bio: "Update bio" });
    expect(res.statusCode).toEqual(500);
    expect(res.body).toEqual({ message: "Database error" });
  });
});

describe("DELETE /:id", () => {
  it("should delete a user and return the deleted user", async () => {
    const userId = 1;
    const mockUser = { id: userId, email: "test@test.com" };

    db.deleteUser.mockResolvedValue(mockUser);

    const res = await request(app).delete(`/users/${userId}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(mockUser);
  });

  it("should return a 500 error if the database deletion fails", async () => {
    const userId = 1;

    db.deleteUser.mockRejectedValue(new Error("Database error"));

    const res = await request(app).delete(`/users/${userId}`);

    expect(res.statusCode).toEqual(500);
    expect(res.body).toEqual({ message: "Database error" });
  });
});
