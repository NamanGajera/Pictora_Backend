'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addConstraint('Conversations', {
      fields: ['lastMessageId'],
      type: 'foreign key',
      name: 'fk_conversations_lastMessageId',
      references: {
        table: 'ConversationMessages',
        field: 'id',
      },
      onDelete: 'SET NULL',

    });

    await queryInterface.addConstraint('ConversationMembers', {
      fields: ['lastReadMessageId'],
      type: 'foreign key',
      name: 'fk_conversations_lastReadMessageId',
      references: {
        table: 'ConversationMembers',
        field: 'id',
      },
      onDelete: 'SET NULL',

    });

    await queryInterface.addConstraint('ConversationMessages', {
      fields: ['conversationId'],
      type: 'foreign key',
      name: 'fk_conversation_messages_conversationId',
      references: {
        table: 'Conversations',
        field: 'id',
      },
      onDelete: 'CASCADE',
    });

    await queryInterface.addConstraint('ConversationMessages', {
      fields: ['replyToMessageId'],
      type: 'foreign key',
      name: 'fk_conversation_messages_replyToMessageId',
      references: {
        table: 'ConversationMessages',
        field: 'id',
      },
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('ConversationMessages', 'fk_conversation_messages_conversationId');
    await queryInterface.removeConstraint('Conversations', 'fk_conversations_lastMessageId');
    await queryInterface.removeConstraint('ConversationMembers', 'fk_conversations_lastReadMessageId');
    await queryInterface.removeConstraint('ConversationMessages', 'fk_conversation_messages_replyToMessageId');
  }
};
