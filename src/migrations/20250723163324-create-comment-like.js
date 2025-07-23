"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("CommentLikes", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      commentId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "Comments",
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
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    // Add composite unique index to prevent duplicate likes
    await queryInterface.addIndex("CommentLikes", ["commentId", "userId"], {
      unique: true,
    });
    // Add individual indexes for query performance
    await queryInterface.addIndex("CommentLikes", ["commentId"]);
    await queryInterface.addIndex("CommentLikes", ["userId"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("CommentLikes");
  },
};
