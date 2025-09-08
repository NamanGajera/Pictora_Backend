'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ConversationMembers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      conversationId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "Conversations",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      lastReadMessageId: {
        type: Sequelize.UUID,
        allowNull: true,

      },
      unreadCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      lastReadAt: {
        allowNull: true,
        type: Sequelize.DATE
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
    await queryInterface.addIndex("ConversationMembers", ["conversationId"]);
    await queryInterface.addIndex("ConversationMembers", ["userId"]);
    await queryInterface.addConstraint("ConversationMembers", {
      fields: ["conversationId", "userId"],
      type: "unique",
      name: "unique_conversation_user"
    });

  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ConversationMembers');
  }
};