'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ConversationMember extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      ConversationMember.belongsTo(models.Conversation, {
        foreignKey: "conversationId",
        as: "conversationData",
        onDelete: "CASCADE",
      });
      ConversationMember.belongsTo(models.User, {
        foreignKey: "userId",
        as: "userData",
        onDelete: "CASCADE",
      });
      ConversationMember.belongsTo(models.Message, {
        foreignKey: "lastReadMessageId",
        as: "lastReadMessageData",
        onDelete: "CASCADE",
      });
    }
  }
  ConversationMember.init({
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
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    lastReadMessageId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    unreadCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    lastReadAt: {
      type: DataTypes.DATE,
      allowNull: true,
    }
  }, {
    sequelize,
    modelName: 'ConversationMember',
  });
  return ConversationMember;
};