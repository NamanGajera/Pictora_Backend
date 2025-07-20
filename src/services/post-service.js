"use strict";
const db = require("../models");
const {
  PostRepository,
  PostLikeRepository,
  PostSaveRepository,
  PostArchiveRepository,
} = require("../repositories");
const { Messages, Enums } = require("../utils/common");
const { BaseError } = require("sequelize");
const AppError = require("../utils/errors/app-error");

const { STATUS_CODE } = Enums;
const postRepository = new PostRepository();
const postLikeRepository = new PostLikeRepository();
const postSaveRepository = new PostSaveRepository();
const postArchiveRepository = new PostArchiveRepository();

class PostService {
  async createPost(data) {
    try {
      const post = await postRepository.create({
        userId: data.userId,
        caption: data.caption,
      });
      return post;
    } catch (error) {
      console.log("Create Post Error -->>", error);
      if (error instanceof AppError) {
        throw error;
      }
      if (error instanceof BaseError) {
        const message =
          error.errors?.[0]?.message ||
          error.message ||
          Messages.SOMETHING_WRONG;
        throw new AppError(message, STATUS_CODE.BAD_REQUEST);
      }
      throw new AppError(
        Messages.SOMETHING_WRONG,
        STATUS_CODE.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getPostById(id) {
    try {
      const post = await postRepository.get(id);
      if (!post) {
        throw new AppError(Messages.POST_NOT_FOUND, STATUS_CODE.NOT_FOUND);
      }
      return post;
    } catch (error) {
      console.log("Get Post Error -->>", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        Messages.SOMETHING_WRONG,
        STATUS_CODE.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getAllPosts(query) {
    try {
      const filter = {};
      if (query.userId) filter.userId = query.userId;

      const posts = await postRepository.getAll(filter);
      return posts;
    } catch (error) {
      console.log("Get All Posts Error -->>", error);
      throw new AppError(
        Messages.SOMETHING_WRONG,
        STATUS_CODE.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updatePost(id, data) {
    const transaction = await db.sequelize.transaction();
    try {
      const post = await postRepository.get(id);
      if (!post) {
        throw new AppError(Messages.POST_NOT_FOUND, STATUS_CODE.NOT_FOUND);
      }

      if (post.userId !== data.userId) {
        throw new AppError(Messages.UNAUTHORIZED, STATUS_CODE.UNAUTHORIZED);
      }

      const updatedPost = await postRepository.update(
        id,
        { caption: data.caption },
        transaction
      );
      await transaction.commit();
      return updatedPost;
    } catch (error) {
      await transaction.rollback();
      console.log("Update Post Error -->>", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        Messages.SOMETHING_WRONG,
        STATUS_CODE.INTERNAL_SERVER_ERROR
      );
    }
  }

  async deletePost(id, userId) {
    const transaction = await db.sequelize.transaction();
    try {
      const post = await postRepository.get(id);
      if (!post) {
        throw new AppError(Messages.POST_NOT_FOUND, STATUS_CODE.NOT_FOUND);
      }

      if (post.userId !== userId) {
        throw new AppError(Messages.UNAUTHORIZED, STATUS_CODE.UNAUTHORIZED);
      }

      await postRepository.destroy(id, transaction);
      await transaction.commit();
      return { success: true };
    } catch (error) {
      await transaction.rollback();
      console.log("Delete Post Error -->>", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        Messages.SOMETHING_WRONG,
        STATUS_CODE.INTERNAL_SERVER_ERROR
      );
    }
  }

  async likePost(postId, userId) {
    const transaction = await db.sequelize.transaction();
    try {
      const existingLike = await postLikeRepository.findOne({ postId, userId });
      if (existingLike) {
        throw new AppError(Messages.ALREADY_LIKED, STATUS_CODE.BAD_REQUEST);
      }

      await postLikeRepository.create({ postId, userId }, transaction);
      await postRepository.incrementLikeCount(postId, transaction);
      await transaction.commit();

      return { success: true };
    } catch (error) {
      await transaction.rollback();
      console.log("Like Post Error -->>", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        Messages.SOMETHING_WRONG,
        STATUS_CODE.INTERNAL_SERVER_ERROR
      );
    }
  }

  async savePost(postId, userId) {
    const transaction = await db.sequelize.transaction();
    try {
      const existingSave = await postSaveRepository.findOne({ postId, userId });
      if (existingSave) {
        throw new AppError(Messages.ALREADY_SAVED, STATUS_CODE.BAD_REQUEST);
      }

      await postSaveRepository.create({ postId, userId }, transaction);
      await postRepository.incrementSaveCount(postId, transaction);
      await transaction.commit();

      return { success: true };
    } catch (error) {
      await transaction.rollback();
      console.log("Save Post Error -->>", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        Messages.SOMETHING_WRONG,
        STATUS_CODE.INTERNAL_SERVER_ERROR
      );
    }
  }

  async archivePost(postId, userId) {
    const transaction = await db.sequelize.transaction();
    try {
      const existingArchive = await postArchiveRepository.findOne({
        postId,
        userId,
      });
      if (existingArchive) {
        throw new AppError(Messages.ALREADY_ARCHIVED, STATUS_CODE.BAD_REQUEST);
      }

      await postArchiveRepository.create({ postId, userId }, transaction);
      await transaction.commit();

      return { success: true };
    } catch (error) {
      await transaction.rollback();
      console.log("Archive Post Error -->>", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        Messages.SOMETHING_WRONG,
        STATUS_CODE.INTERNAL_SERVER_ERROR
      );
    }
  }
}

module.exports = new PostService();
