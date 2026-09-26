const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const Notification = require("../models/Notification");

// userId -> Set of socket ids (handles multiple tabs/devices)
const onlineUsers = new Map();

function initSocket(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication error"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error("Authentication error"));
      socket.userId = String(user._id);
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.userId;

    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);

    socket.join(`user:${userId}`);

    // 👇 NAYI LINE: connect hote hi is user ko currently online sabhi users ki list bhejo
    socket.emit("users:online-list", Array.from(onlineUsers.keys()));

    // Join all conversation rooms this user is part of
    const conversations = await Conversation.find({ participants: userId }).select("_id");
    conversations.forEach((c) => socket.join(`conversation:${c._id}`));

    // Mark online only on first connection (not every tab)
    if (onlineUsers.get(userId).size === 1) {
      await User.findByIdAndUpdate(userId, { isOnline: true });
      io.emit("user:online", { userId });
    }

    // ---- Typing indicators ----
    socket.on("typing:start", ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit("typing:start", {
        conversationId,
        userId,
      });
    });

    socket.on("typing:stop", ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit("typing:stop", {
        conversationId,
        userId,
      });
    });

    // ---- New message ----
    socket.on("message:send", async (payload, callback) => {
      try {
        const { conversationId, text, messageType, fileUrl, fileName, fileSize, fileType } = payload;

        const convo = await Conversation.findById(conversationId);
        if (!convo || !convo.participants.some((p) => String(p) === userId)) {
          return callback && callback({ error: "Not authorized for this conversation" });
        }

        const message = await Message.create({
          conversation: conversationId,
          sender: userId,
          text: text || "",
          messageType: messageType || "text",
          fileUrl: fileUrl || "",
          fileName: fileName || "",
          fileSize: fileSize || 0,
          fileType: fileType || "",
          status: "sent",
          readBy: [userId],
        });

        convo.lastMessage = message._id;
        convo.lastMessageAt = new Date();
        await convo.save();

        const populated = await message.populate("sender", "name username profilePicture");

        io.to(`conversation:${conversationId}`).emit("message:new", populated);

        // Create notifications for offline / non-viewing participants
        const recipients = convo.participants.filter((p) => String(p) !== userId);
        for (const recipientId of recipients) {
          await Notification.create({
            recipient: recipientId,
            sender: userId,
            type: "message",
            conversation: conversationId,
            message: message._id,
          });
          io.to(`user:${recipientId}`).emit("notification:new", {
            conversationId,
            messageId: message._id,
          });
        }

        callback && callback({ success: true, message: populated });
      } catch (err) {
        callback && callback({ error: err.message });
      }
    });

    // ---- Delivery / read receipts ----
    socket.on("message:delivered", async ({ messageId }) => {
      const message = await Message.findByIdAndUpdate(
        messageId,
        { status: "delivered" },
        { new: true }
      );
      if (message) {
        io.to(`conversation:${message.conversation}`).emit("message:status", {
          messageId,
          status: "delivered",
        });
      }
    });

    socket.on("message:read", async ({ messageId, conversationId }) => {
      const message = await Message.findById(messageId);
      if (!message) return;
      if (!message.readBy.some((id) => String(id) === userId)) {
        message.readBy.push(userId);
      }
      message.status = "read";
      await message.save();

      io.to(`conversation:${conversationId}`).emit("message:status", {
        messageId,
        status: "read",
        readBy: userId,
      });
    });

    // ---- Delete message ----
    socket.on("message:delete", async ({ messageId }) => {
      const message = await Message.findById(messageId);
      if (!message || String(message.sender) !== userId) return;

      message.deleted = true;
      message.text = "";
      message.fileUrl = "";
      await message.save();

      io.to(`conversation:${message.conversation}`).emit("message:deleted", {
        messageId,
        conversationId: message.conversation,
      });
    });

    // ---- Group membership events ----
    socket.on("group:join-room", ({ conversationId }) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on("group:leave-room", ({ conversationId }) => {
      socket.leave(`conversation:${conversationId}`);
      io.to(`conversation:${conversationId}`).emit("group:user-left", {
        conversationId,
        userId,
      });
    });

    // ---- Disconnect ----
    socket.on("disconnect", async () => {
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          const lastSeen = new Date();
          await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen });
          io.emit("user:offline", { userId, lastSeen });
        }
      }
    });
  });
}

module.exports = { initSocket, onlineUsers };