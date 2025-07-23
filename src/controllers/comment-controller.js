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
}

module.exports = new CommentController();
