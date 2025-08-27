const {
  User,
  UserProfile,
  UserCount,
  Follow,
  FollowRequest,
  sequelize,
} = require("../models");
const CrudRepository = require("./crud-repository");
const AppError = require("../utils/errors/app-error");
const { Enums, Messages } = require("../utils/common");
const { Sequelize, Op } = require("sequelize");

const { STATUS_CODE, FOLLOW_REQUEST_STATUS } = Enums;
class UserRepository extends CrudRepository {
  constructor() {
    super(User);
  }

  async registerUser(data) {
    const user = await User.create(data);
    return user;
  }

  async toggleFollow(data, transaction) {
    const { followerId, followingId, shouldFollow } = data;

    const [follower, targetUser] = await Promise.all([
      User.findByPk(followerId, {
        include: ["profile"],
        transaction,
      }),
      User.findByPk(followingId, {
        include: ["profile"],
        transaction,
      }),
    ]);

    if (!follower || !targetUser) {
      throw new AppError(Messages.USER_NOT_FOUND, STATUS_CODE.NOT_FOUND);
    }

    const existingFollow = await Follow.findOne({
      where: { followerId, followingId },
      transaction,
    });

    const existingRequest = targetUser.profile.isPrivate
      ? await FollowRequest.findOne({
          where: {
            requesterId: followerId,
            targetId: followingId,
            status: FOLLOW_REQUEST_STATUS.PENDING,
          },
          transaction,
        })
      : null;

    if (shouldFollow) {
      if (existingFollow) {
        throw new AppError(Messages.ALREADY_FOLLOW, STATUS_CODE.CONFLICT);
      }

      if (existingRequest) {
        throw new AppError(
          Messages.FOLLOW_REQUEST_PENDING,
          STATUS_CODE.CONFLICT
        );
      }

      if (targetUser.profile.isPrivate) {
        await FollowRequest.create(
          {
            requesterId: followerId,
            targetId: followingId,
            status: FOLLOW_REQUEST_STATUS.PENDING,
          },
          { transaction }
        );
        return { message: Messages.FOLLOW_REQUEST_SENT };
      }

      await Follow.create(
        { followerId, followingId, isAccepted: true },
        { transaction }
      );

      await Promise.all([
        UserCount.increment("followingCount", {
          where: { userId: followerId },
          by: 1,
          transaction,
        }),
        UserCount.increment("followerCount", {
          where: { userId: followingId },
          by: 1,
          transaction,
        }),
      ]);

      return { message: Messages.USER_FOLLOWED };
    } else {
      if (existingRequest) {
        await FollowRequest.destroy({
          where: {
            requesterId: followerId,
            targetId: followingId,
          },
          transaction,
        });
        return { message: Messages.REQUEST_CANCELED };
      }
      if (!existingFollow) {
        throw new AppError(Messages.NOT_FOLLOWING_USER, STATUS_CODE.CONFLICT);
      }

      await existingFollow.destroy({ transaction });

      await Promise.all([
        UserCount.decrement("followingCount", {
          where: { userId: followerId },
          by: 1,
          transaction,
        }),
        UserCount.decrement("followerCount", {
          where: { userId: followingId },
          by: 1,
          transaction,
        }),
      ]);

      return { message: Messages.USER_UNFOLLOWED };
    }
  }

  async getUserProfileData(userId, currentUserId) {
    const user = await User.findOne({
      where: { id: userId },
      include: [
        {
          model: UserProfile,
          as: "profile",
          attributes: [
            "profilePicture",
            "bio",
            "dob",
            "gender",
            "isPrivate",
            "location",
          ],
        },
        {
          model: UserCount,
          as: "counts",
          attributes: ["followerCount", "followingCount", "postCount"],
        },
      ],
      attributes: ["id", "userName", "fullName", "email"],
    });

    if (!user) {
      throw new AppError(Messages.USER_NOT_FOUND, STATUS_CODE.NOT_FOUND);
    }

    let isFollowed = false;
    let followRequestStatus = null;
    let showFollowBack = false;

    if (userId !== currentUserId) {
      const follow = await Follow.findOne({
        where: { followerId: currentUserId, followingId: userId },
      });

      if (follow) {
        isFollowed = true;
      } else {
        const request = await FollowRequest.findOne({
          where: {
            requesterId: currentUserId,
            targetId: userId,
          },
          order: [["createdAt", "DESC"]],
        });

        if (request) {
          followRequestStatus = request.status;
        }
      }
      const reverseFollow = await Follow.findOne({
        where: {
          followerId: userId,
          followingId: currentUserId,
        },
      });

      if (reverseFollow && !isFollowed) {
        showFollowBack = true;
      }
    }
    const responseData = {
      ...user.toJSON(),
    };

    if (userId !== currentUserId) {
      responseData.isFollowed = isFollowed;
      responseData.followRequestStatus = followRequestStatus;
      responseData.showFollowBack = showFollowBack;
    }

    return responseData;
  }

  async getAllFollowRequests(userId) {
    const requests = await FollowRequest.findAll({
      where: {
        targetId: userId,
        status: FOLLOW_REQUEST_STATUS.PENDING,
      },
      include: [
        {
          model: User,
          as: "requester",
          attributes: ["id", "fullName", "userName"],
          include: [
            {
              model: UserProfile,
              as: "profile",
              attributes: ["profilePicture", "isPrivate"],
            },
          ],
        },
      ],
    });

    return requests;
  }

  async manageFollowRequest(
    { requestId, isAccept, targetUserId },
    transaction
  ) {
    const request = await FollowRequest.findOne({
      where: {
        id: requestId,
        targetId: targetUserId,
        status: FOLLOW_REQUEST_STATUS.PENDING,
      },
      transaction,
    });

    if (!request) {
      throw new AppError(Messages.REQUEST_NOT_FOUND, STATUS_CODE.NOT_FOUND);
    }

    const { requesterId } = request;

    if (isAccept === true) {
      await Follow.create(
        {
          followerId: requesterId,
          followingId: targetUserId,
          isAccepted: true,
        },
        { transaction }
      );

      await Promise.all([
        UserCount.increment("followerCount", {
          where: { userId: targetUserId },
          by: 1,
          transaction,
        }),
        UserCount.increment("followingCount", {
          where: { userId: requesterId },
          by: 1,
          transaction,
        }),
      ]);

      await request.destroy({ transaction });

      return { message: Messages.REQUEST_ACCEPTED };
    }

    if (isAccept === false) {
      await request.update(
        { status: FOLLOW_REQUEST_STATUS.REJECTED },
        { transaction }
      );
      await request.destroy({ transaction });

      return { message: Messages.REQUEST_REJECTED };
    }

    throw new AppError(Messages.SOMETHING_WRONG, STATUS_CODE.BAD_REQUEST);
  }

  async getAllFollowers(userId, currentUserId, { skip = 0, take = 10 } = {}) {
    const targetUser = await User.findByPk(userId, {
      include: { model: UserProfile, as: "profile" },
    });

    if (!targetUser) {
      throw new AppError(Messages.USER_NOT_FOUND, STATUS_CODE.NOT_FOUND);
    }

    const isSelf = userId === currentUserId;

    let isAllowed = isSelf || !targetUser.profile.isPrivate;

    if (!isAllowed) {
      const isFollowing = await Follow.findOne({
        where: {
          followerId: currentUserId,
          followingId: userId,
        },
      });

      if (isFollowing) isAllowed = true;
    }

    if (!isAllowed) {
      throw new AppError(Messages.ACCESS_DENIED, STATUS_CODE.FORBIDDEN);
    }

    const { count, rows: followers } = await Follow.findAndCountAll({
      where: { followingId: userId },
      distinct: true,
      include: [
        {
          model: User,
          as: "follower",
          attributes: [
            "id",
            "fullName",
            "userName",
            [
              Sequelize.literal(`EXISTS (
              SELECT 1 FROM Follows AS F
              WHERE F.followerId = ${sequelize.escape(currentUserId)}
              AND F.followingId = follower.id
            )`),
              "isFollowed",
            ],
            [
              Sequelize.literal(
                `NOT EXISTS (
                  SELECT 1 FROM Follows AS F
                  WHERE F.followerId = ${sequelize.escape(currentUserId)}
                  AND F.followingId = follower.id
                ) AND EXISTS (
                  SELECT 1 FROM Follows AS F2
                  WHERE F2.followerId = follower.id
                  AND F2.followingId = ${sequelize.escape(currentUserId)}
                )`
              ),
              "showFollowBack",
            ],
            [
              Sequelize.literal(`(
                    SELECT status FROM FollowRequests AS FR
                    WHERE FR.requesterId = ${sequelize.escape(currentUserId)}
                    AND FR.targetId = follower.id
                    LIMIT 1
                  )`),
              "followRequestStatus",
            ],
          ],
          include: [
            {
              model: UserProfile,
              as: "profile",
              attributes: ["profilePicture", "isPrivate"],
            },
          ],
        },
      ],
      offset: skip,
      limit: take,
      order: [["createdAt", "DESC"]],
    });
    return {
      users: followers.map((f) => {
        const follower = f.follower.toJSON();
        follower.isFollowed = !!follower.isFollowed;
        follower.showFollowBack = !!follower.showFollowBack;
        return follower;
      }),
      total: count,
    };
  }

  async getAllFollowingUser(
    userId,
    currentUserId,
    { skip = 0, take = 10 } = {}
  ) {
    const targetUser = await User.findByPk(userId, {
      include: { model: UserProfile, as: "profile" },
    });

    if (!targetUser) {
      throw new AppError(Messages.USER_NOT_FOUND, STATUS_CODE.NOT_FOUND);
    }

    const isSelf = userId === currentUserId;

    let isAllowed = isSelf || !targetUser.profile.isPrivate;

    if (!isAllowed) {
      const isFollowing = await Follow.findOne({
        where: {
          followerId: currentUserId,
          followingId: userId,
        },
      });

      if (isFollowing) isAllowed = true;
    }

    if (!isAllowed) {
      throw new AppError(Messages.ACCESS_DENIED, STATUS_CODE.FORBIDDEN);
    }
    const { count, rows: followingUsers } = await Follow.findAndCountAll({
      where: { followerId: userId },
      distinct: true,
      include: [
        {
          model: User,
          as: "following",
          attributes: [
            "id",
            "fullName",
            "userName",
            [
              Sequelize.literal(`EXISTS (
              SELECT 1 FROM Follows AS F
              WHERE F.followerId = ${sequelize.escape(currentUserId)}
              AND F.followingId = following.id
            )`),
              "isFollowed",
            ],
            [
              Sequelize.literal(
                `NOT EXISTS (
                  SELECT 1 FROM Follows AS F
                  WHERE F.followerId = ${sequelize.escape(currentUserId)}
                  AND F.followingId = following.id
                ) AND EXISTS (
                  SELECT 1 FROM Follows AS F2
                  WHERE F2.followerId = following.id
                  AND F2.followingId = ${sequelize.escape(currentUserId)}
                )`
              ),
              "showFollowBack",
            ],
            [
              Sequelize.literal(`(
            SELECT status FROM FollowRequests AS FR
            WHERE FR.requesterId = ${sequelize.escape(currentUserId)}
            AND FR.targetId = following.id
            LIMIT 1
          )`),
              "followRequestStatus",
            ],
          ],
          include: [
            {
              model: UserProfile,
              as: "profile",
              attributes: ["profilePicture", "isPrivate"],
            },
          ],
        },
      ],
      offset: skip,
      limit: take,
      order: [["createdAt", "DESC"]],
    });
    return {
      users: followingUsers.map((f) => {
        const following = f.following.toJSON();
        following.isFollowed = !!following.isFollowed;
        following.showFollowBack = !!following.showFollowBack;
        return following;
      }),
      total: count,
    };
  }

  async getDiscoverUsers(currentUserId, { skip = 0, take = 10 } = {}) {
    try {
      const { count, rows: users } = await User.findAndCountAll({
        distinct: true,
        where: {
          id: {
            [Op.ne]: currentUserId,
            [Op.notIn]: Sequelize.literal(`(
            SELECT followingId
            FROM Follows
            WHERE followerId = ${sequelize.escape(currentUserId)}
          )`),
          },
        },
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
              WHERE F.followerId = ${sequelize.escape(currentUserId)}
              AND F.followingId = User.id
            )`),
            "isFollowed",
          ],
          [
            Sequelize.literal(
              `NOT EXISTS (
                  SELECT 1 FROM Follows AS F
                  WHERE F.followerId = ${sequelize.escape(currentUserId)}
                  AND F.followingId = User.id
                ) AND EXISTS (
                  SELECT 1 FROM Follows AS F2
                  WHERE F2.followerId = User.id
                  AND F2.followingId = ${sequelize.escape(currentUserId)}
                )`
            ),
            "showFollowBack",
          ],
          [
            Sequelize.literal(`(
            SELECT status FROM FollowRequests AS FR
            WHERE FR.requesterId = ${sequelize.escape(currentUserId)}
            AND FR.targetId = User.id
            LIMIT 1
          )`),
            "followRequestStatus",
          ],
        ],
        offset: skip,
        limit: take,
      });

      return {
        users: users.map((f) => {
          const following = f.toJSON();
          following.isFollowed = !!following.isFollowed;
          following.showFollowBack = !!following.showFollowBack;
          return following;
        }),
        total: count,
      };
    } catch (error) {
      throw error;
    }
  }

  async searchUsers(query) {
    try {
      if (!query) {
        throw new AppError(
          Messages.REQUIRED_FIELD("query"),
          STATUS_CODE.BAD_REQUEST
        );
      }

      let conditions;

      if (query.includes(" ")) {
        const terms = query.trim().split(/\s+/);
        conditions = {
          [Op.and]: terms.map((word) => ({
            [Op.or]: [
              { userName: { [Op.like]: `%${word}%` } },
              { fullName: { [Op.like]: `%${word}%` } },
            ],
          })),
        };
      } else {
        conditions = {
          [Op.or]: [
            { userName: { [Op.like]: `%${query.trim()}%` } },
            { fullName: { [Op.like]: `%${query.trim()}%` } },
          ],
        };
      }

      const users = await User.findAll({
        where: conditions,
        attributes: ["id", "fullName", "userName"],
        include: [
          {
            model: UserProfile,
            as: "profile",
            attributes: ["profilePicture"],
          },
        ],
      });

      return users;
    } catch (error) {
      throw error;
    }
  }

  async updateUser(userId, data, transaction) {
    try {
      const user = await User.findOne({
        where: { id: userId },
        include: [
          {
            model: UserProfile,
            as: "profile",
          },
        ],
        transaction,
      });

      if (!user) {
        throw new AppError(Messages.USER_NOT_FOUND, STATUS_CODE.NOT_FOUND);
      }

      await User.update(data, {
        where: { id: userId },
        transaction,
      });

      await UserProfile.update(data, {
        where: { userId },
        transaction,
      });

      const updatedUser = await User.findOne({
        where: { id: userId },
        include: [
          {
            model: UserProfile,
            as: "profile",
          },
        ],
        transaction,
      });

      return updatedUser;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UserRepository;
