const bcrypt = require("bcrypt");
const db = require("../models");
const { User, UserProfile } = require("../models");
const { UserRepository, UserProfileRepository } = require("../repositories");
const { Messages, Enums } = require("../utils/common");
const { BaseError } = require("sequelize");
const AppError = require("../utils/errors/app-error");
const { generateToken } = require("../utils/helpers/jwt");
const CloudinaryService = require("./cloudinary-service");

const { STATUS_CODE } = Enums;
const userRepository = new UserRepository();
const userProfileRepository = new UserProfileRepository();

class UserService {
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
  async login(data) {
    try {
      const user = await User.findOne({
        where: { email: data.email },
        include: [
          {
            model: UserProfile,
            as: "profile",
            attributes: ["profilePicture", "gender", "isPrivate"],
          },
        ],
      });

      if (!user) {
        throw new AppError(Messages.USER_NOT_FOUND, STATUS_CODE.NOT_FOUND);
      }
      const isMatch = await bcrypt.compare(data.password, user.password);
      if (!isMatch) {
        throw new AppError(
          Messages.INVALID_CREDENTIAL,
          STATUS_CODE.INTERNAL_SERVER_ERROR
        );
      }
      const token = generateToken(user.id);
      return { token, user };
    } catch (error) {
      this.#handleError(error);
    }
  }
  async userRegister(data) {
    const transaction = await db.sequelize.transaction();

    try {
      const { fullName, userName, email, password } = data;
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log("User Data --->>>>>> ", data);
      const user = await userRepository.registerUser(
        {
          fullName,
          userName,
          email,
          password: hashedPassword,
        },
        transaction
      );
      await userProfileRepository.addUserData(
        {
          userId: user.id,
          fullName,
          userName,
          email,
        },
        transaction
      );
      const token = generateToken(user.id);
      await transaction.commit();
      return { token, user };
    } catch (error) {
      await transaction.rollback();
      this.#handleError(error);
    }
  }

  async toggleFollow(data) {
    const transaction = await db.sequelize.transaction();
    console.log("Usr Data--->", data);
    try {
      const response = await userRepository.toggleFollow(data, transaction);
      await transaction.commit();
      return response;
    } catch (error) {
      await transaction.rollback();
      this.#handleError(error);
    }
  }

  async getUserData(userId, currentUserId) {
    try {
      const user = await userRepository.getUserProfileData(
        userId,
        currentUserId
      );
      return user;
    } catch (error) {
      this.#handleError(error);
    }
  }

  async getAllFollowRequests(userId) {
    try {
      const users = await userRepository.getAllFollowRequests(userId);
      return users;
    } catch (error) {
      this.#handleError(error);
    }
  }

  async manageFollowRequest(data) {
    const transaction = await db.sequelize.transaction();
    console.log("Usr Data--->", data);
    try {
      const response = await userRepository.manageFollowRequest(
        data,
        transaction
      );
      await transaction.commit();
      return response;
    } catch (error) {
      await transaction.rollback();
      this.#handleError(error);
    }
  }
  async getAllFollowers(data) {
    const { userId, currentUserId, skip = 0, take = 10 } = data;
    console.log("Usr Data--->", { userId, currentUserId });
    try {
      const { users, total } = await userRepository.getAllFollowers(
        userId,
        currentUserId,
        { skip: parseInt(skip), take: parseInt(take) }
      );
      return { users, total };
    } catch (error) {
      this.#handleError(error);
    }
  }
  async getAllFollowingUsers(data) {
    const { userId, currentUserId, skip = 0, take = 10 } = data;
    console.log("Usr Data--->", { userId, currentUserId });
    try {
      const { users, total } = await userRepository.getAllFollowingUser(
        userId,
        currentUserId,
        { skip: parseInt(skip), take: parseInt(take) }
      );
      return { users, total };
    } catch (error) {
      this.#handleError(error);
    }
  }
  async updateUserProfile(userId, data, files) {
    const transaction = await db.sequelize.transaction();
    const { userName, fullName, bio, isPrivate } = data;
    try {
      const updatedData = {};

      if (userName) {
        updatedData.userName = userName;
      }
      if (fullName) {
        updatedData.fullName = fullName;
      }

      if (bio) {
        updatedData.bio = bio;
      }

      if (isPrivate) {
        updatedData.isPrivate = isPrivate;
      }

      if (files) {
        const uploadedMedia = await CloudinaryService.uploadBuffer(
          files.buffer,
          "userProfile"
        );
        updatedData.profilePicture = uploadedMedia.secure_url || null;
      }

      const updatedUser = await userRepository.updateUser(
        userId,
        updatedData,
        transaction
      );
      await transaction.commit();
      return updatedUser;
    } catch (error) {
      await transaction.rollback();
      this.#handleError(error);
    }
  }

  async getDiscoverUsers(data) {
    const { userId, skip = 0, take = 10 } = data;
    try {
      const { users, total } = await userRepository.getDiscoverUsers(userId, {
        skip: parseInt(skip),
        take: parseInt(take),
      });
      return { users, total };
    } catch (error) {
      this.#handleError(error);
    }
  }

  async searchUsers(data) {
    const transaction = await db.sequelize.transaction();

    try {
      const users = await userRepository.searchUsers(data, transaction);
      await transaction.commit();
      return users;
    } catch (error) {
      await transaction.rollback();
      this.#handleError(error);
    }
  }
}

module.exports = new UserService();
