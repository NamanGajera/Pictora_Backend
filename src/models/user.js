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
    }
  );

  return User;
};
