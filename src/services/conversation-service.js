const db = require("../models");
const { ConversationRepository } = require("../repositories");
const { Messages, Enums } = require("../utils/common");
const { BaseError } = require("sequelize");
const { getIO } = require("../config/socket");
const { getRedis } = require("../config/redis");
const AppError = require("../utils/errors/app-error");

const conversationRepository = new ConversationRepository();
const { STATUS_CODE } = Enums;

class ConversationService {
    get io() {
        return getIO();
    }

    get redis() {
        return getRedis();
    }

    #handleError(error) {
        console.log("Error -->", error);
        if (error instanceof AppError) {
            throw error;
        }
        if (error instanceof BaseError) {
            const message =
                error.errors?.[0]?.message || error.message || Messages.SOMETHING_WRONG;
            throw new AppError(message, STATUS_CODE.BAD_REQUEST);
        }
        throw new AppError(
            Messages.SOMETHING_WRONG,
            STATUS_CODE.INTERNAL_SERVER_ERROR
        );
    }


    async createConversation(data) {
        const transaction = await db.sequelize.transaction();

        try {
            const conversation = await conversationRepository.createConversation(data, transaction);
            await transaction.commit();
            return conversation;
        } catch (error) {
            await transaction.rollback();
            this.#handleError(error);
        }
    }

    async getAllConversationsForUser(userId) {
        try {

            const conversations = await conversationRepository.getAllConversationsForUser(userId);
            return conversations;
        } catch (error) {
            this.#handleError(error);
        }
    }

    async createMessage(data) {
        const transaction = await db.sequelize.transaction();
        try {
            const message = await conversationRepository.createMessage(data, transaction);
            await transaction.commit();

            return message;
        } catch (error) {
            await transaction.rollback();
            this.#handleError(error);
        }
    }

    async getMessagesForConversation(data) {
        try {
            const { conversationId, userId, skip = 0, take = 10, } = data;
            const { messages, total } = await conversationRepository.getMessagesForConversation(
                conversationId,
                userId,
                { skip: parseInt(skip), take: parseInt(take) },
            );

            return {
                messages,
                total,
            };
        } catch (error) {

            this.#handleError(error);
        }
    }
}

module.exports = new ConversationService();
