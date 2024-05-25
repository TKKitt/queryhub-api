const db = require("../queries/commentQueries");
const Comment = require("../models/comment");

jest.mock("../models/comment");

afterEach(() => {
  jest.resetAllMocks();
});

describe("getCommentsByPostId", () => {
  it("should throw an error if no post id is provided", async () => {
    await expect(db.getCommentsByPostId(null)).rejects.toThrow(
      "Invalid post id"
    );
  });

  it("should throw an error if there is a database error", async () => {
    const error = new Error("Database error");
    error.name = "SequelizeDatabaseError";
    Comment.findAll.mockRejectedValue(error);
    await expect(db.getCommentsByPostId(1)).rejects.toThrow("Database error");
  });

  it("should return all comments for the post", async () => {
    const comments = [
      { id: 1, content: "Comment 1" },
      { id: 2, content: "Comment 2" },
    ];
    Comment.findAll.mockResolvedValue(comments);
    const returnedComments = await db.getCommentsByPostId(1);
    expect(returnedComments).toEqual(comments);
  });
});

describe("createComment", () => {
  it("should throw an error if no comment data is provided", async () => {
    await expect(db.createComment(null)).rejects.toThrow(
      "Invalid comment data"
    );
  });

  it("should throw an error if comment creation fails", async () => {
    Comment.create.mockResolvedValue(null);
    await expect(
      db.createComment({ content: "Comment 1", postId: 1, authorId: 1 })
    ).rejects.toThrow("Comment creation failed");
  });

  it("should throw an error if there is a database error", async () => {
    const error = new Error("Database error");
    error.name = "SequelizeDatabaseError";
    Comment.create.mockRejectedValue(error);
    await expect(
      db.createComment({ content: "Comment 1", postId: 1, authorId: 1 })
    ).rejects.toThrow("Database error");
  });

  it("should return the created comment", async () => {
    const comment = { postId: 1, authorId: 1, content: "Comment 1" };
    Comment.create.mockResolvedValue(comment);
    const returnedComment = await db.createComment({
      content: "Comment 1",
      postId: 1,
      authorId: 1,
    });
    expect(returnedComment).toEqual(comment);
  });
});

describe("updateComment", () => {
  it("should throw an error if no comment id or data is provided", async () => {
    await expect(db.updateComment(null, null)).rejects.toThrow(
      "Invalid comment id or data"
    );
  });

  it("should throw an error if comment update fails", async () => {
    Comment.update.mockResolvedValue([0]);
    await expect(
      db.updateComment(1, { content: "Updated comment" })
    ).rejects.toThrow("Comment not found or update failed");
  });

  it("should throw an error if there is a database error", async () => {
    const error = new Error("Database error");
    error.name = "SequelizeDatabaseError";
    Comment.update.mockRejectedValue(error);
    await expect(
      db.updateComment(1, { content: "Updated comment" })
    ).rejects.toThrow("Database error");
  });

  it("should return the number of updated comments", async () => {
    Comment.update.mockResolvedValue([1]);
    const updated = await db.updateComment(1, { content: "Updated comment" });
    expect(updated).toEqual(1);
  });
});

describe("deleteComment", () => {
  it("should throw an error if no comment id is provided", async () => {
    await expect(db.deleteComment(null)).rejects.toThrow("Invalid comment id");
  });

  it("should throw an error if comment deletion fails", async () => {
    Comment.destroy.mockResolvedValue(0);
    await expect(db.deleteComment(1)).rejects.toThrow(
      "Comment not found or deletion failed"
    );
  });

  it("should throw an error if there is a database error", async () => {
    const error = new Error("Database error");
    error.name = "SequelizeDatabaseError";
    Comment.destroy.mockRejectedValue(error);
    await expect(db.deleteComment(1)).rejects.toThrow("Database error");
  });

  it("should return the number of deleted comments", async () => {
    Comment.destroy.mockResolvedValue(1);
    const deleted = await db.deleteComment(1);
    expect(deleted).toEqual(1);
  });
});

describe("deleteCommentsByPostId", () => {
  it("should throw an error if no post id is provided", async () => {
    await expect(db.deleteCommentsByPostId(null)).rejects.toThrow(
      "Invalid post id"
    );
  });

  it("should return 0 if comment deletion fails", async () => {
    Comment.destroy.mockResolvedValue(0);
    await expect(db.deleteCommentsByPostId(1)).resolves.toEqual(0);
  });

  it("should throw an error if there is a database error", async () => {
    const error = new Error("Database error");
    error.name = "SequelizeDatabaseError";
    Comment.destroy.mockRejectedValue(error);
    await expect(db.deleteCommentsByPostId(1)).rejects.toThrow(
      "Database error"
    );
  });

  it("should return the number of deleted comments", async () => {
    Comment.destroy.mockResolvedValue(1);
    const deleted = await db.deleteCommentsByPostId(1);
    expect(deleted).toEqual(1);
  });
});
