const {
    Conversation,
    ConversationMember,
    ConversationMessage,
    ConversationMessageAttachment,
    User,
    UserProfile,
    Post,
    PostMedia,
    sequelize,
} = require("../models");
const { Sequelize } = require("sequelize");
const CloudinaryService = require("../services/cloudinary-service");
const { getFileType } = require("../utils/helpers/getFileType");
const CrudRepository = require("./crud-repository");
const PostRepository = require("./post-repository");

const { Enums, Messages } = require("../utils/common");
const { CONVERSATION_MESSAGE_ATTACHMENT_TYPE } = Enums;
const postRepository = new PostRepository();
const AppError = require("../utils/errors/app-error");
const { Op } = require("sequelize");

class ConversationRepository {
    postAttributes = [
        "id",
        "userId",
        "caption",
        "likeCount",
        "repostCount",
        "commentCount",
        "shareCount",
        "saveCount",
        "createdAt",
        "updatedAt",
    ];

    #buildExistsAttribute(table, userId, alias) {
        return [
            Sequelize.literal(`
                EXISTS (
                    SELECT 1 FROM ${table}
                    WHERE ${table}.postId = postData.id
                    AND ${table}.userId = ${sequelize.escape(userId)}
                )
            `),
            alias,
        ];
    }

    #transformPostData(post) {
        if (!post) return post;

        // Convert 0/1 to boolean
        const booleanFields = ['isLiked', 'isSaved', 'isArchived', 'isRepost'];
        booleanFields.forEach(field => {
            if (post[field] !== undefined) {
                post[field] = Boolean(post[field]);
            }
        });

        return post;
    }

    #getPostIncludeConfig(userId) {
        return {
            model: Post,
            as: "postData",
            include: [
                {
                    model: PostMedia,
                    as: "mediaData",
                },
                {
                    model: User,
                    as: "userData",
                    include: [
                        {
                            model: UserProfile,
                            as: "profile",
                            attributes: ["profilePicture", "isPrivate"],
                        },
                    ],
                    attributes: ["id", "fullName", "userName", "email"],
                },
            ],
            attributes: {
                include: [
                    ...this.postAttributes,
                    this.#buildExistsAttribute("PostLikes", userId, "isLiked"),
                    this.#buildExistsAttribute("PostSaves", userId, "isSaved"),
                    this.#buildExistsAttribute("PostArchives", userId, "isArchived"),
                    this.#buildExistsAttribute("Reposts", userId, "isRepost"),
                ],
            },
        };
    }

    #getSenderIncludeConfig() {
        return {
            model: User,
            as: "senderData",
            attributes: ["id", "userName", "fullName"],
            include: [
                {
                    model: UserProfile,
                    as: "profile",
                    attributes: ["profilePicture"]
                }
            ],
        };
    }


    #getRepliedMessageIncludeConfig() {
        return {
            model: ConversationMessage,
            as: "repliedMessageData",
            attributes: ["id", "message", "createdAt"],
            include: [
                {
                    model: User,
                    as: "senderData",
                    attributes: ["id", "userName", "fullName"],
                    include: [
                        {
                            model: UserProfile,
                            as: "profile",
                            attributes: ["profilePicture"]
                        }
                    ],
                },
                {
                    model: ConversationMessageAttachment,
                    as: "attachments",
                    attributes: ["id", "url", "thumbnailUrl", "type"],
                    limit: 1
                }
            ],
        };
    }

    #getAttachmentsIncludeConfig() {
        return {
            model: ConversationMessageAttachment,
            as: "attachments",
            attributes: ["id", "messageId", "url", "thumbnailUrl", "publicId", "metadata", "type"],
        };
    }

    async createConversation(data, transaction) {
        try {
            const { initiatorUserId, recipientUserId } = data;

            const existingConversation = await Conversation.findOne({
                where: { type: Enums.CONVERSATION_TYPE.PRIVATE },
                include: [
                    {
                        model: ConversationMember,
                        as: "members",
                        where: { userId: initiatorUserId },
                        attributes: [],
                    },
                    {
                        model: ConversationMember,
                        as: "members",
                        where: { userId: recipientUserId },
                        attributes: [],
                    },
                ],
                transaction,
            });

            if (existingConversation) {
                throw new AppError(Messages.CONVERSATION_EXISTS, Enums.STATUS_CODE.BAD_REQUEST);
            }

            const newConversation = await Conversation.create(
                { type: Enums.CONVERSATION_TYPE.PRIVATE },
                { transaction }
            );

            const members = [
                { conversationId: newConversation.id, userId: initiatorUserId },
                { conversationId: newConversation.id, userId: recipientUserId },
            ];

            await ConversationMember.bulkCreate(members, { transaction });

            return newConversation;
        } catch (error) {
            throw error;
        }
    }

    async getAllConversationsForUser(userId) {
        try {
            const userConversations = await ConversationMember.findAll({
                where: { userId },
                attributes: ["conversationId"],
                raw: true
            });

            const conversationIds = userConversations.map(cm => cm.conversationId);

            if (conversationIds.length === 0) {
                return [];
            }

            const conversations = await Conversation.findAll({
                where: { id: conversationIds },
                include: [
                    {
                        model: ConversationMember,
                        as: "members",
                        where: { userId: { [Op.ne]: userId } },
                        attributes: ["userId"],
                        include: [
                            {
                                model: User,
                                as: "userData",
                                attributes: ["id", "userName", "fullName"],
                                include: [
                                    {
                                        model: UserProfile,
                                        as: "profile",
                                        attributes: ["profilePicture"]
                                    }
                                ],
                            },
                        ],
                    },
                    {
                        model: ConversationMessage,
                        as: "lastMessageData",
                        attributes: ["id", "message", "createdAt"],
                    },
                ],
                order: [["updatedAt", "DESC"]],
            });

            return conversations.map(conv => ({
                id: conv.id,
                type: conv.type,
                title: conv.title,
                lastMessage: conv.lastMessageData,
                otherUser: conv.members[0]?.userData || null,
                updatedAt: conv.updatedAt,
            }));
        } catch (error) {
            throw error;
        }
    }

    async createMessage(data, transaction) {
        try {
            const { conversationId, senderId, message, postId, replyToMessageId, mediaFiles = [], thumbnailFiles = [] } = data;

            const messageData = await ConversationMessage.create(data, { transaction });

            const attachments = await this.#processMediaFiles(
                messageData.id,
                mediaFiles,
                thumbnailFiles,
                transaction
            );

            let postData = null;
            if (postId) {
                postData = await postRepository.getSinglePost(senderId, postId, transaction);
            }

            let repliedMessageData = null;
            if (replyToMessageId) {
                repliedMessageData = await ConversationMessage.findByPk(replyToMessageId, {
                    include: [
                        {
                            model: User,
                            as: "senderData",
                            attributes: ["id", "userName", "fullName"],
                        },
                        {
                            model: ConversationMessageAttachment,
                            as: "attachments",
                            attributes: ["id", "url", "thumbnailUrl", "type"],
                            limit: 1
                        }
                    ],
                    transaction
                });
            }

            return {
                ...messageData.toJSON(),
                attachments,
                postData,
                repliedMessageData
            };
        } catch (error) {
            throw error;
        }
    }

    async #processMediaFiles(messageId, mediaFiles, thumbnailFiles, transaction) {
        const mediaProcessingPromises = mediaFiles.map(async (file, index) => {
            const mediaType = getFileType(file.mimetype);

            const uploadedMedia = await CloudinaryService.uploadBuffer(
                file.buffer,
                "messagesAttachments"
            );

            let thumbnailUrl = null;
            if ([CONVERSATION_MESSAGE_ATTACHMENT_TYPE.VIDEO].includes(mediaType)) {
                thumbnailUrl = await this.#processVideoThumbnail(thumbnailFiles[index]);
            }

            return await ConversationMessageAttachment.create(
                {
                    messageId,
                    url: uploadedMedia.secure_url,
                    thumbnailUrl,
                    type: mediaType,
                    publicId: uploadedMedia.public_id,
                },
                { transaction }
            );
        });

        return Promise.all(mediaProcessingPromises);
    }

    async #processVideoThumbnail(thumbnailFile) {
        if (!thumbnailFile) {
            console.warn('No thumbnail provided for video');
            return null;
        }

        const uploadedThumbnail = await CloudinaryService.uploadBuffer(
            thumbnailFile.buffer,
            "messagesAttachments/thumbnails"
        );
        return uploadedThumbnail.secure_url;
    }

    async getMessagesForConversation(conversationId, userId, { skip = 0, take = 50 }) {
        try {
            const { count, rows: messages } = await ConversationMessage.findAndCountAll({
                where: { conversationId },
                distinct: true,
                include: [
                    this.#getSenderIncludeConfig(),
                    this.#getPostIncludeConfig(userId),
                    this.#getAttachmentsIncludeConfig(),
                    this.#getRepliedMessageIncludeConfig(),
                ],
                offset: skip,
                limit: take,
                order: [["createdAt", "ASC"]],
            });

            const transformedMessages = messages.map(message => {
                if (message.postData) {
                    message.postData = this.#transformPostData(message.postData);
                }
                return message;
            });

            return {
                total: count,
                messages: transformedMessages,
            };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = ConversationRepository;