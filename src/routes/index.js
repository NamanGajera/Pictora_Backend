const authRoute = require("./auth-routes");
const postRoute = require("./post-routes");
const commentRoute = require("./comment-routes");
const userRoute = require("./user-route");
const express = require("express");

const router = express.Router();

router.use("/auth", authRoute);
router.use("/users", userRoute);
router.use("/post", postRoute);
router.use("/comment", commentRoute);

module.exports = router;
