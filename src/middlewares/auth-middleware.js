const { verifyToken } = require("../utils/helpers/jwt");
const { Enums } = require("../utils/common");

const { STATUS_CODE } = Enums;

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: "Token missing" });
    }

    const token = authHeader;

    try {
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(STATUS_CODE.UNAUTHORIZED).json({ message: "Token is invalid", });
    }
};

module.exports = authenticate;
