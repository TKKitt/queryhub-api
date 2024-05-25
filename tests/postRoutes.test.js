const request = require("supertest");
const { createApp } = require("../config/server");
const db = require("../queries/queries");
const { ensureAuthenticated } = require("../config/middleware");

const app = createApp();

jest.mock("../queries/queries", () => ({
  getAllPosts: jest.fn(),
  getPostById: jest.fn(),
  getPostsByAuthorId: jest.fn(),
  createPost: jest.fn(),
  updatePost: jest.fn(),
  deletePost: jest.fn(),
  getUserById: jest.fn(),
  deleteCommentsByPostId: jest.fn(),
}));

jest.mock("../config/middleware", () => ({
  middleware: [],
  ensureAuthenticated: jest.fn((req, res, next) => {
    req.user = { id: 1 };
    next();
  }),
}));

describe("GET /", () => {
  it("should return all posts", async () => {
    const mockPosts = [
      { id: 1, title: "Post 1" },
      { id: 2, title: "Post 2" },
    ];

    db.getAllPosts.mockResolvedValue(mockPosts);

    const response = await request(app).get("/posts");

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual(mockPosts);
  });

  it("should return a 500 if an error occurs", async () => {
    db.getAllPosts.mockRejectedValue(new Error("An error occurred"));

    const response = await request(app).get("/posts");

    expect(response.statusCode).toEqual(500);
    expect(response.body).toEqual({ message: "An error occurred" });
  });
});

describe("GET /:id", () => {
  it("should return a post with the given id", async () => {
    const postId = 1;
    const mockPost = { id: postId, title: "Post" };

    db.getPostById.mockResolvedValue(mockPost);

    const response = await request(app).get(`/posts/${postId}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual(mockPost);
  });

  it("should send 404 if no post is found", async () => {
    const mockPost = { id: 1, title: "Post" };

    db.getPostById.mockImplementation((id) => {
      return id === mockPost.id
        ? Promise.resolve(mockPost)
        : Promise.resolve(null);
    });

    const response = await request(app).get("/posts/2");
    expect(response.statusCode).toEqual(404);
    expect(response.body).toEqual({ message: "Post not found" });
  });

  it("should return a 500 error if there's a database error", async () => {
    const postId = 1;

    db.getPostById.mockRejectedValue(new Error("Database error"));

    const response = await request(app).get(`/posts/${postId}`);

    expect(response.statusCode).toEqual(500);
    expect(response.body).toEqual({ message: "Database error" });
  });
});

describe("GET /author/:authorId", () => {
  it("should return the posts if the authorId is valid and the author has posts", async () => {
    const posts = [
      { id: 1, title: "Post 1" },
      { id: 2, title: "Post 2" },
    ];

    db.getUserById.mockResolvedValue({ id: 1, email: "test@test.com" });
    db.getPostsByAuthorId.mockResolvedValue(posts);

    const response = await request(app).get("/posts/author/1");

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual(posts);
  });

  it("should return a 400 error if the authorId is not a valid number", async () => {
    const response = await request(app).get("/posts/author/abc");

    expect(response.statusCode).toEqual(400);
    expect(response.body).toEqual({ message: "Invalid author ID" });
  });

  it("should return a 404 error if no author is found for the given authorId", async () => {
    db.getUserById.mockResolvedValue(null);

    const response = await request(app).get("/posts/author/1");

    expect(response.statusCode).toEqual(404);
    expect(response.body).toEqual({ message: "No author found for this ID" });
  });
});

describe("POST /", () => {
  it("should return the created post if the required fields are present", async () => {
    const newPost = { title: "Post 1", content: "Content 1", authorId: 1 };
    db.createPost.mockResolvedValue(newPost);

    const response = await request(app).post("/posts").send(newPost);

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual(newPost);
  });

  it("should return a 400 error if required fields are missing", async () => {
    const response = await request(app)
      .post("/posts")
      .send({ title: "Post 1" });

    expect(response.statusCode).toEqual(400);
    expect(response.body).toEqual({
      message: "Missing required fields: 'title' and 'content' are required.",
    });
  });
});

describe("PUT /:id", () => {
  it("should return the updated post if the required fields are present and the post exists", async () => {
    const post = { id: 1, title: "Post 1", content: "Content 1" };
    db.getPostById.mockResolvedValue(post);
    db.updatePost.mockResolvedValue({ ...post, title: "Updated Post 1" });

    const response = await request(app)
      .put("/posts/1")
      .send({ title: "Updated Post 1", content: "Content 1" });

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ ...post, title: "Updated Post 1" });
  });

  it("should return a 400 error if required fields are missing", async () => {
    const response = await request(app)
      .put("/posts/1")
      .send({ title: "Post 1" });

    expect(response.statusCode).toEqual(400);
    expect(response.body).toEqual({
      message: "Missing required fields: 'title' and 'content' are required.",
    });
  });

  it("should return a 404 error if no post is found for the given id", async () => {
    db.getPostById.mockResolvedValue(null);

    const response = await request(app)
      .put("/posts/1")
      .send({ title: "Post 1", content: "Content 1" });

    expect(response.statusCode).toEqual(404);
    expect(response.body).toEqual({ message: "Post not found" });
  });
});

describe("DELETE /:id", () => {
  it("should return the deleted post if the post exists and the user is authorized to delete it", async () => {
    const post = { id: 1, title: "Post 1", content: "Content 1", authorId: 1 };
    db.getPostById.mockResolvedValue(post);
    db.deletePost.mockResolvedValue(post);

    ensureAuthenticated.mockImplementation((req, res, next) => {
      req.user = { id: 1 };
      next();
    });

    let response;
    try {
      response = await request(app).delete("/posts/1");
    } catch (error) {
      console.error(error);
    }

    if (response.statusCode === 500) {
      console.log(response.body);
    }

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual(post);
  });

  it("should return a 404 error if no post is found for the given id", async () => {
    db.getPostById.mockResolvedValue(null);

    const response = await request(app).delete("/posts/1");

    expect(response.statusCode).toEqual(404);
    expect(response.body).toEqual({ message: "Post not found" });
  });

  it("should return a 403 error if the user is not authorized to delete the post", async () => {
    const post = { id: 1, title: "Post 1", content: "Content 1", authorId: 2 };
    db.getPostById.mockResolvedValue(post);

    const response = await request(app).delete("/posts/1");

    expect(response.statusCode).toEqual(403);
    expect(response.body).toEqual({
      message: "You are not authorized to delete this post",
    });
  });
});
