const db = require("../models");
const { PostRepository, PostMediaRepository } = require("../repositories");
const { Messages, Enums } = require("../utils/common");
const { BaseError } = require("sequelize");
const AppError = require("../utils/errors/app-error");
const CloudinaryService = require("./cloudinary-service");
const { getFileType } = require("../utils/helpers/getFileType");

const { STATUS_CODE, POST_TYPE } = Enums;
const postRepository = new PostRepository();
const postMediaRepository = new PostMediaRepository();

class PostService {
  async createPost(data) {
    const transaction = await db.sequelize.transaction();

    try {
      const { userId, caption, mediaFiles, thumbnailFiles = [] } = data;
      const post = await postRepository.createPost(
        { userId, caption },
        transaction
      );
      const mediaData = [];

      let videoIndex = 0; // To match thumbnail with video

      for (let i = 0; i < mediaFiles.length; i++) {
        const file = mediaFiles[i];
        const mediaType = getFileType(file.mimetype);

        const uploadedMedia = await CloudinaryService.uploadBuffer(
          file.buffer,
          "posts"
        );

        let thumbnailUrl = null;

        if (mediaType === POST_TYPE.VIDEO && thumbnailFiles[videoIndex]) {
          const uploadedThumbnail = await CloudinaryService.uploadBuffer(
            thumbnailFiles[videoIndex].buffer,
            "posts/thumbnails"
          );
          thumbnailUrl = uploadedThumbnail.secure_url;
          videoIndex++;
        }

        const postMedia = await postMediaRepository.createPostMedia(
          {
            postId: post.id,
            mediaUrl: uploadedMedia.secure_url,
            thumbnail: thumbnailUrl,
            mediaType,
          },
          transaction
        );

        mediaData.push(postMedia);
      }

      await transaction.commit();
      return {
        ...post.toJSON(),
        mediaData,
      };
    } catch (error) {
      await transaction.rollback();
      console.log("Create Post Error -> ", error);
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

  async getAllPosts(data) {
    try {
      const { userId, filterUserId, skip = 0, take = 10 } = data;

      const filterData = {};
      if (filterUserId) {
        filterData.userId = filterUserId;
      }
      const { posts, total } = await postRepository.getAllPosts(
        userId,
        filterData,
        { skip: parseInt(skip), take: parseInt(take) }
      );
      return {
        posts,
        total,
      };
    } catch (error) {
      console.log("Get All post -->", error);
      throw new AppError(
        Messages.SOMETHING_WRONG,
        STATUS_CODE.INTERNAL_SERVER_ERROR
      );
    }
  }
  async getPostById(data) {
    try {
      const { userId, postId } = data;
      const posts = await postRepository.getSinglePost(userId, postId);
      return posts;
    } catch (error) {
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

  async togglePostLike(data) {
    const { userId, postId, isLike } = data;
    try {
      const post = await postRepository.findOne({ id: postId });

      if (!post) {
        throw new AppError(Messages.POST_NOT_FOUND, STATUS_CODE.NOT_FOUND);
      }
      const response = await postRepository.togglePostLike(data);
      return response;
    } catch (error) {
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
  async togglePostSave(data) {
    const { userId, postId, isSaved } = data;
    try {
      const post = await postRepository.findOne({ id: postId });

      if (!post) {
        throw new AppError(Messages.POST_NOT_FOUND, STATUS_CODE.NOT_FOUND);
      }
      const response = await postRepository.togglePostSave(data);
      return response;
    } catch (error) {
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
  async togglePostArchive(data) {
    const { postId } = data;
    try {
      const post = await postRepository.findOne({ id: postId });
      console.log("Post Data", post);

      if (!post) {
        throw new AppError(Messages.POST_NOT_FOUND, STATUS_CODE.NOT_FOUND);
      }
      const response = await postRepository.togglePostArchive(data);
      return response;
    } catch (error) {
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

  async deletePost(data) {
    const { postId } = data;
    try {
      const post = await postRepository.get(postId);

      if (!post) {
        throw new AppError(Messages.POST_NOT_FOUND, STATUS_CODE.NOT_FOUND);
      }

      await postRepository.destroy(postId);
      return true;
    } catch (error) {
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

  async getLikedPosts(data) {
    try {
      const { userId, skip = 0, take = 10 } = data;
      const { posts, total } = await postRepository.getLikedPostsByUser(
        userId,
        { skip: parseInt(skip), take: parseInt(take) }
      );
      return {
        posts,
        total,
      };
    } catch (error) {
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
  async getSavedPosts(data) {
    try {
      const { userId, skip = 0, take = 10 } = data;
      const { posts, total } = await postRepository.getSavedPostsByUser(
        userId,
        { skip: parseInt(skip), take: parseInt(take) }
      );
      return {
        posts,
        total,
      };
    } catch (error) {
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
  async getArchivedPosts(data) {
    try {
      const { userId, skip = 0, take = 10 } = data;
      const { posts, total } = await postRepository.getArchivedPostsByUser(
        userId,
        { skip: parseInt(skip), take: parseInt(take) }
      );
      return {
        posts,
        total,
      };
    } catch (error) {
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
  async getAllUserWhoLikePost(data) {
    try {
      const { postId, skip = 0, take = 10 } = data;
      const { users, total } = await postRepository.getAllUsersWhoLikePost(
        postId,
        { skip: parseInt(skip), take: parseInt(take) }
      );
      return { users, total };
    } catch (error) {
      console.log("Error-->> ", error);
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
}

module.exports = new PostService();
