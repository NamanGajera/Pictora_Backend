"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Follow extends Model {
    static associate(models) {
      // Follower association (who initiated the follow)
      Follow.belongsTo(models.User, {
        foreignKey: "followerId",
        as: "follower",
        onDelete: "CASCADE",
      });

      // Following association (who is being followed)
      Follow.belongsTo(models.User, {
        foreignKey: "followingId",
        as: "following",
        onDelete: "CASCADE",
      });
    }
  }
  Follow.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      followerId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      followingId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      isAccepted: {
        type: DataTypes.BOOLEAN,
        defaultValue: true, // Auto-accept if target isn't private
      },
    },
    {
      sequelize,
      modelName: "Follow",
      indexes: [
        // Critical for fast lookups
        { fields: ["followerId"] }, // "Who is this user following?"
        { fields: ["followingId"] }, // "Who follows this user?"
        {
          fields: ["followerId", "followingId"],
          unique: true, // Prevent duplicate follows
        },
      ],
    }
  );
  return Follow;
};
