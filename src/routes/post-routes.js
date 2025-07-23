const express = require("express");
const router = express.Router();
const { PostController } = require("../controllers");
const { fileUpload } = require("../middlewares/flie-upload-middleware");
const { PostMiddleware } = require("../middlewares");
const authenticate = require("../middlewares/auth-middleware");

router.post(
  "/create",
  authenticate,
  fileUpload.fields([
    { name: "media", maxCount: 10 },
    { name: "thumbnails", maxCount: 10 },
  ]),
  PostController.createPost
);
router.post("/", authenticate, PostController.getAllPosts);
router.get("/:id", authenticate, PostController.getPost);

router.post(
  "/like",
  authenticate,
  PostMiddleware.validatePostLikeRequest,
  PostController.togglePostLike
);
router.post("/liked-post", authenticate, PostController.getLikedPosts);
router.post(
  "/liked-by/:postId",
  authenticate,
  PostController.getAllUserWhoLikePost
);

router.post(
  "/save",
  authenticate,
  PostMiddleware.validatePostSaveRequest,
  PostController.togglePostSave
);
router.post("/saved-post", authenticate, PostController.getSavedPosts);

router.post(
  "/archive",
  authenticate,
  PostMiddleware.validatePostArchiveRequest,
  PostController.togglePostArchive
);
router.post("/archived-post", authenticate, PostController.getArchivedPosts);

router.delete("/:postId", authenticate, PostController.deletePost);

module.exports = router;
