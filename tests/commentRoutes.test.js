const request = require("supertest");
const { createApp } = require("../config/server");
const db = require("../queries/queries");

const app = createApp();

jest.mock("../queries/queries", () => ({
  getCommentsByPostId: jest.fn(),
  createComment: jest.fn(),
  updateComment: jest.fn(),
  deleteComment: jest.fn(),
  deleteCommentsByPostId: jest.fn(),
  getPostById: jest.fn(),
}));

jest.mock("../config/middleware", () => ({
  middleware: [],
  ensureAuthenticated: jest.fn((req, res, next) => {
    req.user = { id: 1 };
    next();
  }),
}));

describe("GET /comments/:postId", () => {
  it("should return 400 if invalid post id is provided", async () => {
    const res = await request(app).get("/comments/abc");
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("message", "Invalid Post ID");
  });

  it("should return 404 if no post is found", async () => {
    // Mock db.getPostById to return null
    db.getPostById.mockResolvedValue(null);
    const res = await request(app).get("/comments/1");
    expect(res.statusCode).toEqual(404);
    expect(res.body).toHaveProperty("message", "No post found");
  });

  it("should return 200 and the comments if post is found", async () => {
    // Mock db.getPostById to return a post
    db.getPostById.mockResolvedValue({ id: 1, title: "Post 1" });
    // Mock db.getCommentsByPostId to return comments
    db.getCommentsByPostId.mockResolvedValue([
      { id: 1, content: "Comment 1" },
      { id: 2, content: "Comment 2" },
    ]);
    const res = await request(app).get("/comments/1");
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual([
      { id: 1, content: "Comment 1" },
      { id: 2, content: "Comment 2" },
    ]);
  });

  it("should return 500 if there is a database error", async () => {
    // Mock db.getCommentsByPostId to throw an error
    db.getCommentsByPostId.mockRejectedValue(new Error("Database error"));
    const res = await request(app).get("/comments/1");
    expect(res.statusCode).toEqual(500);
    expect(res.body).toHaveProperty("message", "Database error");
  });
});

describe("POST /comments", () => {
  it("should return 400 if required fields are missing", async () => {
    const res = await request(app)
      .post("/comments")
      .send({ postId: 1, authorId: 1 });
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("message", "Missing required field");
  });

  it("should return 200 and the created comment if comment creation is successful", async () => {
    // Mock db.createComment to return a comment
    db.createComment.mockResolvedValue({
      id: 1,
      postId: 1,
      content: "Comment 1",
      authorId: 1,
    });
    const res = await request(app)
      .post("/comments")
      .send({ postId: 1, content: "Comment 1", authorId: 1 });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({
      id: 1,
      postId: 1,
      content: "Comment 1",
      authorId: 1,
    });
  });

  it("should return 500 if there is a database error", async () => {
    // Mock db.createComment to throw an error
    db.createComment.mockRejectedValue(new Error("Database error"));
    const res = await request(app)
      .post("/comments")
      .send({ postId: 1, content: "Comment 1", authorId: 1 });
    expect(res.statusCode).toEqual(500);
    expect(res.body).toHaveProperty("message", "Database error");
  });
});

describe("PUT /comments/:id", () => {
  it("should return 500 if comment update failed", async () => {
    // Mock db.updateComment to return null
    db.updateComment.mockResolvedValue(null);
    const res = await request(app)
      .put("/comments/1")
      .send({ content: "Updated comment" });
    expect(res.statusCode).toEqual(500);
    expect(res.body).toHaveProperty("message", "Comment update failed");
  });

  it("should return 200 and the updated comment if comment update is successful", async () => {
    // Mock db.updateComment to return an updated comment
    db.updateComment.mockResolvedValue({ id: 1, content: "Updated comment" });
    const res = await request(app)
      .put("/comments/1")
      .send({ content: "Updated comment" });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ id: 1, content: "Updated comment" });
  });

  it("should return 500 if there is a database error", async () => {
    // Mock db.updateComment to throw an error
    db.updateComment.mockRejectedValue(new Error("Database error"));
    const res = await request(app)
      .put("/comments/1")
      .send({ content: "Updated comment" });
    expect(res.statusCode).toEqual(500);
    expect(res.body).toHaveProperty("message", "Database error");
  });
});

describe("DELETE /comments/:id", () => {
  it("should return 500 if comment deletion failed", async () => {
    // Mock db.deleteComment to return null
    db.deleteComment.mockResolvedValue(null);
    const res = await request(app).delete("/comments/1");
    expect(res.statusCode).toEqual(500);
    expect(res.body).toHaveProperty("message", "Comment deletion failed");
  });

  it("should return 200 and the deleted comment if comment deletion is successful", async () => {
    // Mock db.deleteComment to return a deleted comment
    db.deleteComment.mockResolvedValue({ id: 1, content: "Deleted comment" });
    const res = await request(app).delete("/comments/1");
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ id: 1, content: "Deleted comment" });
  });

  it("should return 500 if there is a database error", async () => {
    // Mock db.deleteComment to throw an error
    db.deleteComment.mockRejectedValue(new Error("Database error"));
    const res = await request(app).delete("/comments/1");
    expect(res.statusCode).toEqual(500);
    expect(res.body).toHaveProperty("message", "Database error");
  });
});
