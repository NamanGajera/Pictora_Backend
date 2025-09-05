"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasOne(models.UserProfile, {
        foreignKey: "userId",
        as: "profile",
        onDelete: "CASCADE",
      });
      User.hasMany(models.Post, {
        foreignKey: "userId",
        onDelete: "CASCADE",
        as: "mediaData",
      });
      User.hasMany(models.PostLike, {
        foreignKey: "userId",
        onDelete: "CASCADE",
        as: "likedPost",
      });
      User.hasMany(models.PostSave, {
        foreignKey: "userId",
        onDelete: "CASCADE",
        as: "savedPost",
      });
      User.hasMany(models.PostArchive, {
        foreignKey: "userId",
        onDelete: "CASCADE",
        as: "archivedPost",
      });
      User.hasMany(models.Comment, {
        foreignKey: "userId",
        as: "comments",
        onDelete: "CASCADE",
      });

      User.hasMany(models.CommentLike, {
        foreignKey: "userId",
        as: "commentLikes",
        onDelete: "CASCADE",
      });
      User.belongsToMany(models.User, {
        through: models.Follow,
        foreignKey: "followingId",
        as: "followers",
      });
      User.belongsToMany(models.User, {
        through: models.Follow,
        foreignKey: "followerId",
        as: "following",
      });
      User.hasMany(models.FollowRequest, {
        foreignKey: "requesterId",
        as: "sentFollowRequests",
      });
      User.hasMany(models.FollowRequest, {
        foreignKey: "targetId",
        as: "receivedFollowRequests",
      });
      User.hasOne(models.UserCount, {
        foreignKey: "userId",
        as: "counts",
      });
      User.hasMany(models.Repost, {
        foreignKey: "userId",
        onDelete: "CASCADE",
        as: "rePost",
      });
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      fullName: {
        type: DataTypes.STRING,
      },
      userName: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "Users",
      hooks: {
        afterCreate: async (user, options) => {
          await user.createCounts(
            {
              followerCount: 0,
              followingCount: 0,
              postCount: 0,
            },
            { transaction: options.transaction }
          );
        },
      },
    }
  );

  return User;
};
