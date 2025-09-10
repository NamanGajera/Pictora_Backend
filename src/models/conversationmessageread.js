'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ConversationMessageRead extends Model {
    static associate(models) {
      ConversationMessageRead.belongsTo(models.ConversationMessage, {
        foreignKey: "messageId",
        as: "messageData",
        onDelete: "CASCADE",
      });

      ConversationMessageRead.belongsTo(models.User, {
        foreignKey: "userId",
        as: "userData",
        onDelete: "CASCADE",
      });
    }
  }
  ConversationMessageRead.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    messageId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'ConversationMessages',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    sequelize,
    modelName: 'ConversationMessageRead',
  });
  return ConversationMessageRead;
};