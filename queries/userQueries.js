const User = require("../models/user");
const bcrypt = require("bcrypt");

const getUserById = async (id) => {
  if (!id) {
    throw new Error("Invalid user id");
  }

  try {
    const user = await User.findByPk(id, {
      attributes: ["id", "email", "bio", "avatar", "createdAt"],
    });
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  } catch (error) {
    if (error.message === "User not found") {
      throw error;
    }
    console.error(error);
    throw new Error("Error fetching user by id");
  }
};

const getUserPassword = async (id) => {
  if (!id) {
    throw new Error("Invalid user id");
  }

  try {
    const user = await User.findByPk(id, { attributes: ["password"] });
    if (!user) {
      throw new Error("User not found");
    }

    return user.password;
  } catch (error) {
    if (error.message === "User not found") {
      throw error;
    }
    console.error(error);
    throw new Error("Error fetching user password");
  }
};

const createUser = async (userData) => {
  if (!userData) {
    throw new Error("No user data provided");
  }

  if (!userData.email || !userData.password) {
    throw new Error("Missing required user data");
  }

  try {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    userData.password = hashedPassword;

    return await User.create(userData);
  } catch (error) {
    console.error(error);
    if (error.name === "SequelizeUniqueConstraintError") {
      throw new Error("User with this email already exists");
    }
    throw new Error("Error creating user");
  }
};

const updateUser = async (id, userData) => {
  if (!id) {
    throw new Error("Invalid user id");
  }

  if (!userData || Object.keys(userData).length === 0) {
    throw new Error("No user data provided for update");
  }

  try {
    if (userData.password) {
      if (userData.password.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }
    }

    const [updated] = await User.update(userData, { where: { id } });
    if (updated === 0) {
      throw new Error("User not found");
    }
    return updated;
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      throw new Error("Invalid user data for update");
    }
    throw error;
  }
};

const deleteUser = async (id) => {
  try {
    if (!id) {
      throw new Error("Invalid user id");
    }

    const deleted = await User.destroy({ where: { id } });

    if (!deleted) {
      throw new Error("User not found");
    }

    return deleted;
  } catch (error) {
    console.error(error);
    if (error.name === "SequelizeDatabaseError") {
      throw new Error("Database error");
    }
    throw error;
  }
};

module.exports = {
  getUserById,
  getUserPassword,
  createUser,
  updateUser,
  deleteUser,
};
