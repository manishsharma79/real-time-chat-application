const express = require("express");
const router = express.Router();
const {
  getConversations,
  createPrivateConversation,
  createGroupConversation,
  getConversationById,
  updateConversation,
  deleteConversation,
} = require("../controllers/conversationController");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.use(protect);

router.get("/", getConversations);
router.post("/private", createPrivateConversation);
router.post("/group", upload.single("groupImage"), createGroupConversation);
router.get("/:id", getConversationById);
router.put("/:id", upload.single("groupImage"), updateConversation);
router.delete("/:id", deleteConversation);

module.exports = router;
