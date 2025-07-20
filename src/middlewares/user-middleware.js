const { ErrorResponse, Enums, Messages, Regex } = require("../utils/common");
const { STATUS_CODE } = Enums;

class UserMiddleware {
  validateLoginRequest(req, res, next) {
    if (!req.body) {
      ErrorResponse.message = Messages.REQUIRED_BODY;
      ErrorResponse.statusCode = STATUS_CODE.BAD_REQUEST;
      return res.status(STATUS_CODE.BAD_REQUEST).json(ErrorResponse);
    }

    const { email, password } = req.body;

    const requiredFields = ["email", "password"];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        ErrorResponse.message = Messages.REQUIRED_FIELD(field);
        return res.status(STATUS_CODE.BAD_REQUEST).json(ErrorResponse);
      }
    }

    if (!Regex.EMAIL.test(email)) {
      ErrorResponse.message = Messages.INVALID_EMAIL;
      return res.status(STATUS_CODE.BAD_REQUEST).json(ErrorResponse);
    }

    next();
  }
  validateRegisterRequest(req, res, next) {
    if (!req.body) {
      ErrorResponse.message = Messages.REQUIRED_BODY;
      ErrorResponse.statusCode = STATUS_CODE.BAD_REQUEST;
      return res.status(STATUS_CODE.BAD_REQUEST).json(ErrorResponse);
    }
    const { fullName, username, email, password } = req.body;

    const requiredFields = ["fullName", "username", "email", "password"];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        ErrorResponse.message = Messages.REQUIRED_FIELD(field);
        return res.status(STATUS_CODE.BAD_REQUEST).json(ErrorResponse);
      }
    }

    if (!Regex.EMAIL.test(email)) {
      ErrorResponse.message = Messages.INVALID_EMAIL;
      return res.status(STATUS_CODE.BAD_REQUEST).json(ErrorResponse);
    }
    next();
  }
}

module.exports = new UserMiddleware();
