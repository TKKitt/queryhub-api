jest.mock("../models/user");
jest.mock("bcrypt");
const db = require("../queries/userQueries");
const User = require("../models/user");
const { ValidationError } = require("sequelize");

afterEach(() => {
  jest.resetAllMocks();
});

describe("getUserById", () => {
  it("should return a user when given a valid id", async () => {
    User.findByPk.mockResolvedValue({ id: 1, name: "Test User" });

    const user = await db.getUserById(1);

    expect(user).toEqual({ id: 1, name: "Test User" });
  });

  it("should throw an error when given an invalid id", async () => {
    await expect(db.getUserById(9999)).rejects.toThrow("User not found");
  });

  it("should throw an error when id is not provided", async () => {
    await expect(db.getUserById()).rejects.toThrow("Invalid user id");
  });

  it("should throw an error when there is a database error", async () => {
    User.findByPk.mockImplementation(() => {
      throw new Error("Database error");
    });

    await expect(db.getUserById(1)).rejects.toThrow(
      "Error fetching user by id"
    );
  });
});

describe("getUserPassword", () => {
  it("should return a user's hashed password when given a valid id", async () => {
    User.findByPk.mockResolvedValue({ id: 1, password: "hashedPassword" });

    const password = await db.getUserPassword(1);

    expect(password).toEqual("hashedPassword");
  });

  it("should throw an error when given an invalid id", async () => {
    await expect(db.getUserPassword(undefined)).rejects.toThrow(
      "Invalid user id"
    );
  });

  it("should throw an error if the user does not exist", async () => {
    await expect(db.getUserPassword(999)).rejects.toThrow("User not found");
  });

  it("should throw an error when there is a database error", async () => {
    User.findByPk.mockImplementation(() => {
      throw new Error("Database error");
    });

    await expect(db.getUserPassword(1)).rejects.toThrow(
      "Error fetching user password"
    );
  });
});

describe("createUser", () => {
  it("should throw an error when no user data is provided", async () => {
    await expect(db.createUser()).rejects.toThrow("No user data provided");
  });

  it("should throw an error when required user data is missing", async () => {
    const userData = { email: "test@test.com" };
    await expect(db.createUser(userData)).rejects.toThrow(
      "Missing required user data"
    );
  });

  it("should throw an error when a user with the same email already exists", async () => {
    const userData = { email: "test@test.com", password: "password" };
    User.create.mockImplementationOnce(() => {
      throw { name: "SequelizeUniqueConstraintError" };
    });

    await expect(db.createUser(userData)).rejects.toThrow(
      "User with this email already exists"
    );
  });

  it("should return a user when valid data is provided", async () => {
    const userData = { email: "test@test.com", password: "password" };
    const mockUser = { id: 1, ...userData };
    User.create.mockResolvedValue(mockUser);

    const user = await db.createUser(userData);

    expect(user).toEqual(mockUser);
  });
});

describe("updateUser", () => {
  it("should throw an error when no id is provided", async () => {
    await expect(db.updateUser()).rejects.toThrow("Invalid user id");
  });

  it("should throw an error when no user data is provided", async () => {
    await expect(db.updateUser(1)).rejects.toThrow(
      "No user data provided for update"
    );
  });

  it("should throw an error when user not found", async () => {
    const userData = { email: "test@test.com" };
    User.update.mockImplementation((userData, options) => {
      if (options.where.id === 1) {
        return Promise.resolve([0]);
      }
      throw new Error("Unexpected arguments");
    });

    await expect(db.updateUser(1, userData)).rejects.toThrow("User not found");
  });

  it("should throw an error when invalid user data is provided", async () => {
    const userData = { email: "invalid email" };

    User.update.mockImplementation(() => {
      throw new ValidationError("Invalid user data");
    });

    await expect(db.updateUser(1, userData)).rejects.toThrow(
      "Invalid user data for update"
    );
  });

  it("should return a user when valid id and data is provided", async () => {
    const userData = { email: "test@test.com" };
    User.update.mockResolvedValue([1]);

    const updated = await db.updateUser(1, userData);

    expect(updated).toEqual(1);
  });
});

describe("deleteUser", () => {
  it("should throw an error if no user id is provided", async () => {
    await expect(db.deleteUser(null)).rejects.toThrow("Invalid user id");
  });

  it("should throw an error if the user does not exist", async () => {
    User.destroy.mockResolvedValue(0);
    await expect(db.deleteUser(1)).rejects.toThrow("User not found");
  });

  it("should throw an error if there is a database error", async () => {
    const error = new Error("Database error");
    error.name = "SequelizeDatabaseError";
    User.destroy.mockRejectedValue(error);
    await expect(db.deleteUser(1)).rejects.toThrow("Database error");
  });

  it("should delete the user and return the number of deleted users", async () => {
    User.destroy.mockResolvedValue(1);
    const deleted = await db.deleteUser(1);
    expect(deleted).toEqual(1);
  });
});
