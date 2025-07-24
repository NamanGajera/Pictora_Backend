"use strict";
const { Model } = require("sequelize");
const { Enums } = require("../utils/common");
const { FOLLOW_REQUEST_STATUS } = Enums;

module.exports = (sequelize, DataTypes) => {
  class FollowRequest extends Model {
    static associate(models) {
      // Requester (user who sent the request)
      FollowRequest.belongsTo(models.User, {
        foreignKey: "requesterId",
        as: "requester",
        onDelete: "CASCADE",
      });

      // Target (private account owner)
      FollowRequest.belongsTo(models.User, {
        foreignKey: "targetId",
        as: "target",
        onDelete: "CASCADE",
      });
    }
  }
  FollowRequest.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      requesterId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      targetId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM,
        values: Object.values(FOLLOW_REQUEST_STATUS),
        defaultValue: FOLLOW_REQUEST_STATUS.PENDING,
      },
    },
    {
      sequelize,
      modelName: "FollowRequest",
      indexes: [
        { fields: ["requesterId"] }, // "What requests did this user send?"
        { fields: ["targetId"] }, // "What pending requests does this user have?"
        {
          fields: ["requesterId", "targetId"],
          unique: true, // Prevent duplicate requests
        },
      ],
    }
  );
  return FollowRequest;
};
