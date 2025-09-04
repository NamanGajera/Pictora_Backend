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
  async createPost(data) {
    const transaction = await db.sequelize.transaction();

    try {
      const { userId, caption, mediaFiles, thumbnailFiles = [] } = data;

      // Validate input
      if (!mediaFiles || mediaFiles.length === 0) {
        throw new AppError("Media files are required", STATUS_CODE.BAD_REQUEST);
      }

      // Create post
      const post = await postRepository.createPost(
        { userId, caption },
        transaction
      );

      // Process media files in parallel
      const mediaProcessingPromises = mediaFiles.map(async (file, index) => {
        let mediaType = getFileType(file.mimetype);

        if (mediaFiles.length === 1 && mediaType === POST_TYPE.VIDEO) {
          mediaType = POST_TYPE.REEL;
        }

        const uploadedMedia = await CloudinaryService.uploadBuffer(
          file.buffer,
          "posts"
        );

        let thumbnailUrl = null;

        if ([POST_TYPE.VIDEO, POST_TYPE.REEL].includes(mediaType)) {
          const thumbnailFile = thumbnailFiles[index];
          if (thumbnailFile) {
            const uploadedThumbnail = await CloudinaryService.uploadBuffer(
              thumbnailFile.buffer,
              "posts/thumbnails"
            );
            thumbnailUrl = uploadedThumbnail.secure_url;
          } else {
            console.warn(`No thumbnail provided for video at index ${index}`);
          }
        }

        return await postMediaRepository.createPostMedia(
          {
            postId: post.id,
            mediaUrl: uploadedMedia.secure_url,
            thumbnail: thumbnailUrl,
            mediaType,
            publicId: uploadedMedia.public_id, // Useful for future management
          },
          transaction
        );
      });

      const mediaData = await Promise.all(mediaProcessingPromises);
      await transaction.commit();

      return {
        ...post.toJSON(),
        mediaData: mediaData.map((media) => media.toJSON()),
      };
    } catch (error) {
      await transaction.rollback();
      this.#handleError(error);
    }
  }

  async getAllPosts(data) {
    try {
      const { userId, filterUserId, skip = 0, take = 10, seedData } = data;

      const filterData = {};
      if (filterUserId) {
        filterData.userId = filterUserId;
      }
      const { posts, total, seed } = await postRepository.getAllPosts(
        userId,
        filterData,
        seedData,
        { skip: parseInt(skip), take: parseInt(take) }
      );
      return {
        posts,
        total,
        seed,
      };
    } catch (error) {
      this.#handleError(error);
    }
  }

  async getAllReels(data) {
    try {
      const { userId, filterUserId, skip = 0, take = 10, seedData } = data;

      const filterData = {};
      if (filterUserId) {
        filterData.userId = filterUserId;
      }
      const { posts, total, seed } = await postRepository.getAllReels(
        userId,
        filterData,
        seedData,
        { skip: parseInt(skip), take: parseInt(take) }
      );
      return {
        posts,
        total,
        seed,
      };
    } catch (error) {
      this.#handleError(error);
    }
  }

  async getPostById(data) {
    try {
      const { userId, postId } = data;
      const posts = await postRepository.getSinglePost(userId, postId);
      return posts;
    } catch (error) {
      this.#handleError(error);
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
      this.#handleError(error);
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
      this.#handleError(error);
    }
  }
  async togglePostArchive(data) {
    const { postId, userId } = data;
    try {
      const post = await postRepository.findOne({ id: postId });

      if (!post) {
        throw new AppError(Messages.POST_NOT_FOUND, STATUS_CODE.NOT_FOUND);
      }
      if (post.userId !== userId) {
        throw new AppError(Messages.ACCESS_DENIED, STATUS_CODE.FORBIDDEN);
      }
      const response = await postRepository.togglePostArchive(data);
      return response;
    } catch (error) {
      this.#handleError(error);
    }
  }

  async deletePost(data) {
    const transaction = await db.sequelize.transaction();

    const { postId, userId } = data;
    try {
      await postRepository.deletePost(postId, userId, transaction);
      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      this.#handleError(error);
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
      this.#handleError(error);
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
      this.#handleError(error);
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
      this.#handleError(error);
    }
  }
  async getAllUserWhoLikePost(data) {
    try {
      const { postId, skip = 0, take = 10, userId } = data;
      const { users, total } = await postRepository.getAllUsersWhoLikePost(
        postId,
        userId,
        { skip: parseInt(skip), take: parseInt(take) }
      );
      return { users, total };
    } catch (error) {
      console.log("Error-->> ", error);
      this.#handleError(error);
    }
  }
}

module.exports = new PostService();
