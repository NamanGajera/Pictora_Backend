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
      const message = error.message || "Internal Server Error";

      ErrorResponse.message = message;
      ErrorResponse.statusCode = status;

      return res.status(status).json(ErrorResponse);
    }
  }
  async register(req, res) {
    const { fullName, username, email, password } = req.body;
    try {
      const user = await UserService.userRegister({
        full_name: fullName,
        username,
        email,
        password,
      });
      SuccessResponse.data = user;
      SuccessResponse.message = Messages.USER_REGISTERED;
      res.status(STATUS_CODE.OK).json(SuccessResponse);
    } catch (error) {
      const status = error.statusCode || 500;
      const message = error.message || "Internal Server Error";

      ErrorResponse.message = message;
      ErrorResponse.statusCode = status;

      return res.status(status).json(ErrorResponse);
    }
  }
}

module.exports = new UserController();
