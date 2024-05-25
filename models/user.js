const { DataTypes, Model } = require("sequelize");

class User extends Model {
  static schema = {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    bio: {
      type: DataTypes.TEXT,
    },
    avatar: {
      type: DataTypes.STRING,
      defaultValue: "avatar.png",
    },
    googleId: {
      type: DataTypes.STRING,
    },
  };
}

module.exports = User;
