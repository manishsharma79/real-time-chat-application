const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

// GET /api/messages/:conversationId?page=1&limit=30
const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    const isMember = conversation.participants.some(
      (p) => String(p) === String(req.user._id)
    );
    if (!isMember) return res.status(403).json({ message: "Not a member of this conversation" });

    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("sender", "name username profilePicture");

    res.json(messages.reverse());
  } catch (err) {
    next(err);
  }
};

// POST /api/messages  { conversation, text, messageType, fileUrl, fileName, fileSize, fileType }
const sendMessage = async (req, res, next) => {
  try {
    const { conversation, text, messageType, fileUrl, fileName, fileSize, fileType } = req.body;

    if (!conversation) return res.status(400).json({ message: "conversation is required" });
    if (!text && !fileUrl) return res.status(400).json({ message: "Message cannot be empty" });

    const convo = await Conversation.findById(conversation);
    if (!convo) return res.status(404).json({ message: "Conversation not found" });

    const isMember = convo.participants.some((p) => String(p) === String(req.user._id));
    if (!isMember) return res.status(403).json({ message: "Not a member of this conversation" });

    const message = await Message.create({
      conversation,
      sender: req.user._id,
      text: text || "",
      messageType: messageType || "text",
      fileUrl: fileUrl || "",
      fileName: fileName || "",
      fileSize: fileSize || 0,
      fileType: fileType || "",
      status: "sent",
      readBy: [req.user._id],
    });

    convo.lastMessage = message._id;
    convo.lastMessageAt = new Date();
    await convo.save();

    const populated = await message.populate("sender", "name username profilePicture");

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/messages/:messageId
const deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (String(message.sender) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only delete your own messages" });
    }

    message.deleted = true;
    message.text = "";
    message.fileUrl = "";
    await message.save();

    res.json({ message: "Message deleted", messageId: message._id });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMessages, sendMessage, deleteMessage };
