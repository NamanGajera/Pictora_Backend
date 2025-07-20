"use strict";
const { Model } = require("sequelize");

const { Enums } = require("../utils/common");
const { GENDER } = Enums;

module.exports = (sequelize, DataTypes) => {
  class UserProfile extends Model {
    static associate(models) {
      UserProfile.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });
    }
  }

  UserProfile.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      bio: {
        type: DataTypes.TEXT,
      },
      dob: {
        type: DataTypes.DATE,
      },
      gender: {
        type: DataTypes.ENUM,
        values: Object.values(GENDER),
        defaultValue: GENDER.MALE,
      },
      profile_picture: {
        type: DataTypes.STRING,
      },

      location: {
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      modelName: "UserProfile",
      tableName: "UserProfiles",
      underscored: true,
    }
  );

  return UserProfile;
};
