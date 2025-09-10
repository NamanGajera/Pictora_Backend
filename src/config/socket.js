// socket.js
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const { getPubSub, getRedis } = require("./redis");
const { createSocketService } = require("../services/socket-service");

let io = null;
let socketService = null;

function initSocket(server) {
    if (io) return io;

    const { pubClient, subClient } = getPubSub();
    const redisClient = getRedis();

    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || "*",
            methods: ["GET", "POST"],
            credentials: true,
        },
        pingTimeout: 20000,
        pingInterval: 25000,
    });

    io.adapter(createAdapter(pubClient, subClient));

    // Initialize socket service with Redis dependency
    socketService = createSocketService(redisClient);
    socketService.initialize(io);

    console.log("🔌 Socket.IO initialized with Redis adapter");

    return io;
}

function getIO() {
    if (!io) throw new Error("Socket.io not initialized!");
    return io;
}

function getSocketService() {
    if (!socketService) throw new Error("Socket service not initialized!");
    return socketService;
}

module.exports = { initSocket, getIO, getSocketService };