const express = require("express");
const router = express.Router();
const { UserController } = require("../controllers");
const { UserMiddleware } = require("../middlewares");
const authenticate = require("../middlewares/auth-middleware");

router.get(
  "/follow/requests",
  authenticate,
  UserController.getAllFollowRequests
);

router.patch(
  "/follow/requests",
  authenticate,
  UserMiddleware.validateManageFollowRequest,
  UserController.manageFollowRequest
);

router.get("/:userId", authenticate, UserController.getUserData);

router.get("/", authenticate, UserController.getUserData);

router.post("/followers", authenticate, UserController.getAllFollowers);

router.post("/following", authenticate, UserController.getAllFollowingUsers);

router.post(
  "/follow",
  authenticate,
  UserMiddleware.validateFollowRequest,
  UserController.toggleFollow
);

module.exports = router;
