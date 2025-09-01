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
    const transaction = await db.sequelize.transaction();

    try {
      const comment = await commentRepository.createComment(data, transaction);
      await transaction.commit();
      return comment;
    } catch (error) {
      await transaction.rollback();
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

  async getPostComments(data) {
    const { postId, userId, skip = 0, take = 10 } = data;
    console.log("data->", data);
    try {
      return await commentRepository.getAllComments(postId, userId, {
        skip,
        take,
      });
    } catch (error) {
      this.#handleError(error);
    }
  }

  async getCommentReplies(data) {
    const { commentId, userId, skip = 0, take = 10 } = data;
    try {
      return await commentRepository.getCommentReplies(commentId, userId, {
        skip,
        take,
      });
    } catch (error) {
      this.#handleError(error);
    }
  }

  async deleteComment(data) {
    const { commentId } = data;
    const transaction = await db.sequelize.transaction();

    try {
      await commentRepository.deleteComment(commentId, transaction);
      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      this.#handleError(error);
    }
  }

  async togglePinComment(data) {
    const transaction = await db.sequelize.transaction();
    try {
      const { commentId, userId, shouldPin } = data;

      const comment = await db.Comment.findOne({
        where: { id: commentId },
        include: {
          model: db.Post,
          attributes: ["userId"],
          as: "post",
        },
        transaction,
      });

      if (!comment) {
        throw new AppError(Messages.COMMENT_NOT_FOUND, STATUS_CODE.NOT_FOUND);
      }

      if (comment.post.userId !== userId) {
        throw new AppError(Messages.NOT_AUTHORIZED, STATUS_CODE.FORBIDDEN);
      }

      const updatedComment = await commentRepository.togglePinComment(
        commentId,
        shouldPin,
        transaction
      );

      await transaction.commit();
      return updatedComment;
    } catch (error) {
      await transaction.rollback();
      this.#handleError(error);
    }
  }

  async getUserComments(data) {
    const { userId, skip = 0, take = 10 } = data;
    try {
      return await commentRepository.getUserComment(userId, {
        skip,
        take,
      });
    } catch (error) {
      this.#handleError(error);
    }
  }
}

module.exports = new CommentService();
