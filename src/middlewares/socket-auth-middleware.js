// socket auth middleware
const jwt = require('jsonwebtoken');

async function socketAuthMiddleware(socket, next) {
    try {
        const token = socket.handshake.auth.token || socket.handshake.headers.access_token;
        console.log('Socket auth token:', token);
        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user info to socket
        socket.userId = decoded.id;
        socket.user = decoded;

        next();
    } catch (error) {
        console.error('Socket auth error:', error);

        if (error.name === 'JsonWebTokenError') {
            return next(new Error('Authentication error: Invalid token'));
        }
        if (error.name === 'TokenExpiredError') {
            return next(new Error('Authentication error: Token expired'));
        }

        next(new Error('Authentication error'));
    }
}

module.exports = {
    socketAuthMiddleware,
};