const db = require("../models");
const {
  PostRepository,
  PostLikeRepository,
  PostSaveRepository,
  PostArchiveRepository,
  PostMediaRepository,
} = require("../repositories");
const { Messages, Enums } = require("../utils/common");
const { BaseError } = require("sequelize");
const AppError = require("../utils/errors/app-error");
const CloudinaryService = require("./cloudinary-service");
const { getFileType } = require("../utils/helpers/getFileType");

const { STATUS_CODE } = Enums;
const postRepository = new PostRepository();
const postLikeRepository = new PostLikeRepository();
const postSaveRepository = new PostSaveRepository();
const postArchiveRepository = new PostArchiveRepository();
const postMediaRepository = new PostMediaRepository();

class PostService {
  async createPost(data) {
    const transaction = await db.sequelize.transaction();

    try {
      const { userId, caption, mediaFiles } = data;

      if (mediaFiles && mediaFiles.length > 0) {
        this.validateMediaFiles(mediaFiles);
      }

      const post = await postRepository.createPost(
        { userId, caption },
        transaction
      );

      let mediaData = [];

      if (mediaFiles && mediaFiles.length > 0) {
        mediaData = await this.processMediaUploads(
          mediaFiles,
          post.id,
          transaction
        );
      }

      await transaction.commit();
      return {
        ...post.toJSON(),
        mediaData,
      };
    } catch (error) {
      await transaction.rollback();
      console.error("Create Post Error -->>", error);

      if (mediaData && mediaData.length > 0) {
        await this.cleanupFailedUploads(mediaData);
      }

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

  async processMediaUploads(mediaFiles, postId, transaction) {
    const uploadPromises = mediaFiles.map((file) =>
      this.uploadSingleMedia(file, postId, transaction).catch((error) => {
        throw new AppError(
          `Failed to upload media: ${error.message}`,
          STATUS_CODE.BAD_REQUEST
        );
      })
    );

    return Promise.all(uploadPromises);
  }

  async uploadSingleMedia(file, postId, transaction) {
    const uploaded = await CloudinaryService.uploadBuffer(file.buffer, "posts");

    const mediaType = getFileType(file.mimetype);

    return postMediaRepository.createPostMedia(
      {
        postId,
        mediaUrl: uploaded.secure_url,
        mediaType,
      },
      transaction
    );
  }

  validateMediaFiles(mediaFiles) {
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    const MAX_TOTAL_SIZE = 500 * 1024 * 1024; // 500MB
    const ALLOWED_TYPES = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "video/mp4",
      "video/quicktime",
    ];

    let totalSize = 0;

    for (const file of mediaFiles) {
      // Check file type
      if (!ALLOWED_TYPES.includes(file.mimetype)) {
        throw new AppError(
          `Invalid file type: ${file.mimetype}`,
          STATUS_CODE.BAD_REQUEST
        );
      }

      // Check individual file size
      if (file.size > MAX_FILE_SIZE) {
        throw new AppError(
          `File ${file.originalname} exceeds maximum size of ${
            MAX_FILE_SIZE / (1024 * 1024)
          }MB`,
          STATUS_CODE.BAD_REQUEST
        );
      }

      totalSize += file.size;
    }

    if (totalSize > MAX_TOTAL_SIZE) {
      throw new AppError(
        `Total upload size exceeds maximum of ${
          MAX_TOTAL_SIZE / (1024 * 1024)
        }MB`,
        STATUS_CODE.BAD_REQUEST
      );
    }
  }

  async cleanupFailedUploads(mediaData) {
    const deletePromises = mediaData.map((media) => {
      if (media.mediaUrl) {
        const publicId = this.extractPublicId(media.mediaUrl);
        return CloudinaryService.deleteFile(publicId).catch(console.error);
      }
    });

    await Promise.all(deletePromises);
  }

  extractPublicId(url) {
    const matches = url.match(/upload\/(?:v\d+\/)?([^\.]+)/);
    return matches ? matches[1] : null;
  }

  async getAllPosts(data) {
    try {
      const { userId } = data;
      const posts = await postRepository.getAllPost(userId, {});
      return posts;
    } catch (error) {
      console.log("Get All Posts Error -->>", error);
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
      console.log("Get single Posts Error -->>", error);
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
      console.log("Post Data", post);

      if (!post) {
        throw new AppError(Messages.POST_NOT_FOUND, STATUS_CODE.NOT_FOUND);
      }
      const response = await postRepository.togglePostLike(data);
      return response;
    } catch (error) {
      console.error("Error in PostService.toggleLike:", error);
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
      console.log("Post Data", post);

      if (!post) {
        throw new AppError(Messages.POST_NOT_FOUND, STATUS_CODE.NOT_FOUND);
      }
      const response = await postRepository.togglePostSave(data);
      return response;
    } catch (error) {
      console.error("Error in PostService.toggleSave:", error);
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
      console.error("Error in PostService.toggleArchive:", error);
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
