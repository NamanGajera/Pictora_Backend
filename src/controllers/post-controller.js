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
      const mediaFiles = req.files?.media || [];
      const thumbnailFiles = req.files?.thumbnails || [];
      console.log("Post data in controller -> ", mediaFiles);
      console.log("Post data in thumbnails -> ", thumbnailFiles);
      const response = await PostService.createPost({
        userId,
        caption,
        mediaFiles,
        thumbnailFiles,
      });
      SuccessResponse.data = response;
      SuccessResponse.message = Messages.POST_CREATED;
      return res.status(STATUS_CODE.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = error.message;
      ErrorResponse.statusCode = error.statusCode;
      return res
        .status(error.statusCode || STATUS_CODE.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
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
      ErrorResponse.message = error.message;
      ErrorResponse.statusCode = error.statusCode;
      return res
        .status(error.statusCode || STATUS_CODE.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async getAllPosts(req, res) {
    try {
      const response = await PostService.getAllPosts({
        userId: req.user.id,
        filterUserId: req.body.userId,
        skip: req.body.skip,
        take: req.body.take,
      });
      SuccessResponse.data = response.posts;
      SuccessResponse.message = Messages.FETCHED_SUCCESS;
      const totalData = response.total;
      return res
        .status(STATUS_CODE.OK)
        .json({ ...SuccessResponse, total: totalData });
    } catch (error) {
      ErrorResponse.message = error.message;
      ErrorResponse.statusCode = error.statusCode;
      return res
        .status(error.statusCode || STATUS_CODE.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async getAllReel(req, res) {
    try {
      const response = await PostService.getAllReels({
        userId: req.user.id,
        filterUserId: req.body.userId,
        skip: req.body.skip,
        take: req.body.take,
        seedData: req.body.seed,
      });
      SuccessResponse.data = response.posts;
      SuccessResponse.message = Messages.FETCHED_SUCCESS;
      const totalData = response.total;
      const seed = response.seed;
      return res
        .status(STATUS_CODE.OK)
        .json({ ...SuccessResponse, total: totalData, seed, });
    } catch (error) {
      ErrorResponse.message = error.message;
      ErrorResponse.statusCode = error.statusCode;
      return res
        .status(error.statusCode || STATUS_CODE.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async getLikedPosts(req, res) {
    try {
      const response = await PostService.getLikedPosts({
        userId: req.user.id,
        skip: req.body.skip,
        take: req.body.take,
      });
      SuccessResponse.data = response.posts;
      SuccessResponse.message = Messages.FETCHED_SUCCESS;
      const totalData = response.total;
      return res
        .status(STATUS_CODE.OK)
        .json({ ...SuccessResponse, total: totalData });
    } catch (error) {
      ErrorResponse.message = error.message;
      ErrorResponse.statusCode = error.statusCode;
      return res
        .status(error.statusCode || STATUS_CODE.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }
  async getSavedPosts(req, res) {
    try {
      const response = await PostService.getSavedPosts({
        userId: req.user.id,
        skip: req.body.skip,
        take: req.body.take,
      });
      SuccessResponse.data = response.posts;
      SuccessResponse.message = Messages.FETCHED_SUCCESS;
      const totalData = response.total;
      return res
        .status(STATUS_CODE.OK)
        .json({ ...SuccessResponse, total: totalData });
    } catch (error) {
      ErrorResponse.message = error.message;
      ErrorResponse.statusCode = error.statusCode;
      return res
        .status(error.statusCode || STATUS_CODE.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }
  async getArchivedPosts(req, res) {
    try {
      const response = await PostService.getArchivedPosts({
        userId: req.user.id,
        skip: req.body.skip,
        take: req.body.take,
      });
      SuccessResponse.data = response.posts;
      SuccessResponse.message = Messages.FETCHED_SUCCESS;
      const totalData = response.total;
      return res
        .status(STATUS_CODE.OK)
        .json({ ...SuccessResponse, total: totalData });
    } catch (error) {
      ErrorResponse.message = error.message;
      ErrorResponse.statusCode = error.statusCode;
      return res
        .status(error.statusCode || STATUS_CODE.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
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
      ErrorResponse.statusCode = error.statusCode;
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
      ErrorResponse.statusCode = error.statusCode;
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
      ErrorResponse.statusCode = error.statusCode;
      return res
        .status(error.statusCode || STATUS_CODE.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }
  async deletePost(req, res) {
    try {
      await PostService.deletePost({
        postId: req.params.postId,
        userId: req.user.id,
      });
      return res
        .status(STATUS_CODE.OK)
        .json({ statusCode: STATUS_CODE.OK, message: Messages.POST_DELETED });
    } catch (error) {
      ErrorResponse.message = error.message;
      ErrorResponse.statusCode = error.statusCode;
      return res
        .status(error.statusCode || STATUS_CODE.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }
  async getAllUserWhoLikePost(req, res) {
    try {
      const response = await PostService.getAllUserWhoLikePost({
        postId: req.params.postId,
        skip: req.body.skip,
        take: req.body.take,
        userId: req.user.id,
      });
      SuccessResponse.data = response.users;
      SuccessResponse.message = Messages.FETCHED_SUCCESS;
      const totalData = response.total;
      return res
        .status(STATUS_CODE.OK)
        .json({ ...SuccessResponse, total: totalData });
    } catch (error) {
      ErrorResponse.message = error.message;
      ErrorResponse.statusCode = error.statusCode;
      return res
        .status(error.statusCode || STATUS_CODE.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }
}

module.exports = new PostController();
