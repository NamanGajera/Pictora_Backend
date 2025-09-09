const { ErrorResponse, Enums, Messages, } = require("../utils/common");
const { STATUS_CODE } = Enums;

class ConversationMiddleware {
    validateCreateConversationRequest(req, res, next) {
        if (!req.body) {
            ErrorResponse.message = Messages.REQUIRED_BODY;
            ErrorResponse.statusCode = STATUS_CODE.BAD_REQUEST;
            return res.status(STATUS_CODE.BAD_REQUEST).json(ErrorResponse);
        }

        console.log("Request Body:", req.body);

        const requiredFields = ["userId"];
        for (const field of requiredFields) {
            const value = req.body[field];
            if (value === undefined || value === null || value.toString().trim() === "") {
                ErrorResponse.message = Messages.REQUIRED_FIELD(field);
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
            if (value === undefined || value === null || value.toString().trim() === "") {
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
            if (value === undefined || value === null || value.toString().trim() === "") {
                ErrorResponse.message = Messages.REQUIRED_FIELD(field);
                ErrorResponse.statusCode = STATUS_CODE.BAD_REQUEST;
                return res.status(STATUS_CODE.BAD_REQUEST).json(ErrorResponse);
            }
        }
        next();
    }

}

module.exports = new ConversationMiddleware();