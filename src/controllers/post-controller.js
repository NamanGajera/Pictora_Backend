const { PostService } = require("../services");
const {
  SuccessResponse,
  Enums,
  Messages,
  ErrorResponse,
} = require("../utils/common");

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
      SuccessResponse.data = response;
      SuccessResponse.message = Messages.POST_CREATED;
      return res.status(STATUS_CODE.OK).json(SuccessResponse);
    } catch (error) {
      console.error("CreatePost Error:", error);
      return res
        .status(error.statusCode || STATUS_CODE.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  async getPost(req, res) {
    try {
      const response = await PostService.getPostById({
        userId: req.user.id,
        postId: req.params.id,
      });
      SuccessResponse.data = response;
      return res.status(STATUS_CODE.OK).json(SuccessResponse);
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
        userId: req.user.id,
      });
      SuccessResponse.data = response;
      return res.status(STATUS_CODE.OK).json(SuccessResponse);
    } catch (error) {
      return res
        .status(error.statusCode || STATUS_CODE.INTERNAL_SERVER_ERROR)
        .json({
          error: error.message,
        });
    }
  }
  async togglePostLike(req, res) {
    try {
      const response = await PostService.togglePostLike({
        userId: req.user.id,
        postId: req.body.postId,
        isLike: req.body.isLike,
      });
      return res.status(STATUS_CODE.OK).json(response);
    } catch (error) {
      ErrorResponse.message = error.message;
      return res
        .status(error.statusCode || STATUS_CODE.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async togglePostSave(req, res) {
    try {
      const response = await PostService.togglePostSave({
        userId: req.user.id,
        postId: req.body.postId,
        isSave: req.body.isSave,
      });
      return res.status(STATUS_CODE.OK).json(response);
    } catch (error) {
      ErrorResponse.message = error.message;
      return res
        .status(error.statusCode || STATUS_CODE.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }
  async togglePostArchive(req, res) {
    try {
      const response = await PostService.togglePostArchive({
        userId: req.user.id,
        postId: req.body.postId,
        isArchive: req.body.isArchive,
      });
      return res.status(STATUS_CODE.OK).json(response);
    } catch (error) {
      ErrorResponse.message = error.message;
      return res
        .status(error.statusCode || STATUS_CODE.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }
}

module.exports = new PostController();
