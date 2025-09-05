"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Posts", "repostCount", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addIndex("Posts", ["repostCount"]);
  },
  async down(queryInterface) {
    await queryInterface.removeColumn("Posts", "repostCount");
  },
};
