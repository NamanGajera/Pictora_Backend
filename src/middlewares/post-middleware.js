const { ErrorResponse, Enums, Messages, Regex } = require("../utils/common");
const { STATUS_CODE } = Enums;

class PostMiddleware {
  validatePostLikeRequest(req, res, next) {
    if (!req.body) {
      ErrorResponse.message = Messages.REQUIRED_BODY;
      ErrorResponse.statusCode = STATUS_CODE.BAD_REQUEST;
      return res.status(STATUS_CODE.BAD_REQUEST).json(ErrorResponse);
    }

    const requiredFields = ["postId", "isLike"];
    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null) {
        ErrorResponse.message = Messages.REQUIRED_FIELD(field);
        return res.status(STATUS_CODE.BAD_REQUEST).json(ErrorResponse);
      }
    }
    next();
  }

  validatePostSaveRequest(req, res, next) {
    if (!req.body) {
      ErrorResponse.message = Messages.REQUIRED_BODY;
      ErrorResponse.statusCode = STATUS_CODE.BAD_REQUEST;
      return res.status(STATUS_CODE.BAD_REQUEST).json(ErrorResponse);
    }

    const requiredFields = ["postId", "isSave"];
    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null) {
        ErrorResponse.message = Messages.REQUIRED_FIELD(field);
        return res.status(STATUS_CODE.BAD_REQUEST).json(ErrorResponse);
      }
    }
    next();
  }

  validatePostArchiveRequest(req, res, next) {
    if (!req.body) {
      ErrorResponse.message = Messages.REQUIRED_BODY;
      ErrorResponse.statusCode = STATUS_CODE.BAD_REQUEST;
      return res.status(STATUS_CODE.BAD_REQUEST).json(ErrorResponse);
    }

    const requiredFields = ["postId", "isArchive"];
    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null) {
        ErrorResponse.message = Messages.REQUIRED_FIELD(field);
        return res.status(STATUS_CODE.BAD_REQUEST).json(ErrorResponse);
      }
    }
    next();
  }
}

module.exports = new PostMiddleware();
