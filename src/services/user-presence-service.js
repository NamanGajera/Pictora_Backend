// presence service
class PresenceService {
  constructor(redisClient) {
    this.redis = redisClient;
  }

  async setUserOnline(userId, socketId) {
    await this.redis.sadd(`user:${userId}:sockets`, socketId);
    await this.redis.hset(`socket:${socketId}`, "userId", userId);
    await this.redis.hset(`user:${userId}:presence`, "status", "online");
    await this.redis.hset(
      `user:${userId}:presence`,
      "lastSeen",
      new Date().toISOString()
    );
  }

  async handleUserDisconnect(socketId) {
    const userId = await this.redis.hget(`socket:${socketId}`, "userId");

    if (userId) {
      await this.redis.srem(`user:${userId}:sockets`, socketId);
      await this.redis.del(`socket:${socketId}`);

      // Check if user has no more active sockets
      const activeSockets = await this.redis.scard(`user:${userId}:sockets`);

      if (activeSockets === 0) {
        await this.redis.hset(`user:${userId}:presence`, "status", "offline");
        await this.redis.hset(
          `user:${userId}:presence`,
          "lastSeen",
          new Date().toISOString()
        );
      }
    }
  }

  async getUserPresence(userId) {
    return await this.redis.hgetall(`user:${userId}:presence`);
  }

  async getMultipleUsersPresence(userIds) {
    const presencePromises = userIds.map((id) => this.getUserPresence(id));
    return Promise.all(presencePromises);
  }

  async isUserActiveInConversation(userId, conversationId) {
    try {
      const isActive = await this.redis.sismember(
        `conversation:${conversationId}:active_users`,
        userId
      );
      return isActive === 1;
    } catch (error) {
      console.error("Error checking user activity:", error);
      return false;
    }
  }
}

// Export a factory function
module.exports = {
  createPresenceService: (redisClient) => new PresenceService(redisClient),
};
