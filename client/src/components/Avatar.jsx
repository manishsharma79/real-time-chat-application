import { API_BASE } from "../services/api";
import { fileUrl } from "../utils/format";

export default function Avatar({ src, name = "", size = 44, online = false }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="avatar" style={{ width: size, height: size }}>
      {src ? (
        <img src={fileUrl(API_BASE, src)} alt={name} />
      ) : (
        <span className="avatar-initials" style={{ fontSize: size / 2.4 }}>
          {initials || "?"}
        </span>
      )}
      {online && <span className="online-dot" />}
    </div>
  );
}
