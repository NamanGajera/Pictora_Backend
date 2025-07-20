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
      console.log("Login Error -->>", error);
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
