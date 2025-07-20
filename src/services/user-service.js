const bcrypt = require("bcrypt");
const db = require("../models");
const { UserRepository, UserProfileRepository } = require("../repositories");
const { Messages, Enums } = require("../utils/common");
const { BaseError } = require("sequelize");
const AppError = require("../utils/errors/app-error");
const { generateToken } = require("../utils/helpers/jwt");

const { STATUS_CODE } = Enums;
const userRepository = new UserRepository();
const userProfileRepository = new UserProfileRepository();

class UserService {
  async login(data) {
    try {
      const user = await userRepository.findOne({ email: data.email });
      console.log("user data", user);
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
  async userRegister(data) {
    const transaction = await db.sequelize.transaction();

    try {
      const { full_name, username, email, password } = data;
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await userRepository.registerUser(
        {
          full_name,
          username,
          email,
          password_hash: hashedPassword,
        },
        transaction
      );
      await userProfileRepository.addUserData(
        {
          user_id: user.id,
          full_name,
          username,
          email,
        },
        transaction
      );
      const token = generateToken(user.id);
      await transaction.commit();
      return { token, user };
    } catch (error) {
      await transaction.rollback();
      console.log("REGISTER USER ERROR -->>>>\n", error);
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

module.exports = new UserService();
