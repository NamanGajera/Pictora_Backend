// src/config/redis.js
const Redis = require("ioredis");

let client = null;
let pubClient = null;
let subClient = null;

function initRedis() {
    if (client && pubClient && subClient) return { client, pubClient, subClient };

    const redisOptions = {
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
        enableAutoPipelining: true,
        maxRetriesPerRequest: null,
        reconnectOnError: (err) => {
            const targetError = "READONLY";
            if (err && err.message && err.message.includes(targetError)) return true;
            return false;
        },
    };

    client = new Redis(redisOptions);
    pubClient = new Redis(redisOptions);
    subClient = new Redis(redisOptions);

    client.on("connect", () => console.log("✅ Redis connected (client)"));
    pubClient.on("connect", () => console.log("✅ Redis connected (pubClient)"));
    subClient.on("connect", () => console.log("✅ Redis connected (subClient)"));

    client.on("error", (err) => console.error("❌ Redis Client Error:", err));
    pubClient.on("error", (err) => console.error("❌ Redis PubClient Error:", err));
    subClient.on("error", (err) => console.error("❌ Redis SubClient Error:", err));

    return { client, pubClient, subClient };
}

function getRedis() {
    if (!client) throw new Error("Redis not initialized. Call initRedis() first.");
    return client;
}

function getPubSub() {
    if (!pubClient || !subClient) throw new Error("Redis pub/sub not initialized. Call initRedis() first.");
    return { pubClient, subClient };
}

module.exports = { initRedis, getRedis, getPubSub };
