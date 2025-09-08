'use strict';
/** @type {import('sequelize-cli').Migration} */

const { Enums } = require("../utils/common");
const { CONVERSATION_MESSAGE_ATTACHMENT_TYPE } = Enums;

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ConversationMessageAttachments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      messageId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "ConversationMessages",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      url: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      thumbnailUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      publicId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      type: {
        type: Sequelize.ENUM,
        values: Object.values(CONVERSATION_MESSAGE_ATTACHMENT_TYPE),
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
    await queryInterface.addIndex('ConversationMessageAttachments', ['messageId']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ConversationMessageAttachments');
  }
};