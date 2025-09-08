'use strict';
/** @type {import('sequelize-cli').Migration} */

const { Enums } = require("../utils/common");
const { CONVERSATION_TYPE } = Enums;

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Conversations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      type: {
        type: Sequelize.ENUM,
        values: Object.values(CONVERSATION_TYPE),
        defaultValue: CONVERSATION_TYPE.PRIVATE,
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      lastMessageId: {
        type: Sequelize.UUID,
        allowNull: true,

      },
      title: {
        type: Sequelize.TEXT
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
    await queryInterface.addIndex("Conversations", ["type"]);

  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Conversations');
  }
};