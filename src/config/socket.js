// src/config/socket.js
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const { getPubSub } = require("./redis");

let io = null;

function initSocket(server) {
    if (io) return io;

    const { pubClient, subClient } = getPubSub();

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

    console.log("🔌 Socket.IO initialized with Redis adapter");

    return io;
}

function getIO() {
    if (!io) throw new Error("Socket.io not initialized!");
    return io;
}

module.exports = { initSocket, getIO };
