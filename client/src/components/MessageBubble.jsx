import { API_BASE } from "../services/api";
import {
  formatTime,
  formatFileSize,
  fileUrl,
} from "../utils/format";
import Avatar from "./Avatar";

function StatusTicks({ status }) {
  if (status === "sending") {
    return <span className="ticks">⌛</span>;
  }

  if (status === "sent") {
    return <span className="ticks">✓</span>;
  }

  if (status === "delivered") {
    return <span className="ticks">✓✓</span>;
  }

  if (status === "read") {
    return (
      <span className="ticks ticks-read">
        ✓✓
      </span>
    );
  }

  return null;
}

export default function MessageBubble({
  message,
  isOwn,
  showSender,
  onDelete,
}) {
  if (message.deleted) {
    return (
      <div
        className={`msg-row ${
          isOwn ? "own" : "other"
        }`}
      >
        <div className="msg-bubble deleted-bubble">
          <em>This message was deleted</em>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`msg-row ${
        isOwn ? "own" : "other"
      }`}
    >
      <div className="msg-bubble-wrap">
        {showSender && !isOwn && (
          <span className="msg-sender-name">
            {message.sender?.name}
          </span>
        )}

        <div
          className={`msg-bubble ${
            isOwn
              ? "own-bubble"
              : "other-bubble"
          }`}
        >
          {message.messageType === "image" &&
            message.fileUrl && (
              <img
                className="msg-image"
                src={fileUrl(
                  API_BASE,
                  message.fileUrl
                )}
                alt={
                  message.fileName || "image"
                }
              />
            )}

          {message.messageType === "file" &&
            message.fileUrl && (
              <a
                className="msg-file"
                href={fileUrl(
                  API_BASE,
                  message.fileUrl
                )}
                target="_blank"
                rel="noreferrer"
                download={message.fileName}
              >
                <span className="msg-file-icon">
                  📎
                </span>

                <span className="msg-file-info">
                  <span className="msg-file-name">
                    {message.fileName}
                  </span>

                  <span className="msg-file-size">
                    {formatFileSize(
                      message.fileSize
                    )}
                  </span>
                </span>
              </a>
            )}

          {message.text && (
            <p className="msg-text">
              {message.text}
            </p>
          )}

          <div className="msg-meta">
            <span className="msg-time">
              {formatTime(
                message.createdAt
              )}
            </span>

            {isOwn && (
              <StatusTicks
                status={message.status}
              />
            )}
          </div>

          {isOwn && (
            <button
              className="msg-delete-btn"
              onClick={() =>
                onDelete(message._id)
              }
              title="Delete"
            >
              🗑
            </button>
          )}
        </div>
      </div>
    </div>
  );
}