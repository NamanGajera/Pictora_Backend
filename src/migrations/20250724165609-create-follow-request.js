"use strict";
/** @type {import('sequelize-cli').Migration} */

const { Enums } = require("../utils/common");

const { FOLLOW_REQUEST_STATUS } = Enums;
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("FollowRequests", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      requesterId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "Users", key: "id" },
        onDelete: "CASCADE",
      },
      targetId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "Users", key: "id" },
        onDelete: "CASCADE",
      },
      status: {
        type: Sequelize.ENUM,
        values: Object.values(FOLLOW_REQUEST_STATUS),
        defaultValue: FOLLOW_REQUEST_STATUS.PENDING,
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex("FollowRequests", ["requesterId"]);
    await queryInterface.addIndex("FollowRequests", ["targetId"]);
    await queryInterface.addIndex(
      "FollowRequests",
      ["requesterId", "targetId"],
      {
        unique: true,
      }
    );
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("FollowRequests");
  },
};
