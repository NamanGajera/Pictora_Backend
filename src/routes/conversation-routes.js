const express = require("express");
const router = express.Router();
const { ConversationController } = require("../controllers");
const { ConversationMiddleware } = require("../middlewares");
const { fileUpload } = require("../middlewares/file-upload-middleware");
const authenticate = require("../middlewares/auth-middleware");

router.post(
  "/create",
  authenticate,
  ConversationMiddleware.validateCreateConversationRequest,
  ConversationController.createConversation
);

router.get("/", authenticate, ConversationController.getAllConversations);

router.post(
  "/create-message",
  authenticate,
  fileUpload.fields([
    { name: "media", maxCount: 10 },
    { name: "thumbnails", maxCount: 10 },
  ]),
  ConversationMiddleware.validateCreateConversationMessageRequest,
  ConversationController.createMessage
);

router.post(
  "/messages",
  authenticate,
  ConversationMiddleware.validateGetMessagesRequest,
  ConversationController.getMessagesForConversation
);

module.exports = router;
