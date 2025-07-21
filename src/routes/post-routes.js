const express = require("express");
const router = express.Router();
const { PostController } = require("../controllers");
const { fileUpload } = require("../middlewares/flie-upload-middleware");
const { PostMiddleware } = require("../middlewares");
const authenticate = require("../middlewares/auth-middleware");

// Post CRUD routes
router.post(
  "/",
  authenticate,
  fileUpload.array("media", 10),
  PostController.createPost
);
router.get("/", authenticate, PostController.getAllPosts);
router.get("/:id", authenticate, PostController.getPost);

// Post interaction routes
router.post(
  "/like",
  authenticate,
  PostMiddleware.validatePostLikeRequest,
  PostController.togglePostLike
);
router.post(
  "/save",
  authenticate,
  PostMiddleware.validatePostSaveRequest,
  PostController.togglePostSave
);
router.post(
  "/archive",
  authenticate,
  PostMiddleware.validatePostArchiveRequest,
  PostController.togglePostArchive
);

module.exports = router;
