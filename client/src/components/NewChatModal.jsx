import { useEffect, useState } from "react";
import Avatar from "./Avatar";
import { getAllUsers, searchUsers, createPrivateConversation } from "../services/chatService";

export default function NewChatModal({ onClose, onCreated }) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getAllUsers().then(setUsers).catch(() => {});
  }, []);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!query.trim()) {
        getAllUsers().then(setUsers).catch(() => {});
        return;
      }
      setLoading(true);
      try {
        const results = await searchUsers(query);
        setUsers(results);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const handleSelect = async (userId) => {
    const convo = await createPrivateConversation(userId);
    onCreated(convo);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>New Chat</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        <input
          className="modal-search"
          placeholder="Search by name or username"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <div className="modal-list">
          {loading && <p className="modal-empty">Searching...</p>}
          {!loading && users.length === 0 && <p className="modal-empty">No users found</p>}
          {users.map((u) => (
            <div key={u._id} className="modal-list-item" onClick={() => handleSelect(u._id)}>
              <Avatar src={u.profilePicture} name={u.name} online={u.isOnline} />
              <div>
                <div className="modal-list-item-name">{u.name}</div>
                <div className="modal-list-item-username">@{u.username}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
