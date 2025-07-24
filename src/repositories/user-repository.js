const { User, UserCount, Follow, FollowRequest } = require("../models");
const CrudRepository = require("./crud-repository");
const AppError = require("../utils/errors/app-error");
const { Enums, Messages } = require("../utils/common");

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
}

module.exports = UserRepository;
