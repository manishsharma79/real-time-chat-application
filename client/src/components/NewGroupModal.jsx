import { useEffect, useState } from "react";
import Avatar from "./Avatar";
import {
  getAllUsers,
  createGroupConversation,
} from "../services/chatService";
import { useToast } from "./Toast";

export default function NewGroupModal({ onClose, onCreated }) {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [groupImage, setGroupImage] = useState(null);
  const [creating, setCreating] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    getAllUsers()
      .then(setUsers)
      .catch(() => {});
  }, []);

  const toggle = (id) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      return showToast("Group name is required", "error");
    }

    if (selected.length === 0) {
      return showToast("Add at least one member", "error");
    }

    setCreating(true);

    try {
      const formData = new FormData();

      formData.append("groupName", groupName.trim());

      // Send participant IDs as JSON array
      formData.append(
        "participantIds",
        JSON.stringify(selected)
      );

      if (groupImage) {
        formData.append("groupImage", groupImage);
      }

      const convo = await createGroupConversation(formData);

      onCreated(convo);
      onClose();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to create group",
        "error"
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>New Group</h3>

          <button
            className="icon-btn"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <input
          className="modal-search"
          placeholder="Group name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            setGroupImage(e.target.files[0])
          }
        />

        <p className="modal-section-label">
          Add members ({selected.length} selected)
        </p>

        <div className="modal-list">
          {users.map((u) => (
            <div
              key={u._id}
              className={`modal-list-item ${
                selected.includes(u._id) ? "selected" : ""
              }`}
              onClick={() => toggle(u._id)}
            >
              <Avatar
                src={u.profilePicture}
                name={u.name}
                online={u.isOnline}
              />

              <div>
                <div className="modal-list-item-name">
                  {u.name}
                </div>

                <div className="modal-list-item-username">
                  @{u.username}
                </div>
              </div>

              <input
                type="checkbox"
                checked={selected.includes(u._id)}
                readOnly
              />
            </div>
          ))}
        </div>

        <button
          className="primary-btn"
          onClick={handleCreate}
          disabled={creating}
        >
          {creating ? "Creating..." : "Create Group"}
        </button>
      </div>
    </div>
  );
}