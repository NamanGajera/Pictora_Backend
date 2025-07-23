const { Comment, CommentLike } = require("../models");
const CrudRepository = require("./crud-repository");
const { Sequelize } = require("sequelize");
const { Enums, Messages } = require("../utils/common");
const AppError = require("../utils/errors/app-error");

const { STATUS_CODE } = Enums;

class CommentRepository extends CrudRepository {
  constructor() {
    super(Comment);
  }

  async toggleCommentLike(data, transaction) {
    const { userId, commentId, isLike } = data;
    try {
      const existing = await CommentLike.findOne({
        where: { userId, commentId },
      });

      const comment = await Comment.findOne({ where: { id: commentId } });

      if (!comment) {
        throw new AppError(Messages.COMMENT_NOT_FOUND, STATUS_CODE.NOT_FOUND);
      }

      if (isLike) {
        if (!existing) {
          await CommentLike.create({ userId, commentId }, { transaction });
          await comment.increment("likeCount", { by: 1, transaction });
          await comment.reload();
          return { isLiked: true, message: Messages.COMMENT_LIKED };
        }
        return { isLiked: true, message: Messages.COMMENT_ALREADY_LIKED };
      } else {
        if (existing) {
          await CommentLike.destroy({
            where: { userId, commentId },
            transaction,
          });
          await comment.decrement("likeCount", { by: 1, transaction });
          await comment.reload();
          return { isLiked: false, message: Messages.COMMENT_UNLIKED };
        }
        return { isLiked: false, message: Messages.COMMENT_UNLIKED };
      }
    } catch (error) {
      throw error;
    }
  }
}

module.exports = CommentRepository;
