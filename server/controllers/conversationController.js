const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

// GET /api/conversations
const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate("participants", "name username profilePicture isOnline lastSeen")
      .populate({
        path: "lastMessage",
        select: "text messageType sender createdAt deleted",
      })
      .sort({ lastMessageAt: -1 });

    res.json(conversations);
  } catch (err) {
    next(err);
  }
};

// POST /api/conversations/private  { userId }
const createPrivateConversation = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    if (userId === String(req.user._id)) {
      return res
        .status(400)
        .json({ message: "Cannot start a conversation with yourself" });
    }

    let conversation = await Conversation.findOne({
      type: "private",
      participants: { $all: [req.user._id, userId], $size: 2 },
    }).populate(
      "participants",
      "name username profilePicture isOnline lastSeen"
    );

    if (!conversation) {
      conversation = await Conversation.create({
        type: "private",
        participants: [req.user._id, userId],
      });

      conversation = await conversation.populate(
        "participants",
        "name username profilePicture isOnline lastSeen"
      );
    }

    res.status(201).json(conversation);
  } catch (err) {
    next(err);
  }
};

// POST /api/conversations/group { groupName, participantIds: [] }
const createGroupConversation = async (req, res, next) => {
  try {
    let { groupName, participantIds } = req.body;

    // Convert participantIds from FormData string to array
    if (typeof participantIds === "string") {
      try {
        participantIds = JSON.parse(participantIds);
      } catch {
        participantIds = [];
      }
    }

    if (!groupName || !participantIds || participantIds.length < 1) {
      return res.status(400).json({
        message: "Group name and at least one member are required",
      });
    }

    const allParticipants = Array.from(
      new Set([...participantIds, String(req.user._id)])
    );

    let groupImage = "";

    if (req.file) {
      groupImage = `/uploads/${req.file.filename}`;
    }

    const conversation = await Conversation.create({
      type: "group",
      groupName,
      groupImage,
      participants: allParticipants,
      admins: [req.user._id],
    });

    const populated = await conversation.populate(
      "participants",
      "name username profilePicture isOnline lastSeen"
    );

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

// GET /api/conversations/:id
const getConversationById = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(
      req.params.id
    ).populate(
      "participants",
      "name username profilePicture isOnline lastSeen"
    );

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const isMember = conversation.participants.some(
      (p) => String(p._id) === String(req.user._id)
    );

    if (!isMember) {
      return res
        .status(403)
        .json({ message: "Not a member of this conversation" });
    }

    res.json(conversation);
  } catch (err) {
    next(err);
  }
};

// PUT /api/conversations/:id
// Group settings: add/remove members, rename, admins
const updateConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (conversation.type !== "group") {
      return res
        .status(400)
        .json({ message: "Only group conversations can be updated" });
    }

    const isAdmin = conversation.admins.some(
      (a) => String(a) === String(req.user._id)
    );

    const { groupName, addMembers, removeMembers, addAdmins } = req.body;

    if (groupName) {
      if (!isAdmin) {
        return res
          .status(403)
          .json({ message: "Only admins can rename the group" });
      }

      conversation.groupName = groupName;
    }

    if (req.file) {
      if (!isAdmin) {
        return res
          .status(403)
          .json({ message: "Only admins can change group photo" });
      }

      conversation.groupImage = `/uploads/${req.file.filename}`;
    }

    if (addMembers && addMembers.length) {
      if (!isAdmin) {
        return res
          .status(403)
          .json({ message: "Only admins can add members" });
      }

      addMembers.forEach((id) => {
        if (
          !conversation.participants.some(
            (p) => String(p) === String(id)
          )
        ) {
          conversation.participants.push(id);
        }
      });
    }

    if (removeMembers && removeMembers.length) {
      if (!isAdmin) {
        return res
          .status(403)
          .json({ message: "Only admins can remove members" });
      }

      conversation.participants = conversation.participants.filter(
        (p) => !removeMembers.includes(String(p))
      );

      conversation.admins = conversation.admins.filter(
        (a) => !removeMembers.includes(String(a))
      );
    }

    if (addAdmins && addAdmins.length) {
      if (!isAdmin) {
        return res
          .status(403)
          .json({ message: "Only admins can promote admins" });
      }

      addAdmins.forEach((id) => {
        if (
          !conversation.admins.some(
            (a) => String(a) === String(id)
          )
        ) {
          conversation.admins.push(id);
        }
      });
    }

    await conversation.save();

    const populated = await conversation.populate(
      "participants",
      "name username profilePicture isOnline lastSeen"
    );

    res.json(populated);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/conversations/:id
// Leave group, or delete private conversation
const deleteConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (conversation.type === "group") {
      conversation.participants = conversation.participants.filter(
        (p) => String(p) !== String(req.user._id)
      );

      conversation.admins = conversation.admins.filter(
        (a) => String(a) !== String(req.user._id)
      );

      await conversation.save();

      return res.json({ message: "Left group successfully" });
    }

    await Conversation.findByIdAndDelete(req.params.id);
    await Message.deleteMany({ conversation: req.params.id });

    res.json({ message: "Conversation deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getConversations,
  createPrivateConversation,
  createGroupConversation,
  getConversationById,
  updateConversation,
  deleteConversation,
};