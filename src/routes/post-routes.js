"use strict";
const express = require("express");
const router = express.Router();
const { PostController } = require("../controllers");
const { AuthMiddleware } = require("../middlewares");

router.use(AuthMiddleware.authenticate);

// Post CRUD routes
router.post("/", PostController.createPost);
router.get("/", PostController.getAllPosts);
router.get("/:id", PostController.getPost);
router.put("/:id", PostController.updatePost);
router.delete("/:id", PostController.deletePost);

// Post interaction routes
router.post("/:postId/like", PostController.likePost);
router.post("/:postId/save", PostController.savePost);
router.post("/:postId/archive", PostController.archivePost);

module.exports = router;
