const db = require("../models");
const { CommentRepository } = require("../repositories");
const { Messages, Enums } = require("../utils/common");
const { BaseError } = require("sequelize");
const AppError = require("../utils/errors/app-error");

const { STATUS_CODE } = Enums;
const commentRepository = new CommentRepository();

class CommentService {
  #handleError(error) {
    console.log("Error -->", error);
    if (error instanceof AppError) {
      throw error;
    }
    if (error instanceof BaseError) {
      const message =
        error.errors?.[0]?.message || error.message || Messages.SOMETHING_WRONG;
      throw new AppError(message, STATUS_CODE.BAD_REQUEST);
    }
    throw new AppError(
      Messages.SOMETHING_WRONG,
      STATUS_CODE.INTERNAL_SERVER_ERROR
    );
  }

  async addComment(data) {
    try {
      const { postId, userId, commentText, parentCommentId } = data;
      const commentData = {
        postId,
        userId,
        comment: commentText,
      };
      if (parentCommentId) {
        commentData.parentCommentId = parentCommentId;
      }
      const comment = await commentRepository.create(commentData);
      return comment;
    } catch (error) {
      this.#handleError(error);
    }
  }
  async toggleCommentLike(data) {
    const transaction = await db.sequelize.transaction();

    const { userId, commentId, isLike } = data;
    try {
      const comment = await commentRepository.get(commentId);

      if (!comment) {
        throw new AppError(Messages.COMMENT_NOT_FOUND, STATUS_CODE.NOT_FOUND);
      }
      const response = await commentRepository.toggleCommentLike(
        data,
        transaction
      );
      await transaction.commit();
      return response;
    } catch (error) {
      await transaction.rollback();
      this.#handleError(error);
    }
  }
}

module.exports = new CommentService();
