"use strict";
/** @type {import('sequelize-cli').Migration} */

const { Enums } = require("../utils/common");
const { POST_TYPE } = Enums;
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("PostMedia", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
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
      mediaUrl: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      thumbnail: {
        type: Sequelize.STRING,
      },
      mediaType: {
        type: Sequelize.ENUM,
        values: Object.values(POST_TYPE),
        defaultValue: POST_TYPE.IMAGE,
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
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("PostMedia");
  },
};
