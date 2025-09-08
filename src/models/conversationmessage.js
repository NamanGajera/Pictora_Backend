'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ConversationMessage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      ConversationMessage.belongsTo(models.Conversation, {
        foreignKey: "conversationId",
        as: "conversationData",
        onDelete: "CASCADE",
      });
      ConversationMessage.belongsTo(models.User, {
        foreignKey: "senderId",
        as: "senderData",
        onDelete: "CASCADE",
      });
      ConversationMessage.belongsTo(models.Post, {
        foreignKey: "postId",
        as: "postData",
        onDelete: "SET NULL",
      });
      ConversationMessage.hasMany(models.ConversationMessageAttachment, {
        foreignKey: "messageId",
        as: "attachments",
        onDelete: "CASCADE",
      });
    }
  }
  ConversationMessage.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    conversationId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    postId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    replyToMessageId: {
      type: DataTypes.UUID,
      allowNull: false,
    }
  }, {
    sequelize,
    modelName: 'ConversationMessage',
  });
  return ConversationMessage;
};