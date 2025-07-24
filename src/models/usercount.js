"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class UserCount extends Model {
    static associate(models) {
      // Link to User (1:1)
      UserCount.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user",
        onDelete: "CASCADE",
      });
    }
  }
  UserCount.init(
    {
      userId: {
        type: DataTypes.UUID,
        primaryKey: true,
      },
      followerCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: { min: 0 },
      },
      followingCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: { min: 0 },
      },
      postCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: { min: 0 },
      },
    },
    {
      sequelize,
      modelName: "UserCount",
      // No additional indexes needed (single PK lookup)
    }
  );
  return UserCount;
};
