const { PostService } = require("../services");
const { Enums } = require("../utils/common");
const { STATUS_CODE } = Enums;


class PostController {
  async createPost(req, res) {
    try {
      const { caption } = req.body;
      const userId = req.user.id;
      const mediaFiles = req.files || [];

      const response = await PostService.createPost({
        userId,
        caption,
        mediaFiles,
      });

      return res.status(STATUS_CODE.CREATED).json(response);
    } catch (error) {
      console.error("CreatePost Error:", error);
      return res
        .status(error.statusCode || STATUS_CODE.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  async getPost(req, res) {
    try {
      const response = await PostService.getPostById(req.params.id);
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
      const response = await PostService.getAllPosts({
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
      const response = await PostService.updatePost(req.params.id, {
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
      const response = await PostService.deletePost(req.params.id, req.user.id);
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
      const response = await PostService.likePost(
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
      const response = await PostService.savePost(
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
      const response = await PostService.archivePost(
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
