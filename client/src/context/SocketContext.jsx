import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

const SOCKET_URL =
  "https://real-time-chat-application-knm5.onrender.com";

export function SocketProvider({ children }) {
  const { user } = useAuth();

  const socketRef = useRef(null);

  const [connected, setConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [lastSeenUsers, setLastSeenUsers] = useState({});

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!user || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      setConnected(false);
      setOnlineUserIds(new Set());

      return;
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("users:online-list", (userIds) => {
      setOnlineUserIds(new Set(userIds));
    });

    socket.on("user:online", ({ userId }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.add(String(userId));
        return next;
      });
    });

    socket.on("user:offline", ({ userId, lastSeen }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(String(userId));
        return next;
      });

      if (lastSeen) {
        setLastSeenUsers((prev) => ({
          ...prev,
          [String(userId)]: lastSeen,
        }));
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        connected,
        onlineUserIds,
        lastSeenUsers,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);