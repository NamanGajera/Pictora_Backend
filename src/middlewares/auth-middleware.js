const { verifyToken } = require("../utils/helpers/jwt");
const { Enums } = require("../utils/common");
const { User } = require("../models");

const { STATUS_CODE } = Enums;

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res
      .status(STATUS_CODE.UNAUTHORIZED)
      .json({ message: "Token missing" });
  }

  const token = authHeader;

  try {
    const decoded = verifyToken(token);
    const userId = decoded?.id;

    if (!userId) {
      return res
        .status(STATUS_CODE.UNAUTHORIZED)
        .json({ message: "Token is invalid" });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res
        .status(STATUS_CODE.UNAUTHORIZED)
        .json({ message: "User does not exist" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res
      .status(STATUS_CODE.UNAUTHORIZED)
      .json({ message: "Token is invalid" });
  }
};

module.exports = authenticate;
