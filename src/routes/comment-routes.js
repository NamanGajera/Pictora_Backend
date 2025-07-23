const express = require("express");
const router = express.Router();
const { CommentController } = require("../controllers");
const { CommentMiddleware } = require("../middlewares");
const authenticate = require("../middlewares/auth-middleware");

router.post(
  "/create",
  CommentMiddleware.validateCreateCommentRequest,
  authenticate,
  CommentController.addComment
);

router.post(
  "/like",
  CommentMiddleware.validateCommentLikeRequest,
  authenticate,
  CommentController.toggleCommentLike
);

module.exports = router;
