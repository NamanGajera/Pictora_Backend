"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class CommentLike extends Model {
    static associate(models) {
      CommentLike.belongsTo(models.Comment, {
        foreignKey: "commentId",
        as: "comment",
      });

      // Belongs to User
      CommentLike.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user",
      });
    }
  }

  CommentLike.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      commentId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "CommentLike",
      indexes: [
        {
          unique: true,
          fields: ["commentId", "userId"],
        },
        {
          fields: ["commentId"],
        },
        {
          fields: ["userId"],
        },
      ],
    }
  );

  return CommentLike;
};
