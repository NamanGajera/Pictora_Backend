const {
  Post,
  PostMedia,
  PostSave,
  PostLike,
  PostArchive,
  User,
  sequelize,
} = require("../models");
const { Sequelize, where } = require("sequelize");
const { Enums, Messages } = require("../utils/common");
const CrudRepository = require("./crud-repository");
const AppError = require("../utils/errors/app-error");

const { STATUS_CODE } = Enums;

class PostRepository extends CrudRepository {
  constructor() {
    super(Post);
  }

  async createPost(data, transaction) {
    return await Post.create(data, { transaction });
  }

  #buildBasePostQuery(userId) {
    if (!userId) {
      throw new AppError(
        Messages.REQUIRED_FIELD("User ID"),
        STATUS_CODE.BAD_REQUEST
      );
    }

    return {
      include: [
        {
          model: PostMedia,
          as: "mediaData",
        },
      ],
      attributes: {
        include: [
          this.#buildExistsAttribute("PostLikes", userId, "isLiked"),
          this.#buildExistsAttribute("PostSaves", userId, "isSaved"),
        ],
      },
    };
  }

  // Helper to build EXISTS attributes
  #buildExistsAttribute(table, userId, alias) {
    return [
      Sequelize.literal(`
        EXISTS (
          SELECT 1 FROM ${table}
          WHERE ${table}.postId = Post.id
          AND ${table}.userId = ${sequelize.escape(userId)}
        )
      `),
      alias,
    ];
  }

  // Format post response consistently
  #formatPostResponse(posts) {
    if (Array.isArray(posts)) {
      return posts.map((post) => this.#formatSinglePost(post));
    }
    return this.#formatSinglePost(posts);
  }

  #formatSinglePost(post) {
    const data = post.get({ plain: true });
    return {
      ...data,
      isLiked: Boolean(data.isLiked),
      isSaved: Boolean(data.isSaved),
    };
  }

  async getAllPosts(userId, filter, { skip = 0, take = 10 } = {}) {
    const baseQuery = this.#buildBasePostQuery(userId);

    const total = await Post.count({
      where: {
        ...filter,
        [Sequelize.Op.and]: [
          Sequelize.literal(`
          NOT EXISTS (
            SELECT 1
            FROM PostArchives
            WHERE PostArchives.postId = Post.id
            AND PostArchives.userId = ${sequelize.escape(userId)}
          )
        `),
        ],
      },
    });
    const posts = await Post.findAll({
      ...baseQuery,
      where: {
        ...filter,
        [Sequelize.Op.and]: [
          Sequelize.literal(`
            NOT EXISTS (
              SELECT 1
              FROM PostArchives
              WHERE PostArchives.postId = Post.id
              AND PostArchives.userId = ${sequelize.escape(userId)}
            )
          `),
        ],
      },
      offset: skip,
      limit: take,
      order: [["createdAt", "DESC"]],
    });

    return {
      posts: this.#formatPostResponse(posts),
      total,
    };
  }

  async getSinglePost(userId, postId) {
    const baseQuery = this.#buildBasePostQuery(userId);

    const post = await Post.findOne({
      ...baseQuery,
      where: { id: postId },
    });

    if (!post) {
      throw new AppError(Messages.POST_NOT_FOUND, STATUS_CODE.NOT_FOUND);
    }

    return this.#formatPostResponse(post);
  }

  async #getPostsByAssociation(
    userId,
    associationModel,
    associationName,
    { skip = 0, take = 10 } = {}
  ) {
    const baseQuery = this.#buildBasePostQuery(userId);

    const total = await Post.count({
      include: [
        {
          model: associationModel,
          where: { userId },
          attributes: [],
        },
      ],
      where: baseQuery.where,
    });

    const posts = await Post.findAll({
      ...baseQuery,
      include: [
        ...baseQuery.include,
        {
          model: associationModel,
          where: { userId },
          attributes: [],
        },
      ],
      offset: skip,
      limit: take,
      order: [["createdAt", "DESC"]],
    });

    return {
      posts: this.#formatPostResponse(posts),
      total,
    };
  }

  async getLikedPostsByUser(userId, { skip = 0, take = 10 } = {}) {
    return this.#getPostsByAssociation(userId, PostLike, "PostLikes", {
      skip,
      take,
    });
  }

  async getSavedPostsByUser(userId, { skip = 0, take = 10 } = {}) {
    return this.#getPostsByAssociation(userId, PostSave, "PostSaves", {
      skip,
      take,
    });
  }

  async getArchivedPostsByUser(userId, { skip = 0, take = 10 } = {}) {
    return this.#getPostsByAssociation(userId, PostArchive, "PostArchives", {
      skip,
      take,
    });
  }

  async getAllUsersWhoLikePost(postId, { skip = 0, take = 10 } = {}) {
    try {
      const post = await Post.findByPk(postId);
      if (!post) {
        throw new AppError(Messages.POST_NOT_FOUND, STATUS_CODE.NOT_FOUND);
      }

      const total = await User.count({
        include: [
          {
            model: PostLike,
            where: { postId },
            attributes: [],
            required: true,
            as: "likedPost",
          },
        ],
      });
      const users = await User.findAll({
        include: [
          {
            model: PostLike,
            where: { postId },
            attributes: [],
            required: true,
            as: "likedPost",
          },
        ],
        attributes: ["id", "username", "fullName"],
        offset: skip,
        limit: take,
        order: [["username", "ASC"]],
      });

      return {
        users,
        total,
      };
    } catch (error) {
      console.error("Error in getAllUsersWhoLikedPost:", error);
      throw error;
    }
  }
  async #togglePostAssociation({
    userId,
    postId,
    isSet,
    associationModel,
    counterColumn,
    successMessages,
    errorMessages,
  }) {
    const existing = await associationModel.findOne({
      where: { userId, postId },
    });
    const post = await Post.findOne({ where: { id: postId } });

    if (!post) {
      throw new AppError(Messages.POST_NOT_FOUND, STATUS_CODE.NOT_FOUND);
    }

    if (isSet) {
      if (!existing) {
        await associationModel.create({ userId, postId });
        if (counterColumn) {
          await post.increment(counterColumn, { by: 1 });
          await post.reload();
        }
        return { status: true, message: successMessages.added };
      }
      return { status: true, message: errorMessages.alreadyAdded };
    } else {
      if (existing) {
        await existing.destroy();
        if (counterColumn) {
          await post.decrement(counterColumn, { by: 1 });
          await post.reload();
        }
        return { status: false, message: successMessages.removed };
      }
      return { status: false, message: errorMessages.notFound };
    }
  }

  async togglePostLike({ userId, postId, isLike }) {
    return this.#togglePostAssociation({
      userId,
      postId,
      isSet: isLike,
      associationModel: PostLike,
      counterColumn: "likeCount",
      successMessages: {
        added: Messages.POST_LIKED,
        removed: Messages.POST_UNLIKED,
      },
      errorMessages: {
        alreadyAdded: Messages.ALREADY_LIKED,
        notFound: Messages.OPERATION_SUCCESS,
      },
    });
  }

  async togglePostSave({ userId, postId, isSave }) {
    return this.#togglePostAssociation({
      userId,
      postId,
      isSet: isSave,
      associationModel: PostSave,
      counterColumn: "saveCount",
      successMessages: {
        added: Messages.POST_SAVED,
        removed: Messages.POST_UNSAVED,
      },
      errorMessages: {
        alreadyAdded: Messages.ALREADY_SAVED,
        notFound: Messages.OPERATION_SUCCESS,
      },
    });
  }

  async togglePostArchive({ userId, postId, isArchive }) {
    return this.#togglePostAssociation({
      userId,
      postId,
      isSet: isArchive,
      associationModel: PostArchive,
      successMessages: {
        added: Messages.POST_ARCHIVED,
        removed: Messages.POST_UNARCHIVED,
      },
      errorMessages: {
        alreadyAdded: Messages.ALREADY_ARCHIVED,
        notFound: Messages.OPERATION_SUCCESS,
      },
    });
  }
}

module.exports = PostRepository;
