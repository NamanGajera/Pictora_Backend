"use strict";
const { Model } = require("sequelize");

const { Enums } = require("../utils/common");
const { POST_TYPE } = Enums;
module.exports = (sequelize, DataTypes) => {
  class PostMedia extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      PostMedia.belongsTo(models.Post, {
        foreignKey: "postId",
        as: "postData",
        onDelete: "CASCADE",
      });
    }
  }
  PostMedia.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      postId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      mediaUrl: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      thumbnail: {
        type: DataTypes.STRING,
      },
      mediaType: {
        type: DataTypes.ENUM,
        values: Object.values(POST_TYPE),
        defaultValue: POST_TYPE.IMAGE,
      },
    },
    {
      sequelize,
      modelName: "PostMedia",
    }
  );
  return PostMedia;
};
