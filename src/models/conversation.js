'use strict';
const {
  Model
} = require('sequelize');
const { Enums } = require("../utils/common");
const { CONVERSATION_TYPE } = Enums;

module.exports = (sequelize, DataTypes) => {
  class Conversation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Conversation.hasMany(models.ConversationMember, {
        foreignKey: "conversationId",
        as: "members",
        onDelete: "CASCADE",
      });
      Conversation.hasMany(models.ConversationMessage, {
        foreignKey: "conversationId",
        as: "messages",
        onDelete: "CASCADE",
      });
      Conversation.belongsTo(models.ConversationMessage, {
        foreignKey: "lastMessageId",
        as: "lastMessageData",
        onDelete: "SET NULL",
      });
    }
  }
  Conversation.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM,
      values: Object.values(CONVERSATION_TYPE),
      defaultValue: CONVERSATION_TYPE.PRIVATE,
    },
    title: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    lastMessageId: {
      type: DataTypes.UUID,
      allowNull: true,
    }

  }, {
    sequelize,
    modelName: 'Conversation',
  });
  return Conversation;
};