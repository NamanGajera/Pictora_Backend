const {
  Post,
  PostMedia,
  PostSave,
  PostLike,
  PostArchive,
  sequelize,
} = require("../models");
const { Sequelize } = require("sequelize");
const { STATUS_CODE } = require("../utils/common").Enums;
const CrudRepository = require("./crud-repository");
const AppError = require("../utils/errors/app-error");

class PostRepository extends CrudRepository {
  constructor() {
    super(Post);
  }

  async createPost(data, transaction) {
    const response = await Post.create(data, {
      transaction: transaction,
    });
    return response;
  }

  async getAllPost(userId, filter) {
    try {
      if (!userId) throw new Error("User ID is required");

      const posts = await Post.findAll({
        where: {
          ...filter,
        },
        include: [
          {
            model: PostMedia,
            as: "mediaData",
            attributes: ["id", "mediaUrl", "mediaType"],
          },
          {
            model: PostArchive, // Make sure this matches the association name
            required: false,
            attributes: [],
            where: {
              userId,
            },
          },
        ],
        attributes: {
          include: [
            [
              Sequelize.literal(`
              EXISTS (
                SELECT 1
                FROM PostLikes
                WHERE PostLikes.postId = Post.id
                AND PostLikes.userId = ${sequelize.escape(userId)}
              )
            `),
              "isLiked",
            ],
            [
              Sequelize.literal(`
              EXISTS (
                SELECT 1
                FROM PostSaves
                WHERE PostSaves.postId = Post.id
                AND PostSaves.userId = ${sequelize.escape(userId)}
              )
            `),
              "isSaved",
            ],
          ],
        },
        // Fixed HAVING clause - using backticks instead of double quotes
        having: Sequelize.literal("`PostArchives`.`id` IS NULL"),
        subQuery: false,
      });

      return posts.map((post) => {
        const data = post.get({ plain: true });
        return {
          ...data,
          isLiked: Boolean(data.isLiked),
          isSaved: Boolean(data.isSaved),
        };
      });
    } catch (error) {
      console.error("Error in getAllPost:", error);
      throw error;
    }
  }

  async getSinglePost(userId, postId) {
    try {
      console.log("User Id ==>>> ", userId);

      if (!userId) {
        throw new Error("User ID is required");
      }

      const post = await Post.findOne({
        where: { id: postId },
        include: [
          {
            model: PostMedia,
            as: "mediaData",
            attributes: ["id", "mediaUrl", "mediaType"],
          },
        ],
        attributes: {
          include: [
            [
              Sequelize.literal(`
              EXISTS (
                SELECT 1
                FROM PostLikes
                WHERE PostLikes.postId = Post.id
                AND PostLikes.userId = ${sequelize.escape(userId)}
              )
            `),
              "isLiked",
            ],
            [
              Sequelize.literal(`
              EXISTS (
                SELECT 1
                FROM PostSaves
                WHERE PostSaves.postId = Post.id
                AND PostSaves.userId = ${sequelize.escape(userId)}
              )
            `),
              "isSaved",
            ],
          ],
        },
      });

      if (!post) {
        throw new AppError("Post not found", STATUS_CODE.NOT_FOUND);
      }

      const result = post.get({ plain: true });

      return {
        ...result,
        isLiked: Boolean(result.isLiked),
        isSaved: Boolean(result.isSaved),
      };
    } catch (error) {
      console.error("Error in getSinglePost:", error);
      throw error;
    }
  }

  async togglePostLike({ userId, postId, isLike }) {
    const existing = await PostLike.findOne({ where: { userId, postId } });
    const post = await Post.findOne({ where: { id: postId } });

    if (!post) {
      throw new Error("Post not found");
    }

    if (isLike) {
      if (!existing) {
        await PostLike.create({ userId, postId });
        await post.increment("likeCount", { by: 1 });
        await post.reload();
        return { liked: true, message: "Post liked successfully" };
      } else {
        return { liked: true, message: "Post already liked" };
      }
    } else {
      if (existing) {
        await existing.destroy();
        await post.decrement("likeCount", { by: 1 });
        await post.reload();
        return { liked: false, message: "Post disliked successfully" };
      } else {
        return { liked: false, message: "Post already unlike" };
      }
    }
  }

  async togglePostSave({ userId, postId, isSave }) {
    const existing = await PostSave.findOne({ where: { userId, postId } });
    const post = await Post.findOne({ where: { id: postId } });

    if (!post) {
      throw new Error("Post not found");
    }

    if (isSave) {
      if (!existing) {
        await PostSave.create({ userId, postId });
        await post.increment("saveCount", { by: 1 });
        await post.reload();
        return { saved: true, message: "Post saved successfully" };
      } else {
        return { saved: true, message: "Post already saved" };
      }
    } else {
      if (existing) {
        await existing.destroy();
        await post.decrement("saveCount", { by: 1 });
        await post.reload();
        return { saved: false, message: "Post unsave successfully" };
      } else {
        return { saved: false, message: "Post already unsaved" };
      }
    }
  }
  async togglePostArchive({ userId, postId, isArchive }) {
    const existing = await PostArchive.findOne({ where: { userId, postId } });
    const post = await Post.findOne({ where: { id: postId } });

    if (!post) {
      throw new Error("Post not found");
    }

    if (isArchive) {
      if (!existing) {
        await PostArchive.create({ userId, postId });
        return { saved: true, message: "Post archived successfully" };
      } else {
        return { saved: true, message: "Post already archived" };
      }
    } else {
      if (existing) {
        await existing.destroy();
        return { saved: false, message: "Post archived successfully" };
      } else {
        return { saved: false, message: "Post already archived" };
      }
    }
  }
}

module.exports = PostRepository;
