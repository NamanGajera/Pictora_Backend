"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Comment extends Model {
    static associate(models) {
      Comment.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user",
      });

      Comment.belongsTo(models.Post, {
        foreignKey: "postId",
        as: "post",
      });

      Comment.belongsTo(models.Comment, {
        foreignKey: "parentCommentId",
        as: "parentComment",
      });

      Comment.hasMany(models.Comment, {
        foreignKey: "parentCommentId",
        as: "replies",
        onDelete: "CASCADE",
      });

      Comment.hasMany(models.CommentLike, {
        foreignKey: "commentId",
        as: "likes",
        onDelete: "CASCADE",
      });
    }
  }

  Comment.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      postId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Comment cannot be empty",
          },
          len: {
            args: [1, 2000],
            msg: "Comment must be between 1 and 2000 characters",
          },
        },
      },
      parentCommentId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      likeCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      isPinned: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "Comment",
      indexes: [
        {
          fields: ["postId"],
        },
        {
          fields: ["userId"],
        },
        {
          fields: ["parentCommentId"],
        },
        {
          fields: ["createdAt"],
        },
      ],
    }
  );

  return Comment;
};
