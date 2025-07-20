"use strict";
const { PostService } = require("../services");
const { Enums } = require("../utils/common");
const { STATUS_CODE } = Enums;

const postService = new PostService();

class PostController {
  async createPost(req, res) {
    try {
      const response = await postService.createPost({
        userId: req.user.id,
        caption: req.body.caption,
      });
      return res.status(STATUS_CODE.CREATED).json(response);
    } catch (error) {
      return res
        .status(error.statusCode || STATUS_CODE.INTERNAL_SERVER_ERROR)
        .json({
          error: error.message,
        });
    }
  }

  async getPost(req, res) {
    try {
      const response = await postService.getPostById(req.params.id);
      return res.status(STATUS_CODE.OK).json(response);
    } catch (error) {
      return res
        .status(error.statusCode || STATUS_CODE.INTERNAL_SERVER_ERROR)
        .json({
          error: error.message,
        });
    }
  }

  async getAllPosts(req, res) {
    try {
      const response = await postService.getAllPosts({
        userId: req.query.userId,
      });
      return res.status(STATUS_CODE.OK).json(response);
    } catch (error) {
      return res
        .status(error.statusCode || STATUS_CODE.INTERNAL_SERVER_ERROR)
        .json({
          error: error.message,
        });
    }
  }

  async updatePost(req, res) {
    try {
      const response = await postService.updatePost(req.params.id, {
        userId: req.user.id,
        caption: req.body.caption,
      });
      return res.status(STATUS_CODE.OK).json(response);
    } catch (error) {
      return res
        .status(error.statusCode || STATUS_CODE.INTERNAL_SERVER_ERROR)
        .json({
          error: error.message,
        });
    }
  }

  async deletePost(req, res) {
    try {
      const response = await postService.deletePost(req.params.id, req.user.id);
      return res.status(STATUS_CODE.OK).json(response);
    } catch (error) {
      return res
        .status(error.statusCode || STATUS_CODE.INTERNAL_SERVER_ERROR)
        .json({
          error: error.message,
        });
    }
  }

  async likePost(req, res) {
    try {
      const response = await postService.likePost(
        req.params.postId,
        req.user.id
      );
      return res.status(STATUS_CODE.OK).json(response);
    } catch (error) {
      return res
        .status(error.statusCode || STATUS_CODE.INTERNAL_SERVER_ERROR)
        .json({
          error: error.message,
        });
    }
  }

  async savePost(req, res) {
    try {
      const response = await postService.savePost(
        req.params.postId,
        req.user.id
      );
      return res.status(STATUS_CODE.OK).json(response);
    } catch (error) {
      return res
        .status(error.statusCode || STATUS_CODE.INTERNAL_SERVER_ERROR)
        .json({
          error: error.message,
        });
    }
  }

  async archivePost(req, res) {
    try {
      const response = await postService.archivePost(
        req.params.postId,
        req.user.id
      );
      return res.status(STATUS_CODE.OK).json(response);
    } catch (error) {
      return res
        .status(error.statusCode || STATUS_CODE.INTERNAL_SERVER_ERROR)
        .json({
          error: error.message,
        });
    }
  }
}

module.exports = new PostController();
