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
  fileUpload.fields([
    { name: "media", maxCount: 10 },
    { name: "thumbnails", maxCount: 10 },
  ]),
  PostController.createPost
);
router.get("/", authenticate, PostController.getAllPosts);
router.get("/like", authenticate, PostController.getLikedPosts);
router.get("/save", authenticate, PostController.getSavedPosts);
router.get("/archive", authenticate, PostController.getArchivedPosts);
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

router.delete("/:postId", authenticate, PostController.deletePost);
module.exports = router;
