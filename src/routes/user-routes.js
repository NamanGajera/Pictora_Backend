const express = require("express");
const router = express.Router();
const { UserController } = require("../controllers");
const { UserMiddleware } = require("../middlewares");

router.post(
  "/login",
  UserMiddleware.validateLoginRequest,
  UserController.login
);
router.post(
  "/register",
  UserMiddleware.validateRegisterRequest,
  UserController.register
);

module.exports = router;
