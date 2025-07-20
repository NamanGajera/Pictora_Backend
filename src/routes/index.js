const userRoute = require("./user-routes");
const express = require("express");

const router = express.Router();

router.use("/auth", userRoute);

module.exports = router;
