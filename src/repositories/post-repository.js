const {
  Post,
  PostMedia,
  PostSave,
  PostLike,
  PostArchive,
  User,
  UserCount,
  UserProfile,
  sequelize,
} = require("../models");
const { Sequelize } = require("sequelize");
const { Enums, Messages } = require("../utils/common");
const CrudRepository = require("./crud-repository");
const UserRepository = require("./user-repository");
const AppError = require("../utils/errors/app-error");
const { message } = require("../utils/common/error-response");

const { STATUS_CODE, POST_TYPE } = Enums;

class PostRepository extends CrudRepository {
  constructor() {
    super(Post);
  }

  async createPost(data, transaction) {
    const post = await Post.create(data, { transaction });
    await UserCount.increment("postCount", {
      by: 1,
      where: { userId: post.userId },
    });
    const postWithUser = await Post.findOne({
      where: { id: post.id },
      include: {
        model: User,
        as: "userData",
        include: [
          {
            model: UserProfile,
            as: "profile",
            attributes: ["profilePicture", "isPrivate"],
          },
        ],
        attributes: ["id", "fullName", "userName", "email"],
      },
      transaction,
    });
    return postWithUser;
  }

  async deletePost(postId, userId, transaction) {
    try {
      console.log("Deleting post with ID:", postId, "by user ID:", userId);
      const post = await Post.findByPk(postId);

      if (!post) {
        throw new AppError(Messages.POST_NOT_FOUND, STATUS_CODE.NOT_FOUND);
      }
      if (post.userId !== userId) {
        throw new AppError(Messages.ACCESS_DENIED, STATUS_CODE.FORBIDDEN);
      }

      await Post.destroy({
        where: { id: postId },
        transaction,
      });

      await UserCount.decrement("postCount", {
        by: 1,
        where: { userId: post.userId },
        transaction,
      });

      return true;
    } catch (error) {
      throw error;
    }
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
        {
          model: User,
          as: "userData",
          include: [
            {
              model: UserProfile,
              as: "profile",
              attributes: ["profilePicture", "isPrivate"],
            },
          ],
          attributes: ["id", "fullName", "userName", "email"],
        },
      ],
      attributes: {
        include: [
          this.#buildExistsAttribute("PostLikes", userId, "isLiked"),
          this.#buildExistsAttribute("PostSaves", userId, "isSaved"),
          this.#buildExistsAttribute("PostArchives", userId, "isArchived"),
        ],
      },
    };
  }

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
      isArchived: Boolean(data.isArchived),
      userData: data.userData
        ? {
          ...data.userData,
          isFollowed: Boolean(Number(data.userData.isFollowed)),
          showFollowBack: Boolean(Number(data.userData.showFollowBack)),
        }
        : null,
    };
  }

  async getAllPosts(userId, filter, { skip = 0, take = 10 } = {}) {
    const baseQuery = this.#buildBasePostQuery(userId);

    const { count, rows: posts } = await Post.findAndCountAll({
      ...baseQuery,
      distinct: true,
      where: {
        ...filter,
        // [Sequelize.Op.and]: [
        //   Sequelize.literal(`
        //     NOT EXISTS (
        //       SELECT 1
        //       FROM PostArchives
        //       WHERE PostArchives.postId = Post.id
        //       AND PostArchives.userId = ${sequelize.escape(userId)}
        //     )
        //   `),
        // ],
      },
      offset: skip,
      limit: take,
      order: [["createdAt", "DESC"]],
    });

    return {
      posts: this.#formatPostResponse(posts),
      total: count,
    };
  }

  async getAllReels(userId, filter, seed, { skip = 0, take = 10 } = {}) {

    const finalSeed = seed || Math.floor(Math.random() * 100000);
    const { count, rows: posts } = await Post.findAndCountAll({
      include: [
        {
          model: PostMedia,
          as: "mediaData",
          where: { mediaType: POST_TYPE.REEL }
        },
        {
          model: User,
          as: "userData",
          include: [
            {
              model: UserProfile,
              as: "profile",
              attributes: ["profilePicture", "isPrivate"],
            },
          ],
          attributes: [
            "id",
            "fullName",
            "userName",
            [
              Sequelize.literal(`EXISTS (
              SELECT 1 FROM Follows AS F
              WHERE F.followerId = ${sequelize.escape(userId)}
              AND F.followingId = userData.id
            )`),
              "isFollowed",
            ],
            [
              Sequelize.literal(
                `NOT EXISTS (
                  SELECT 1 FROM Follows AS F
                  WHERE F.followerId = ${sequelize.escape(userId)}
                  AND F.followingId = userData.id
                ) AND EXISTS (
                  SELECT 1 FROM Follows AS F2
                  WHERE F2.followerId = userData.id
                  AND F2.followingId = ${sequelize.escape(userId)}
                )`
              ),
              "showFollowBack",
            ],
            [
              Sequelize.literal(`(
            SELECT status FROM FollowRequests AS FR
            WHERE FR.requesterId = ${sequelize.escape(userId)}
            AND FR.targetId = userData.id
            LIMIT 1
          )`),
              "followRequestStatus",
            ],
          ],
        },
      ],
      attributes: {
        include: [
          this.#buildExistsAttribute("PostLikes", userId, "isLiked"),
          this.#buildExistsAttribute("PostSaves", userId, "isSaved"),
          this.#buildExistsAttribute("PostArchives", userId, "isArchived"),
        ],
      },
      distinct: true,
      where: {
        ...filter,
      },
      offset: skip,
      limit: take,
      order: Sequelize.literal(`MD5(CONCAT(\`Post\`.\`id\`, '${finalSeed}')) ASC`),
    });

    return {
      posts: this.#formatPostResponse(posts),
      total: count,
      seed: finalSeed,
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

    const { count, rows: posts } = await Post.findAndCountAll({
      ...baseQuery,
      distinct: true,
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
      total: count,
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

  async getAllUsersWhoLikePost(postId, userId, { skip = 0, take = 10 } = {}) {
    try {
      const post = await Post.findByPk(postId);
      if (!post) {
        throw new AppError(Messages.POST_NOT_FOUND, STATUS_CODE.NOT_FOUND);
      }

      const { count, rows: users } = await User.findAndCountAll({
        distinct: true,
        include: [
          {
            model: PostLike,
            where: { postId },
            attributes: [],
            required: true,
            as: "likedPost",
          },
          {
            model: UserProfile,
            as: "profile",
            attributes: ["profilePicture", "isPrivate"],
          },
        ],
        attributes: [
          "id",
          "userName",
          "fullName",
          [
            Sequelize.literal(`EXISTS (
              SELECT 1 FROM Follows AS F
              WHERE F.followerId = ${sequelize.escape(userId)}
              AND F.followingId = User.id
            )`),
            "isFollowed",
          ],
          [
            Sequelize.literal(
              `NOT EXISTS (
                  SELECT 1 FROM Follows AS F
                  WHERE F.followerId = ${sequelize.escape(userId)}
                  AND F.followingId = User.id
                ) AND EXISTS (
                  SELECT 1 FROM Follows AS F2
                  WHERE F2.followerId = User.id
                  AND F2.followingId = ${sequelize.escape(userId)}
                )`
            ),
            "showFollowBack",
          ],
          [
            Sequelize.literal(`(
                    SELECT status FROM FollowRequests AS FR
                    WHERE FR.requesterId = ${sequelize.escape(userId)}
                    AND FR.targetId = User.id
                    LIMIT 1
                  )`),
            "followRequestStatus",
          ],
        ],
        offset: skip,
        limit: take,
        order: [["userName", "ASC"]],
      });

      return {
        users: users.map((user) => {
          return {
            ...user.toJSON(),
            isFollowed: Boolean(user.getDataValue("isFollowed")),
            showFollowBack: Boolean(user.getDataValue("showFollowBack")),
          };
        }),
        total: count,
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
