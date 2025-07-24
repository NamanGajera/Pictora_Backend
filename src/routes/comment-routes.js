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

router.post(
  "/",
  CommentMiddleware.validateGetPostCommentRequest,
  authenticate,
  CommentController.getPostComments
);

router.post(
  "/replies",
  CommentMiddleware.validateGetCommentRepliesRequest,
  authenticate,
  CommentController.getCommentReplies
);

router.delete("/:commentId", authenticate, CommentController.deleteComment);

router.put("/:commentId/pin", authenticate, CommentController.togglePinComment);

module.exports = router;
