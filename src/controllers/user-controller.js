const { UserService } = require("../services");
const {
  SuccessResponse,
  Enums,
  Messages,
  ErrorResponse,
} = require("../utils/common");

const { STATUS_CODE } = Enums;

class UserController {
  async login(req, res) {
    try {
      const user = await UserService.login(req.body);
      SuccessResponse.data = user;
      SuccessResponse.message = Messages.LOGIN_SUCCESS;
      res.status(STATUS_CODE.OK).json(SuccessResponse);
    } catch (error) {
      const status = error.statusCode || 500;
      const message = error.message || Messages.SERVER_ERROR;

      ErrorResponse.message = message;
      ErrorResponse.statusCode = status;

      return res.status(status).json(ErrorResponse);
    }
  }
  async register(req, res) {
    const { fullName, userName, email, password } = req.body;
    try {
      const user = await UserService.userRegister({
        fullName,
        userName,
        email,
        password,
      });
      SuccessResponse.data = user;
      SuccessResponse.message = Messages.USER_REGISTERED;
      res.status(STATUS_CODE.OK).json(SuccessResponse);
    } catch (error) {
      console.log("Error--> ", error);
      const status = error.statusCode || 500;
      const message = error.message || Messages.SERVER_ERROR;

      ErrorResponse.message = message;
      ErrorResponse.statusCode = status;

      return res.status(status).json(ErrorResponse);
    }
  }
  async toggleFollow(req, res) {
    try {
      const response = await UserService.toggleFollow({
        followerId: req.user.id,
        followingId: req.body.userId,
        shouldFollow: req.body.shouldFollow,
      });
      res.status(STATUS_CODE.OK).json(response);
    } catch (error) {
      const status = error.statusCode || 500;
      const message = error.message || Messages.SERVER_ERROR;

      ErrorResponse.message = message;
      ErrorResponse.statusCode = status;

      return res.status(status).json(ErrorResponse);
    }
  }

  async getUserData(req, res) {
    const userId = req.params.userId || req.user.id;
    try {
      const user = await UserService.getUserData(userId, req.user.id);
      SuccessResponse.data = user;
      SuccessResponse.message = Messages.FETCHED_SUCCESS;
      res.status(STATUS_CODE.OK).json(SuccessResponse);
    } catch (error) {
      const status = error.statusCode || 500;
      const message = error.message || Messages.SERVER_ERROR;

      ErrorResponse.message = message;
      ErrorResponse.statusCode = status;

      return res.status(status).json(ErrorResponse);
    }
  }

  async getAllFollowRequests(req, res) {
    try {
      const users = await UserService.getAllFollowRequests(req.user.id);
      SuccessResponse.data = users;
      SuccessResponse.message = Messages.FETCHED_SUCCESS;
      res.status(STATUS_CODE.OK).json(SuccessResponse);
    } catch (error) {
      const status = error.statusCode || 500;
      const message = error.message || Messages.SERVER_ERROR;

      ErrorResponse.message = message;
      ErrorResponse.statusCode = status;

      return res.status(status).json(ErrorResponse);
    }
  }

  async manageFollowRequest(req, res) {
    try {
      const response = await UserService.manageFollowRequest({
        requestId: req.body.id,
        isAccept: req.body.isAccept,
        targetUserId: req.user.id,
      });

      res.status(STATUS_CODE.OK).json(response);
    } catch (error) {
      const status = error.statusCode || 500;
      const message = error.message || Messages.SERVER_ERROR;

      ErrorResponse.message = message;
      ErrorResponse.statusCode = status;

      return res.status(status).json(ErrorResponse);
    }
  }
  async getAllFollowers(req, res) {
    const userId = req.body.userId || req.user.id;
    try {
      const response = await UserService.getAllFollowers({
        userId,
        currentUserId: req.user.id,
        skip: req.body.skip,
        take: req.body.take,
      });
      SuccessResponse.data = response.users;
      SuccessResponse.message = Messages.FETCHED_SUCCESS;
      const totalData = response.total;
      return res
        .status(STATUS_CODE.OK)
        .json({ ...SuccessResponse, total: totalData });
    } catch (error) {
      const status = error.statusCode || 500;
      const message = error.message || Messages.SERVER_ERROR;

      ErrorResponse.message = message;
      ErrorResponse.statusCode = status;

      return res.status(status).json(ErrorResponse);
    }
  }
  async getAllFollowingUsers(req, res) {
    const userId = req.body.userId || req.user.id;
    try {
      const response = await UserService.getAllFollowingUsers({
        userId,
        currentUserId: req.user.id,
        skip: req.body.skip,
        take: req.body.take,
      });

      SuccessResponse.data = response.users;
      SuccessResponse.message = Messages.FETCHED_SUCCESS;
      const totalData = response.total;
      return res
        .status(STATUS_CODE.OK)
        .json({ ...SuccessResponse, total: totalData });
    } catch (error) {
      console.log("Error in getAllFollowingUsers: ", error);
      const status = error.statusCode || 500;
      const message = error.message || Messages.SERVER_ERROR;

      ErrorResponse.message = message;
      ErrorResponse.statusCode = status;

      return res.status(status).json(ErrorResponse);
    }
  }
  async updateUserProfile(req, res) {
    const userId = req.user.id;
    try {
      const users = await UserService.updateUserProfile(
        userId,
        {},
        req.files?.profilePic?.[0] ?? null
      );
      SuccessResponse.data = users;
      SuccessResponse.message = Messages.FETCHED_SUCCESS;
      res.status(STATUS_CODE.OK).json(SuccessResponse);
    } catch (error) {
      const status = error.statusCode || 500;
      const message = error.message || Messages.SERVER_ERROR;

      ErrorResponse.message = message;
      ErrorResponse.statusCode = status;

      return res.status(status).json(ErrorResponse);
    }
  }

  async getDiscoverUsers(req, res) {
    const userId = req.user.id;

    try {
      const response = await UserService.getDiscoverUsers({
        userId,
        skip: req.body.skip || 0,
        take: req.body.take || 10,
      });
      SuccessResponse.data = response.users;
      SuccessResponse.message = Messages.FETCHED_SUCCESS;
      const totalData = response.total;
      return res
        .status(STATUS_CODE.OK)
        .json({ ...SuccessResponse, total: totalData });
    } catch (error) {
      const status = error.statusCode || 500;
      const message = error.message || Messages.SERVER_ERROR;

      ErrorResponse.message = message;
      ErrorResponse.statusCode = status;

      return res.status(status).json(ErrorResponse);
    }
  }
}

module.exports = new UserController();
