const { ErrorResponse, Enums, Messages } = require("../utils/common");
const { STATUS_CODE } = Enums;

class ConversationMiddleware {
  validateCreateConversationRequest(req, res, next) {
    if (!req.body) {
      ErrorResponse.message = Messages.REQUIRED_BODY;
      ErrorResponse.statusCode = STATUS_CODE.BAD_REQUEST;
      return res.status(STATUS_CODE.BAD_REQUEST).json(ErrorResponse);
    }

    console.log("Request Body:", req.body);

    const { type, members, userId } = req.body;

    if (!type || type.toString().trim() === "") {
      ErrorResponse.message = Messages.REQUIRED_FIELD("type");
      ErrorResponse.statusCode = STATUS_CODE.BAD_REQUEST;
      return res.status(STATUS_CODE.BAD_REQUEST).json(ErrorResponse);
    }

    if (type === Enums.CONVERSATION_TYPE.PRIVATE) {
      if (!userId || userId.toString().trim() === "") {
        ErrorResponse.message = Messages.REQUIRED_FIELD("userId");
        ErrorResponse.statusCode = STATUS_CODE.BAD_REQUEST;
        return res.status(STATUS_CODE.BAD_REQUEST).json(ErrorResponse);
      }
    }

    if (type === Enums.CONVERSATION_TYPE.GROUP) {
      if (!members || !Array.isArray(members) || members.length < 2) {
        ErrorResponse.message = Messages.GROUP_HAVE_TWO_MEMBER;
        ErrorResponse.statusCode = STATUS_CODE.BAD_REQUEST;
        return res.status(STATUS_CODE.BAD_REQUEST).json(ErrorResponse);
      }

      const uniqueMembers = new Set(members);
      if (uniqueMembers.size !== members.length) {
        ErrorResponse.message = Messages.DUPLICATED_MEMBER_ID;
        ErrorResponse.statusCode = STATUS_CODE.BAD_REQUEST;
        return res.status(STATUS_CODE.BAD_REQUEST).json(ErrorResponse);
      }

      if (
        req.files &&
        req.files.groupImage &&
        req.files.groupImage.length > 1
      ) {
        ErrorResponse.message = Messages.ONLY_ONE_GROUP_IMAGE;
        ErrorResponse.statusCode = STATUS_CODE.BAD_REQUEST;
        return res.status(STATUS_CODE.BAD_REQUEST).json(ErrorResponse);
      }

      if (!req.body.title || req.body.title.toString().trim() === "") {
        ErrorResponse.message = Messages.REQUIRED_FIELD("title");
        ErrorResponse.statusCode = STATUS_CODE.BAD_REQUEST;
        return res.status(STATUS_CODE.BAD_REQUEST).json(ErrorResponse);
      }
    }

    next();
  }

  validateCreateConversationMessageRequest(req, res, next) {
    if (!req.body || Object.keys(req.body).length === 0) {
      ErrorResponse.message = Messages.REQUIRED_BODY;
      ErrorResponse.statusCode = STATUS_CODE.BAD_REQUEST;
      return res.status(STATUS_CODE.BAD_REQUEST).json(ErrorResponse);
    }

    console.log("Request Body:", req.body);

    const requiredFields = ["conversationId"];
    for (const field of requiredFields) {
      const value = req.body[field];
      if (
        value === undefined ||
        value === null ||
        value.toString().trim() === ""
      ) {
        ErrorResponse.message = Messages.REQUIRED_FIELD(field);
        ErrorResponse.statusCode = STATUS_CODE.BAD_REQUEST;
        return res.status(STATUS_CODE.BAD_REQUEST).json(ErrorResponse);
      }
    }
    next();
  }

  validateGetMessagesRequest(req, res, next) {
    if (!req.body) {
      ErrorResponse.message = Messages.REQUIRED_BODY;
      ErrorResponse.statusCode = STATUS_CODE.BAD_REQUEST;
      return res.status(STATUS_CODE.BAD_REQUEST).json(ErrorResponse);
    }

    console.log("Request Body:", req.body);

    const requiredFields = ["conversationId"];
    for (const field of requiredFields) {
      const value = req.body[field];
      if (
        value === undefined ||
        value === null ||
        value.toString().trim() === ""
      ) {
        ErrorResponse.message = Messages.REQUIRED_FIELD(field);
        ErrorResponse.statusCode = STATUS_CODE.BAD_REQUEST;
        return res.status(STATUS_CODE.BAD_REQUEST).json(ErrorResponse);
      }
    }
    next();
  }
}

module.exports = new ConversationMiddleware();
