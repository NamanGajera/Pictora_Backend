const { ErrorResponse, Enums, Messages, Regex } = require("../utils/common");
const { STATUS_CODE } = Enums;

class CommentMiddleware {
  validateCreateCommentRequest(req, res, next) {
    if (!req.body) {
      ErrorResponse.message = Messages.REQUIRED_BODY;
      ErrorResponse.statusCode = STATUS_CODE.BAD_REQUEST;
      return res.status(STATUS_CODE.BAD_REQUEST).json(ErrorResponse);
    }

    const requiredFields = ["postId", "comment"];
    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null) {
        ErrorResponse.message = Messages.REQUIRED_FIELD(field);
        return res.status(STATUS_CODE.BAD_REQUEST).json(ErrorResponse);
      }
    }
    next();
  }

  validateCommentLikeRequest(req, res, next) {
    if (!req.body) {
      ErrorResponse.message = Messages.REQUIRED_BODY;
      ErrorResponse.statusCode = STATUS_CODE.BAD_REQUEST;
      return res.status(STATUS_CODE.BAD_REQUEST).json(ErrorResponse);
    }

    const requiredFields = ["commentId", "isLike"];
    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null) {
        ErrorResponse.message = Messages.REQUIRED_FIELD(field);
        return res.status(STATUS_CODE.BAD_REQUEST).json(ErrorResponse);
      }
    }
    next();
  }
}

module.exports = new CommentMiddleware();
