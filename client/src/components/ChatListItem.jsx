import Avatar from "./Avatar";
import { formatTime } from "../utils/format";

export default function ChatListItem({ conversation, currentUserId, isOnline, unreadCount, active, onClick }) {
  const isGroup = conversation.type === "group";
  const other = !isGroup
    ? conversation.participants.find((p) => p._id !== currentUserId)
    : null;

  const name = isGroup ? conversation.groupName : other?.name || "Unknown";
  const picture = isGroup ? conversation.groupImage : other?.profilePicture;
  const online = !isGroup && isOnline;

  const lastMsg = conversation.lastMessage;
  let preview = "No messages yet";
  if (lastMsg) {
    if (lastMsg.deleted) preview = "This message was deleted";
    else if (lastMsg.messageType === "image") preview = "📷 Photo";
    else if (lastMsg.messageType === "file") preview = "📎 File";
    else preview = lastMsg.text;
  }

  return (
    <div className={`chat-list-item ${active ? "active" : ""}`} onClick={onClick}>
      <Avatar src={picture} name={name} online={online} />
      <div className="chat-list-item-body">
        <div className="chat-list-item-top">
          <span className="chat-list-item-name">{name}</span>
          {lastMsg && <span className="chat-list-item-time">{formatTime(lastMsg.createdAt)}</span>}
        </div>
        <div className="chat-list-item-bottom">
          <span className="chat-list-item-preview">{preview}</span>
          {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
        </div>
      </div>
    </div>
  );
}
