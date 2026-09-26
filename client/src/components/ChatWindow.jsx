import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Info } from "lucide-react";

import Avatar from "./Avatar";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import TypingIndicator from "./TypingIndicator";
import GroupInfoPanel from "./GroupInfoPanel";

import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import {
  getMessages,
  deleteMessage as apiDeleteMessage,
} from "../services/chatService";
import {
  formatDateSeparator,
  formatLastSeen,
} from "../utils/format";
import { useToast } from "./Toast";

export default function ChatWindow({
  conversation,
  onBack,
  onConversationUpdated,
  onLeftGroup,
}) {
  const { user } = useAuth();
  const { socket, onlineUserIds } = useSocket();
  const { showToast } = useToast();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  const bottomRef = useRef(null);

  const isGroup = conversation.type === "group";

  const other = !isGroup
    ? conversation.participants.find(
        (p) => p._id !== user._id
      )
    : null;

  const headerName = isGroup
    ? conversation.groupName
    : other?.name;

  const headerPicture = isGroup
    ? conversation.groupImage
    : other?.profilePicture;

  const isOnline = other
    ? onlineUserIds.has(other._id)
    : false;

  // Load message history
  useEffect(() => {
    setLoading(true);
    setMessages([]);

    getMessages(conversation._id)
      .then(setMessages)
      .finally(() => setLoading(false));

    if (socket) {
      socket.emit("group:join-room", {
        conversationId: conversation._id,
      });
    }
  }, [conversation._id, socket]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      if (msg.conversation !== conversation._id) return;

      setMessages((prev) => [...prev, msg]);

      if (
        String(msg.sender._id) !==
        String(user._id)
      ) {
        socket.emit("message:delivered", {
          messageId: msg._id,
        });

        socket.emit("message:read", {
          messageId: msg._id,
          conversationId: conversation._id,
        });
      }
    };

    const handleStatus = ({
      messageId,
      status,
    }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? { ...m, status }
            : m
        )
      );
    };

    const handleDeleted = ({
      messageId,
      conversationId,
    }) => {
      if (
        conversationId !== conversation._id
      )
        return;

      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? {
                ...m,
                deleted: true,
                text: "",
                fileUrl: "",
              }
            : m
        )
      );
    };

    const handleTypingStart = ({
      conversationId,
      userId,
    }) => {
      if (
        conversationId !== conversation._id ||
        userId === user._id
      )
        return;

      const person =
        conversation.participants.find(
          (p) => p._id === userId
        );

      if (!person) return;

      setTypingUsers((prev) =>
        prev.includes(person.name)
          ? prev
          : [...prev, person.name]
      );
    };

    const handleTypingStop = ({
      conversationId,
      userId,
    }) => {
      if (
        conversationId !== conversation._id
      )
        return;

      const person =
        conversation.participants.find(
          (p) => p._id === userId
        );

      if (!person) return;

      setTypingUsers((prev) =>
        prev.filter(
          (n) => n !== person.name
        )
      );
    };

    socket.on(
      "message:new",
      handleNewMessage
    );

    socket.on(
      "message:status",
      handleStatus
    );

    socket.on(
      "message:deleted",
      handleDeleted
    );

    socket.on(
      "typing:start",
      handleTypingStart
    );

    socket.on(
      "typing:stop",
      handleTypingStop
    );

    return () => {
      socket.off(
        "message:new",
        handleNewMessage
      );

      socket.off(
        "message:status",
        handleStatus
      );

      socket.off(
        "message:deleted",
        handleDeleted
      );

      socket.off(
        "typing:start",
        handleTypingStart
      );

      socket.off(
        "typing:stop",
        handleTypingStop
      );
    };
  }, [
    socket,
    conversation,
    user._id,
  ]);

  const handleSend = (payload) => {
    if (!socket) return;

    socket.emit(
      "message:send",
      {
        conversationId: conversation._id,
        ...payload,
      },
      (res) => {
        if (res?.error) {
          showToast(
            res.error,
            "error"
          );
        }
      }
    );
  };

  const handleDelete = async (
    messageId
  ) => {
    try {
      if (socket) {
        socket.emit(
          "message:delete",
          { messageId }
        );
      } else {
        await apiDeleteMessage(
          messageId
        );
      }

      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? {
                ...m,
                deleted: true,
                text: "",
                fileUrl: "",
              }
            : m
        )
      );
    } catch {
      showToast(
        "Failed to delete message",
        "error"
      );
    }
  };

  let lastDate = null;

  return (
    <div className="chat-window">

      {/* Chat Header */}
      <div className="chat-window-header">

        <button
          className="icon-btn back-btn"
          onClick={onBack}
          title="Back"
        >
          <ArrowLeft
            size={20}
            strokeWidth={2}
          />
        </button>

        <div
          className="chat-window-header-info"
          onClick={() =>
            isGroup &&
            setShowGroupInfo(true)
          }
          style={{
            cursor: isGroup
              ? "pointer"
              : "default",
          }}
        >
          <Avatar
            src={headerPicture}
            name={headerName}
            online={isOnline}
          />

          <div>
            <div className="chat-window-header-name">
              {headerName}
            </div>

            <div className="chat-window-header-status">
              {isGroup
                ? `${conversation.participants.length} members`
                : isOnline
                ? "Online"
                : other?.lastSeen
                ? `Last seen ${formatLastSeen(
                    other.lastSeen
                  )}`
                : ""}
            </div>
          </div>
        </div>

        {isGroup && (
          <button
            className="icon-btn"
            onClick={() =>
              setShowGroupInfo(true)
            }
            title="Group info"
          >
            <Info
              size={20}
              strokeWidth={2}
            />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="chat-window-messages">

        {loading && (
          <p className="modal-empty">
            Loading messages...
          </p>
        )}

        {!loading &&
          messages.length === 0 && (
            <p className="modal-empty">
              No messages yet. Say hi! 👋
            </p>
          )}

        {messages.map((m) => {
          const dateLabel =
            formatDateSeparator(
              m.createdAt
            );

          const showDate =
            dateLabel !== lastDate;

          lastDate = dateLabel;

          return (
            <div key={m._id}>

              {showDate && (
                <div className="date-separator">
                  <span>
                    {dateLabel}
                  </span>
                </div>
              )}

              <MessageBubble
                message={m}
                isOwn={
                  String(
                    m.sender?._id
                  ) ===
                  String(user._id)
                }
                showSender={isGroup}
                onDelete={
                  handleDelete
                }
              />
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Typing Indicator */}
      <TypingIndicator
        names={typingUsers}
      />

      {/* Message Input */}
      <MessageInput
        conversationId={
          conversation._id
        }
        onSend={handleSend}
      />

      {/* Group Information */}
      {showGroupInfo && (
        <GroupInfoPanel
          conversation={
            conversation
          }
          onClose={() =>
            setShowGroupInfo(false)
          }
          onUpdated={
            onConversationUpdated
          }
          onLeft={() => {
            setShowGroupInfo(false);
            onLeftGroup();
          }}
        />
      )}
    </div>
  );
}