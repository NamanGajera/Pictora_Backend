const { CommentService } = require("../services");
const {
  SuccessResponse,
  Enums,
  Messages,
  ErrorResponse,
} = require("../utils/common");

const { STATUS_CODE } = Enums;

class CommentController {
  async addComment(req, res) {
    try {
      const { postId, comment, parentCommentId } = req.body;
      const commentData = {
        postId: postId,
        userId: req.user.id,
        commentText: comment,
      };
      if (parentCommentId) {
        commentData.parentCommentId = parentCommentId;
      }
      const response = await CommentService.addComment(commentData);
      SuccessResponse.data = response;
      SuccessResponse.message = Messages.COMMENT_CREATED;
      return res.status(STATUS_CODE.OK).json(response);
    } catch (error) {
      ErrorResponse.message = error.message;
      ErrorResponse.statusCode = error.statusCode;
      return res
        .status(error.statusCode || STATUS_CODE.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }
  async toggleCommentLike(req, res) {
    try {
      const response = await CommentService.toggleCommentLike({
        userId: req.user.id,
        commentId: req.body.commentId,
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

  async getPostComments(req, res) {
    try {
      const response = await CommentService.getPostComments({
        userId: req.user.id,
        postId: req.body.postId,
        skip: req.body.skip,
        take: req.body.take,
      });
      SuccessResponse.data = response.comments;
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

  async getCommentReplies(req, res) {
    try {
      const response = await CommentService.getCommentReplies({
        userId: req.user.id,
        commentId: req.body.commentId,
        skip: req.body.skip,
        take: req.body.take,
      });
      SuccessResponse.data = response.replies;
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

  async deleteComment(req, res) {
    try {
      await CommentService.deleteComment({ commentId: req.params.commentId });

      return res
        .status(STATUS_CODE.OK)
        .json({ message: Messages.COMMENT_DELETED });
    } catch (error) {
      ErrorResponse.message = error.message;
      ErrorResponse.statusCode = error.statusCode;
      return res
        .status(error.statusCode || STATUS_CODE.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async togglePinComment(req, res) {
    try {
      const { commentId } = req.params;
      const userId = req.user.id;
      const { shouldPin } = req.body;

      const comment = await CommentService.togglePinComment({
        commentId,
        userId,
        shouldPin,
      });

      return res.status(200).json({
        success: true,
        message: `Comment ${shouldPin ? "pinned" : "unpinned"} successfully`,
        data: comment,
      });
    } catch (error) {
      ErrorResponse.message = error.message;
      ErrorResponse.statusCode = error.statusCode;
      return res
        .status(error.statusCode || STATUS_CODE.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async getUserComment(req, res) {
    try {
      const response = await CommentService.getUserComments({
        userId: req.user.id,
        skip: req.body.skip,
        take: req.body.take,
      });
      SuccessResponse.data = response.comments;
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

module.exports = new CommentController();
