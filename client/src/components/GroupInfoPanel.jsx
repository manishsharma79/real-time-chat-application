import { useState } from "react";
import Avatar from "./Avatar";
import { useAuth } from "../context/AuthContext";
import { updateConversation, deleteConversation } from "../services/chatService";
import { useToast } from "./Toast";

export default function GroupInfoPanel({ conversation, onClose, onUpdated, onLeft }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(conversation.groupName);

  const isAdmin = conversation.admins?.some((a) => a === user._id || a._id === user._id);

  const handleRename = async () => {
    try {
      const updated = await updateConversation(conversation._id, { groupName: name });
      onUpdated(updated);
      setRenaming(false);
      showToast("Group renamed", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to rename group", "error");
    }
  };

  const handleRemove = async (memberId) => {
    try {
      const updated = await updateConversation(conversation._id, { removeMembers: [memberId] });
      onUpdated(updated);
      showToast("Member removed", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to remove member", "error");
    }
  };

  const handleLeave = async () => {
    try {
      await deleteConversation(conversation._id);
      showToast("You left the group", "success");
      onLeft();
    } catch (err) {
      showToast("Failed to leave group", "error");
    }
  };

  return (
    <div className="group-info-panel">
      <div className="modal-header">
        <h3>Group Info</h3>
        <button className="icon-btn" onClick={onClose}>✕</button>
      </div>

      <div className="group-info-avatar">
        <Avatar src={conversation.groupImage} name={conversation.groupName} size={80} />
        {renaming ? (
          <div className="group-rename-row">
            <input value={name} onChange={(e) => setName(e.target.value)} />
            <button className="primary-btn" onClick={handleRename}>Save</button>
          </div>
        ) : (
          <h2 onClick={() => isAdmin && setRenaming(true)} style={{ cursor: isAdmin ? "pointer" : "default" }}>
            {conversation.groupName}
          </h2>
        )}
      </div>

      <p className="modal-section-label">{conversation.participants.length} members</p>
      <div className="modal-list">
        {conversation.participants.map((p) => {
          const memberIsAdmin = conversation.admins?.some((a) => a === p._id || a._id === p._id);
          return (
            <div key={p._id} className="modal-list-item">
              <Avatar src={p.profilePicture} name={p.name} online={p.isOnline} />
              <div style={{ flex: 1 }}>
                <div className="modal-list-item-name">
                  {p.name} {memberIsAdmin && <span className="admin-tag">Admin</span>}
                </div>
                <div className="modal-list-item-username">@{p.username}</div>
              </div>
              {isAdmin && p._id !== user._id && (
                <button className="icon-btn" onClick={() => handleRemove(p._id)} title="Remove">
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>

      <button className="danger-btn" onClick={handleLeave}>Leave Group</button>
    </div>
  );
}
