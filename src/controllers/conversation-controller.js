const { ConversationService } = require("../services");
const {
    SuccessResponse,
    Enums,
    Messages,
    ErrorResponse,
} = require("../utils/common");

const { STATUS_CODE } = Enums;

class ConversationController {
    async createConversation(req, res) {
        try {
            const data = {
                initiatorUserId: req.user.id,
                recipientUserId: req.body.userId,
            };
            const response = await ConversationService.createConversation(data);
            SuccessResponse.data = response;
            SuccessResponse.message = Messages.CONVERSATION_CREATED;
            return res.status(STATUS_CODE.OK).json(SuccessResponse);
        } catch (error) {
            ErrorResponse.message = error.message;
            ErrorResponse.statusCode = error.statusCode;
            return res
                .status(error.statusCode || STATUS_CODE.INTERNAL_SERVER_ERROR)
                .json(ErrorResponse);
        }
    }

    async getAllConversations(req, res) {
        try {
            const conversation = await ConversationService.getAllConversationsForUser(req.user.id);
            SuccessResponse.data = conversation;
            SuccessResponse.message = Messages.FETCHED_SUCCESS;
            return res.status(STATUS_CODE.OK).json(SuccessResponse);
        } catch (error) {
            ErrorResponse.message = error.message;
            ErrorResponse.statusCode = error.statusCode;
            return res
                .status(error.statusCode || STATUS_CODE.INTERNAL_SERVER_ERROR)
                .json(ErrorResponse);
        }
    }

    async createMessage(req, res) {
        try {
            const { conversationId, postId, message, replyToMessageId } = req.body;

            const data = {
                conversationId: conversationId,
                senderId: req.user.id,
                mediaFiles: req.files?.media || [],
                thumbnailFiles: req.files?.thumbnails || [],
            }

            if (postId) data.postId = postId;
            if (message) data.message = message;
            if (replyToMessageId) data.replyToMessageId = replyToMessageId;

            const response = await ConversationService.createMessage(data);
            SuccessResponse.data = response;
            SuccessResponse.message = Messages.MESSAGE_SENT;
            return res.status(STATUS_CODE.OK).json(SuccessResponse);

        } catch (error) {
            ErrorResponse.message = error.message;
            ErrorResponse.statusCode = error.statusCode;
            return res
                .status(error.statusCode || STATUS_CODE.INTERNAL_SERVER_ERROR)
                .json(ErrorResponse);
        }
    }

    async getMessagesForConversation(req, res) {
        try {
            const response = await ConversationService.getMessagesForConversation({
                conversationId: req.body.conversationId,
                userId: req.user.id,
                skip: req.body.skip,
                take: req.body.take,
            });
            SuccessResponse.data = response.messages;
            SuccessResponse.message = Messages.FETCHED_SUCCESS;
            const totalData = response.total;
            return res
                .status(STATUS_CODE.OK)
                .json({ ...SuccessResponse, total: totalData, });

        } catch (error) {
            ErrorResponse.message = error.message;
            ErrorResponse.statusCode = error.statusCode;
            return res
                .status(error.statusCode || STATUS_CODE.INTERNAL_SERVER_ERROR)
                .json(ErrorResponse);
        }
    }
}


module.exports = new ConversationController();
