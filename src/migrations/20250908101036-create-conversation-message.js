'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ConversationMessages', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      conversationId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      senderId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      postId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "Posts",
          key: "id",
        },
        onDelete: "SET NULL",
      },
      replyToMessageId: {
        type: Sequelize.UUID,
        allowNull: true,
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

    await queryInterface.addIndex('ConversationMessages', ['conversationId']);
    await queryInterface.addIndex('ConversationMessages', ['senderId']);
    await queryInterface.addIndex('ConversationMessages', ['replyToMessageId']);

  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ConversationMessages');
  }
};