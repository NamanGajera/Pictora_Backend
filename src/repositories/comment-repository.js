const { Comment, CommentLike, Post, sequelize } = require("../models");
const CrudRepository = require("./crud-repository");
const { Sequelize, Op, where } = require("sequelize");
const { Enums, Messages } = require("../utils/common");
const AppError = require("../utils/errors/app-error");

const { STATUS_CODE } = Enums;

class CommentRepository extends CrudRepository {
  constructor() {
    super(Comment);
  }

  #formatCommentResponse(comments) {
    if (Array.isArray(comments)) {
      return comments.map((comment) => this.#formatSingleComment(comment));
    }
    return this.#formatSingleComment(comments);
  }

  #formatSingleComment(comment) {
    const data = comment.get({ plain: true });

    const isLiked = comment.get("isLiked");
    const repliesCount = comment.get("repliesCount");

    return {
      ...data,
      isLiked: Boolean(isLiked),
      repliesCount: Number(repliesCount),
      user: data.user
        ? {
          ...data.user,
          profile: data.user.profile,
        }
        : null,
    };
  }

  #buildBaseCommentQuery(userId) {
    if (!userId) {
      throw new AppError(
        Messages.REQUIRED_FIELD("User ID"),
        STATUS_CODE.BAD_REQUEST
      );
    }

    return {
      include: [
        {
          association: "user",
          attributes: ["id", "userName", "fullName"],
          include: {
            association: "profile",
            attributes: ["id", "userId", "profilePicture", "isPrivate"],
          },
        },
      ],
    };
  }
  async getAllComments(postId, userId, { skip = 0, take = 10 } = {}) {
    try {
      const baseQuery = this.#buildBaseCommentQuery(userId);

      const { count, rows: comments } = await Comment.findAndCountAll({
        ...baseQuery,
        distinct: true,
        where: {
          postId,
          parentCommentId: null,
        },
        attributes: {
          include: [
            [
              Sequelize.literal(`(
              SELECT COUNT(*) FROM Comments AS replies
              WHERE replies.parentCommentId = Comment.id
            )`),
              "repliesCount",
            ],
            [
              Sequelize.literal(`EXISTS (
              SELECT 1 FROM CommentLikes
              WHERE CommentLikes.commentId = Comment.id
              AND CommentLikes.userId = ${sequelize.escape(userId)}
            )`),
              "isLiked",
            ],
          ],
        },

        offset: skip,
        limit: take,
        order: [
          ["isPinned", "DESC"],
          ["createdAt", "DESC"],
        ],
      });

      return {
        comments: this.#formatCommentResponse(comments),
        total: count,
      };
    } catch (error) {
      throw error;
    }
  }

  async getCommentReplies(commentId, userId, { skip = 0, take = 10 } = {}) {
    const baseQuery = this.#buildBaseCommentQuery(userId);

    const { count, rows: replies } = await Comment.findAndCountAll({
      ...baseQuery,
      distinct: true,
      where: {
        parentCommentId: commentId,
      },
      attributes: {
        include: [
          [
            Sequelize.literal(`EXISTS (
              SELECT 1 FROM CommentLikes
              WHERE CommentLikes.commentId = Comment.id
              AND CommentLikes.userId = ${sequelize.escape(userId)}
            )`),
            "isLiked",
          ],
        ],
      },
      offset: skip,
      limit: take,
      order: [["createdAt", "ASC"]],
    });

    return {
      replies: this.#formatCommentResponse(replies),
      total: count,
    };
  }

  async toggleCommentLike(data, transaction) {
    const { userId, commentId, isLike } = data;
    try {
      const existing = await CommentLike.findOne({
        where: { userId, commentId },
        transaction,
      });

      const comment = await Comment.findOne({
        where: { id: commentId },
        transaction,
      });

      if (!comment) {
        throw new AppError(Messages.COMMENT_NOT_FOUND, STATUS_CODE.NOT_FOUND);
      }

      if (isLike) {
        if (!existing) {
          await CommentLike.create({ userId, commentId }, { transaction });
          await comment.increment("likeCount", { by: 1, transaction });
          await comment.reload({ transaction });
          return {
            isLiked: true,
            message: Messages.COMMENT_LIKED,
            likeCount: comment.likeCount,
          };
        }
        return {
          isLiked: true,
          message: Messages.COMMENT_ALREADY_LIKED,
          likeCount: comment.likeCount,
        };
      } else {
        if (existing) {
          await CommentLike.destroy({
            where: { userId, commentId },
            transaction,
          });
          await comment.decrement("likeCount", { by: 1, transaction });
          await comment.reload({ transaction });
          return {
            isLiked: false,
            message: Messages.COMMENT_UNLIKED,
            likeCount: comment.likeCount,
          };
        }
        return {
          isLiked: false,
          message: Messages.COMMENT_UNLIKED,
          likeCount: comment.likeCount,
        };
      }
    } catch (error) {
      throw error;
    }
  }

  async togglePinComment(commentId, shouldPin, transaction) {
    const comment = await Comment.findOne({
      where: { id: commentId },
      transaction,
    });

    if (!comment) {
      throw new AppError(Messages.COMMENT_NOT_FOUND, STATUS_CODE.NOT_FOUND);
    }

    if (comment.isPinned === shouldPin) {
      throw new AppError(
        shouldPin
          ? Messages.COMMENT_ALREADY_PINNED
          : Messages.COMMENT_NOT_PINNED,
        STATUS_CODE.BAD_REQUEST
      );
    }

    await comment.update({ isPinned: shouldPin }, { transaction });
    await comment.reload();
    return comment;
  }

  async createComment(data, transaction) {
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
      const post = await Post.findOne({
        where: { id: postId },
        transaction,
      });

      if (!post) {
        throw new AppError(Messages.POST_NOT_FOUND, STATUS_CODE.NOT_FOUND);
      }

      const comment = await Comment.create(commentData);

      await post.increment("commentCount", { by: 1 });
      await post.reload();
      return comment;
    } catch (error) {
      throw error;
    }
  }

  async deleteComment(commentId, transaction) {
    try {
      const comment = await Comment.findOne({
        where: { id: commentId },
        transaction,
      });
      if (!comment) {
        throw new AppError(Messages.COMMENT_NOT_FOUND, STATUS_CODE.NOT_FOUND);
      }
      const postId = comment.postId;

      const repliesCount = await Comment.count({
        where: { parentCommentId: commentId },
        transaction,
      });
      const totalComment = repliesCount + 1;

      const post = await Post.findOne({
        where: { id: postId },
        transaction,
      });

      await Comment.destroy({ where: { id: commentId }, transaction });

      await post.decrement("commentCount", { by: totalComment });
      await post.reload();

      return true;
    } catch (error) {
      throw error;
    }
  }

  async getUserComment(userId, { skip = 0, take = 10 } = {}) {
    try {
      const baseQuery = this.#buildBaseCommentQuery(userId);

      const { count, rows: comments } = await Comment.findAndCountAll({
        ...baseQuery,
        distinct: true,
        where: {
          userId,
        },
        include: [
          {
            association: "post",
            attributes: ["id", "caption", "userId"],
            include: [
              {
                association: "mediaData",
                attributes: ["id", "mediaUrl", "thumbnail", "mediaType"],
              },
              {
                association: "userData",
                attributes: ["id", "fullName", "userName"],
                include: {
                  association: "profile",
                  attributes: ["profilePicture"]
                }
              },
            ],
          },

        ],
        attributes: {
          include: [
            [
              Sequelize.literal(`(
              SELECT COUNT(*) FROM Comments AS replies
              WHERE replies.parentCommentId = Comment.id
            )`),
              "repliesCount",
            ],
            [
              Sequelize.literal(`EXISTS (
              SELECT 1 FROM CommentLikes
              WHERE CommentLikes.commentId = Comment.id
              AND CommentLikes.userId = ${sequelize.escape(userId)}
            )`),
              "isLiked",
            ],
          ],
        },

        offset: skip,
        limit: take,
        order: [
          ["isPinned", "DESC"],
          ["createdAt", "DESC"],
        ],
      });

      return {
        comments: this.#formatCommentResponse(comments),
        total: count,
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = CommentRepository;
