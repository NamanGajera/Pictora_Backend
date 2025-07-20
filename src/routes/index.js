const userRoute = require("./user-routes");
const postRoute = require("./post-routes");
const express = require("express");

const router = express.Router();

router.use("/auth", userRoute);
router.use("/post", postRoute);

module.exports = router;
