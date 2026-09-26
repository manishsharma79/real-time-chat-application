import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar.jsx";
import ChatWindow from "../components/ChatWindow.jsx";
import { getConversations, getNotifications } from "../services/chatService";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";

export default function ChatPage() {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [showWindowOnMobile, setShowWindowOnMobile] = useState(false);
  const { socket } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    getConversations().then(setConversations).catch(() => {});
    getNotifications()
      .then((notifs) => {
        const counts = {};
        notifs
          .filter((n) => !n.isRead)
          .forEach((n) => {
            const cid = n.conversation?._id || n.conversation;
            counts[cid] = (counts[cid] || 0) + 1;
          });
        setUnreadCounts(counts);
      })
      .catch(() => {});
  }, []);

  // Keep conversation list fresh in real time
  useEffect(() => {
    if (!socket) return;

    const bumpConversation = (convoId, lastMessage) => {
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c._id === convoId);
        if (idx === -1) return prev;
        const updated = [...prev];
        updated[idx] = { ...updated[idx], lastMessage, lastMessageAt: lastMessage.createdAt };
        updated.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
        return updated;
      });
    };

    const handleNewMessage = (msg) => {
      bumpConversation(msg.conversation, msg);
      const isActive = activeConversation && activeConversation._id === msg.conversation;
      const isOwn = String(msg.sender._id) === String(user._id);
      if (!isActive && !isOwn) {
        setUnreadCounts((prev) => ({
          ...prev,
          [msg.conversation]: (prev[msg.conversation] || 0) + 1,
        }));
      }
    };

    const handleUserStatus = ({ userId, lastSeen }) => {
      setConversations((prev) =>
        prev.map((c) => ({
          ...c,
          participants: c.participants.map((p) =>
            p._id === userId
              ? { ...p, isOnline: false, lastSeen: lastSeen || p.lastSeen }
              : p
          ),
        }))
      );
    };

    socket.on("message:new", handleNewMessage);
    socket.on("user:offline", handleUserStatus);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("user:offline", handleUserStatus);
    };
  }, [socket, activeConversation, user._id]);

  const handleSelectConversation = (convo) => {
    setActiveConversation(convo);
    setShowWindowOnMobile(true);
    setUnreadCounts((prev) => ({ ...prev, [convo._id]: 0 }));
  };

  const handleConversationCreated = (convo) => {
    setConversations((prev) => {
      const exists = prev.some((c) => c._id === convo._id);
      return exists ? prev : [convo, ...prev];
    });
    handleSelectConversation(convo);
  };

  const handleConversationUpdated = (updated) => {
    setConversations((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
    setActiveConversation(updated);
  };

  const handleLeftGroup = () => {
    setConversations((prev) => prev.filter((c) => c._id !== activeConversation._id));
    setActiveConversation(null);
    setShowWindowOnMobile(false);
  };

  return (
    <div className="app-shell">
      <div className={`sidebar-pane ${showWindowOnMobile ? "hide-on-mobile" : ""}`}>
        <Sidebar
          conversations={conversations}
          activeId={activeConversation?._id}
          onSelect={handleSelectConversation}
          onConversationCreated={handleConversationCreated}
          unreadCounts={unreadCounts}
        />
      </div>
      <div className={`window-pane ${!showWindowOnMobile ? "hide-on-mobile" : ""}`}>
        {activeConversation ? (
          <ChatWindow
            conversation={activeConversation}
            onBack={() => setShowWindowOnMobile(false)}
            onConversationUpdated={handleConversationUpdated}
            onLeftGroup={handleLeftGroup}
          />
        ) : (
          <div className="empty-chat-state">
            <h2>ChatApp</h2>
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
