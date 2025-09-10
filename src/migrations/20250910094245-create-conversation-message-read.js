'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ConversationMessageReads', {
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
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      readAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      }
    });

    await queryInterface.addIndex('ConversationMessageReads', {
      fields: ['messageId', 'userId'],
      unique: true,
    });

    await queryInterface.addIndex('ConversationMessageReads', {
      fields: ['userId'],
    });

    await queryInterface.addIndex('ConversationMessageReads', {
      fields: ['messageId'],
    });

    await queryInterface.addIndex('ConversationMessageReads', {
      fields: ['readAt'],
    });
  },

  async down(queryInterface, Sequelize) {


    await queryInterface.dropTable('ConversationMessageReads');
  }
};