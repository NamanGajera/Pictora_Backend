const express = require("express");
const router = express.Router();
const { PostController } = require("../controllers");
const { fileUpload } = require("../middlewares/flie-upload-middleware");
const authenticate = require("../middlewares/auth-middleware");


// Post CRUD routes
router.post("/", authenticate, fileUpload.array("media", 10), PostController.createPost);
router.get("/", authenticate, PostController.getAllPosts);
router.get("/:id", authenticate, PostController.getPost);
router.put("/:id", authenticate, PostController.updatePost);
router.delete("/:id", authenticate, PostController.deletePost);

// Post interaction routes
router.post("/:postId/like", authenticate, PostController.likePost);
router.post("/:postId/save", authenticate, PostController.savePost);
router.post("/:postId/archive", authenticate, PostController.archivePost);

module.exports = router;
