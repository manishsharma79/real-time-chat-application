const express = require("express");
const router = express.Router();
const { getMessages, sendMessage, deleteMessage } = require("../controllers/messageController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/:conversationId", getMessages);
router.post("/", sendMessage);
router.delete("/:messageId", deleteMessage);

module.exports = router;
