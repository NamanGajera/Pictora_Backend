"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Comments", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
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
      postId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "Posts",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      comment: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      parentCommentId: {
        type: Sequelize.UUID,
        references: {
          model: "Comments",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      likeCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      isPinned: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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

    await queryInterface.addIndex("Comments", ["postId"]);
    await queryInterface.addIndex("Comments", ["userId"]);
    await queryInterface.addIndex("Comments", ["parentCommentId"]);
    await queryInterface.addIndex("Comments", ["createdAt"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Comments");
  },
};
