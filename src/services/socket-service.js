const { getIO, getRedis } = require('../config/redis');
const { createPresenceService } = require('./user-presence-service');
const { socketAuthMiddleware } = require('../middlewares/socket-auth-middleware');
const { Conversation, ConversationMember, ConversationMessage, ConversationMessageAttachment, User } = require('../models');
const { Op } = require('sequelize');

class SocketService {
    constructor(redisClient) {
        this.redis = redisClient;
        this.io = null;
        this.presenceService = createPresenceService(redisClient);
    }

    initialize(io) {
        this.io = io;
        this.setupMiddleware();
        this.setupEventHandlers();
    }

    setupMiddleware() {
        this.io.use(socketAuthMiddleware);
    }

    setupEventHandlers() {
        this.io.on('connection', async (socket) => {
            try {
                await this.handleConnection(socket);
            } catch (error) {
                console.error('Connection error:', error);
                socket.disconnect(true);
            }
        });
    }

    async handleConnection(socket) {
        console.log(`User ${socket.userId} connected with socket ID: ${socket.id}`);

        // Join user to their personal room for notifications
        socket.join(`user:${socket.userId}`);

        await this.updateUserPresence(socket.userId, true);
        socket.broadcast.emit('user_presence', {
            userId: socket.userId,
            status: true,
        });

        // Join all user's conversations
        this.joinUserConversations(socket);

        // Handle conversation events
        this.handleConversationEvents(socket);

        // Handle typing events
        this.handleTypingEvents(socket);

        // Handle disconnect
        socket.on('disconnect', () => this.handleDisconnect(socket));
    }

    async joinUserConversations(socket) {
        try {
            // Get all conversations where user is a member
            const conversations = await ConversationMember.findAll({
                where: { userId: socket.userId },
                attributes: ['conversationId']
            });

            // Join each conversation room
            conversations.forEach(member => {
                socket.join(`conversation:${member.conversationId}`);
            });

        } catch (error) {
            console.error('Error joining user conversations:', error);
        }
    }

    async handleConversationEvents(socket) {
        // Join a specific conversation
        socket.on('join_conversation', async (conversationId) => {
            try {
                // Check if user is a member of this conversation
                const member = await ConversationMember.findOne({
                    where: {
                        conversationId,
                        userId: socket.userId
                    }
                });

                if (member) {
                    socket.join(`conversation:${conversationId}`);
                    await this.redis.sadd(`user:${socket.userId}:active_conversations`, conversationId);


                    socket.emit('conversation_joined', { conversationId });

                    // Mark messages as read when joining
                    await this.markMessagesAsRead(conversationId, socket.userId);
                } else {
                    socket.emit('error', { message: 'Not a member of this conversation' });
                }
            } catch (error) {
                console.error('Error joining conversation:', error);
                socket.emit('error', { message: 'Failed to join conversation' });
            }
        });

        // Leave a conversation
        socket.on('leave_conversation', async (conversationId) => {
            socket.leave(`conversation:${conversationId}`);
            await this.redis.srem(`user:${socket.userId}:active_conversations`, conversationId);
            socket.emit('conversation_left', { conversationId });
        });
    }

    handleTypingEvents(socket) {
        socket.on('typing_start', (data) => {
            const { conversationId } = data;
            socket.to(`conversation:${conversationId}`).emit('user_typing', {
                userId: socket.userId,
                conversationId,
                typing: true
            });
        });

        socket.on('typing_stop', (data) => {
            const { conversationId } = data;
            socket.to(`conversation:${conversationId}`).emit('user_typing', {
                userId: socket.userId,
                conversationId,
                typing: false
            });
        });
    }

    async handleDisconnect(socket) {
        try {
            // Remove socket from Redis
            await this.redis.srem(`user:${socket.userId}:sockets`, socket.id);
            await this.redis.del(`socket:${socket.id}`);

            // Check if user has no more active sockets
            const activeSockets = await this.redis.scard(`user:${socket.userId}:sockets`);

            if (activeSockets === 0) {
                await this.redis.hset(`user:${socket.userId}:presence`, 'status', 'offline');
                await this.redis.hset(`user:${socket.userId}:presence`, 'lastSeen', new Date().toISOString());
            }

            socket.broadcast.emit('user_presence', {
                userId: socket.userId,
                status: false,
            });

            console.log(`User ${socket.userId} disconnected`);
        } catch (error) {
            console.error('Error handling disconnect:', error);
        }
    }

    async updateUserPresence(userId, isOnline) {
        const status = isOnline ? 'online' : 'offline';
        const lastSeen = new Date().toISOString();

        await this.redis.hset(`user:${userId}:presence`, {
            status,
            lastSeen
        });
    }

    async markMessagesAsRead(conversationId, userId) {
        try {
            // Get the latest message in the conversation
            const latestMessage = await ConversationMessage.findOne({
                where: { conversationId },
                order: [['createdAt', 'DESC']]
            });

            if (latestMessage) {
                // Update member's last read message and reset unread count
                await ConversationMember.update(
                    {
                        lastReadMessageId: latestMessage.id,
                        lastReadAt: new Date(),
                        unreadCount: 0
                    },
                    {
                        where: {
                            conversationId,
                            userId
                        }
                    }
                );

                // Emit read receipt
                this.io.to(`conversation:${conversationId}`).emit('message_read', {
                    userId,
                    conversationId,
                    messageId: latestMessage.id
                });
            }
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    }

    // Utility method to get user presence
    async getUserPresence(userId) {
        try {
            const presence = await this.redis.hgetall(`user:${userId}:presence`);
            return presence;
        } catch (error) {
            console.error('Error getting user presence:', error);
            return null;
        }
    }
}

module.exports = {
    createSocketService: (redisClient) => new SocketService(redisClient)
};

