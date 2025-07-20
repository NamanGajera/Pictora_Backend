const jwt = require("jsonwebtoken");

const { serverConfig } = require("../../config");

const verifyToken = (token) => {
  console.log("Token ==>>>", token);
  console.log("JWT_SECRET ==>>>", serverConfig.JWT_SECRET);
  return jwt.verify(token, serverConfig.JWT_SECRET);
};

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, serverConfig.JWT_SECRET, {
    expiresIn: "7d",
  });
};

module.exports = { verifyToken, generateToken };
