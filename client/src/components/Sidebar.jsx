import { Moon, Sun, MessageCircle, Users, MoreVertical } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Avatar from "./Avatar";
import ChatListItem from "./ChatListItem";
import NewChatModal from "./NewChatModal";
import NewGroupModal from "./NewGroupModal";

import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useTheme } from "../context/ThemeContext";

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onConversationCreated,
  unreadCounts,
}) {
  const { user, logout } = useAuth();
  const { onlineUserIds } = useSocket();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return conversations;

    const q = query.toLowerCase();

    return conversations.filter((c) => {
      if (c.type === "group") {
        return c.groupName?.toLowerCase().includes(q);
      }

      const other = c.participants.find(
        (p) => p._id !== user._id
      );

      return (
        other?.name?.toLowerCase().includes(q) ||
        other?.username?.toLowerCase().includes(q)
      );
    });
  }, [conversations, query, user._id]);

  return (
    <div className="sidebar">

      {/* HEADER */}
      <div className="sidebar-header">

        <div
          className="sidebar-header-left"
          onClick={() => navigate("/profile")}
        >
          <Avatar
            src={user.profilePicture}
            name={user.name}
            size={38}
          />

          <span className="sidebar-username">
            {user.name}
          </span>
        </div>

        {/* HEADER ACTIONS */}
        <div className="sidebar-header-actions">

          {/* Theme */}
          <button
            className="icon-btn"
            title={
              theme === "light"
                ? "Dark mode"
                : "Light mode"
            }
            onClick={toggleTheme}
          >
            {theme === "light" ? (
              <Moon size={20} strokeWidth={2} />
            ) : (
              <Sun size={20} strokeWidth={2} />
            )}
          </button>

          {/* New Chat */}
          <button
            className="icon-btn"
            title="New chat"
            onClick={() => setShowNewChat(true)}
          >
            <MessageCircle size={20} strokeWidth={2} />
          </button>

          {/* New Group */}
          <button
            className="icon-btn"
            title="New group"
            onClick={() => setShowNewGroup(true)}
          >
            <Users size={20} strokeWidth={2} />
          </button>

          {/* More */}
          <div className="menu-wrap">
            <button
              className="icon-btn"
              title="More options"
              onClick={() =>
                setMenuOpen((m) => !m)
              }
            >
              <MoreVertical
                size={20}
                strokeWidth={2}
              />
            </button>

            {menuOpen && (
              <div className="dropdown-menu">

                <div
                  onClick={() => {
                    navigate("/profile");
                    setMenuOpen(false);
                  }}
                >
                  Profile
                </div>

                <div
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                >
                  Logout
                </div>

              </div>
            )}
          </div>

        </div>
      </div>

      {/* SEARCH */}
      <div className="sidebar-search">
        <input
          type="text"
          placeholder="Search chats"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* CHAT LIST */}
      <div className="sidebar-list">

        {filtered.length === 0 && (
          <p className="sidebar-empty">
            No conversations yet. Start a new chat!
          </p>
        )}

        {filtered.map((c) => {

          const other =
            c.type === "private"
              ? c.participants.find(
                  (p) => p._id !== user._id
                )
              : null;

          return (
            <ChatListItem
              key={c._id}
              conversation={c}
              currentUserId={user._id}
              isOnline={
                other
                  ? onlineUserIds.has(other._id)
                  : false
              }
              unreadCount={
                unreadCounts[c._id] || 0
              }
              active={c._id === activeId}
              onClick={() => onSelect(c)}
            />
          );
        })}

      </div>

      {/* NEW CHAT MODAL */}
      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onCreated={onConversationCreated}
        />
      )}

      {/* NEW GROUP MODAL */}
      {showNewGroup && (
        <NewGroupModal
          onClose={() => setShowNewGroup(false)}
          onCreated={onConversationCreated}
        />
      )}

    </div>
  );
}