'use strict';
const {
  Model
} = require('sequelize');


const { Enums } = require("../utils/common");
const { CONVERSATION_MESSAGE_ATTACHMENT_TYPE } = Enums;

module.exports = (sequelize, DataTypes) => {
  class ConversationMessageAttachment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      ConversationMessageAttachment.belongsTo(models.ConversationMessage, {
        foreignKey: "messageId",
        as: "messageData",
        onDelete: "CASCADE",
      });
    }
  }
  ConversationMessageAttachment.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    messageId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    thumbnailUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    publicId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM,
      values: Object.values(CONVERSATION_MESSAGE_ATTACHMENT_TYPE),
    }
  }, {
    sequelize,
    modelName: 'ConversationMessageAttachment',
  });
  return ConversationMessageAttachment;
};