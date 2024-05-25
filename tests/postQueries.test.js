const db = require("../queries/postQueries");
const Post = require("../models/post");

jest.mock("../models/post");

afterEach(() => {
  jest.resetAllMocks();
});

describe("getAllPosts", () => {
  it("should throw an error if there is a database error", async () => {
    const error = new Error("Database error");
    error.name = "SequelizeDatabaseError";
    Post.findAll.mockRejectedValue(error);
    await expect(db.getAllPosts()).rejects.toThrow("Database error");
  });

  it("should return all posts", async () => {
    const posts = [
      { id: 1, title: "Post 1" },
      { id: 2, title: "Post 2" },
    ];
    Post.findAll.mockResolvedValue(posts);
    const returnedPosts = await db.getAllPosts();
    expect(returnedPosts).toEqual(posts);
  });
});

describe("getPostById", () => {
  it("should throw an error if no post id is provided", async () => {
    await expect(db.getPostById(null)).rejects.toThrow("Invalid post id");
  });

  it("should throw an error if the post does not exist", async () => {
    Post.findByPk.mockResolvedValue(null);
    await expect(db.getPostById(1)).rejects.toThrow("Post not found");
  });

  it("should throw an error if there is a database error", async () => {
    const error = new Error("Database error");
    error.name = "SequelizeDatabaseError";
    Post.findByPk.mockRejectedValue(error);
    await expect(db.getPostById(1)).rejects.toThrow("Database error");
  });

  it("should return the post with the given id", async () => {
    const post = { id: 1, title: "Post 1" };
    Post.findByPk.mockResolvedValue(post);
    const returnedPost = await db.getPostById(1);
    expect(returnedPost).toEqual(post);
  });
});

describe("getPostsByAuthorId", () => {
  it("should throw an error if no author id is provided", async () => {
    await expect(db.getPostsByAuthorId(null)).rejects.toThrow(
      "Invalid author id"
    );
  });

  it("should throw an error if there is a database error", async () => {
    const error = new Error("Database error");
    error.name = "SequelizeDatabaseError";
    Post.findAll.mockRejectedValue(error);
    await expect(db.getPostsByAuthorId(1)).rejects.toThrow("Database error");
  });

  it("should return all posts by the author", async () => {
    const posts = [
      { id: 1, title: "Post 1" },
      { id: 2, title: "Post 2" },
    ];
    Post.findAll.mockResolvedValue(posts);
    const returnedPosts = await db.getPostsByAuthorId(1);
    expect(returnedPosts).toEqual(posts);
  });
});

describe("createPost", () => {
  it("should throw an error if no post data is provided", async () => {
    await expect(db.createPost(null)).rejects.toThrow("Invalid post data");
  });

  it("should throw an error if post creation fails", async () => {
    Post.create.mockResolvedValue(null);
    Post.findByPk.mockResolvedValue(null);
    await expect(db.createPost({ title: "Post 1" })).rejects.toThrow(
      "Post creation failed"
    );
  });

  it("should throw an error if there is a database error", async () => {
    const error = new Error("Database error");
    error.name = "SequelizeDatabaseError";
    Post.create.mockRejectedValue(error);
    await expect(db.createPost({ title: "Post 1" })).rejects.toThrow(
      "Database error"
    );
  });

  it("should return the created post", async () => {
    const post = { id: 1, title: "Post 1" };
    Post.create.mockResolvedValue(post);
    Post.findByPk.mockResolvedValue(post);
    const returnedPost = await db.createPost({ title: "Post 1" });
    expect(returnedPost).toEqual(post);
  });
});

describe("updatePost", () => {
  it("should throw an error if no post id is provided", async () => {
    await expect(db.updatePost(null, {})).rejects.toThrow("Invalid post id");
  });

  it("should throw an error if no post data is provided", async () => {
    await expect(db.updatePost(1, null)).rejects.toThrow("Invalid post data");
  });

  it("should throw an error if the post does not exist", async () => {
    Post.update.mockResolvedValue([0]);
    await expect(db.updatePost(1, {})).rejects.toThrow("Post not found");
  });

  it("should throw an error if there is a database error", async () => {
    const error = new Error("Database error");
    error.name = "SequelizeDatabaseError";
    Post.update.mockRejectedValue(error);
    await expect(db.updatePost(1, {})).rejects.toThrow("Database error");
  });

  it("should update the post and return the number of updated posts", async () => {
    Post.update.mockResolvedValue([1]);
    const updated = await db.updatePost(1, { title: "Updated title" });
    expect(updated).toEqual(1);
  });
});

describe("deletePost", () => {
  it("should throw an error if no post id is provided", async () => {
    await expect(db.deletePost(null)).rejects.toThrow("Invalid post id");
  });

  it("should throw an error if the post does not exist", async () => {
    Post.destroy.mockResolvedValue(0);
    await expect(db.deletePost(1)).rejects.toThrow("Post not found");
  });

  it("should throw an error if there is a database error", async () => {
    const error = new Error("Database error");
    error.name = "SequelizeDatabaseError";
    Post.destroy.mockRejectedValue(error);
    await expect(db.deletePost(1)).rejects.toThrow("Database error");
  });

  it("should delete the post and return the number of deleted posts", async () => {
    Post.destroy.mockResolvedValue(1);
    const deleted = await db.deletePost(1);
    expect(deleted).toEqual(1);
  });
});
