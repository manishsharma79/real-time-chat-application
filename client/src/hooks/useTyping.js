import { useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";

// Debounced typing emitter: sends typing:start once, typing:stop after pause
export function useTyping(conversationId) {
  const { socket } = useSocket();
  const timeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const handleTyping = () => {
    if (!socket || !conversationId) return;

    if (!isTypingRef.current) {
      socket.emit("typing:start", { conversationId });
      isTypingRef.current = true;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      socket.emit("typing:stop", { conversationId });
      isTypingRef.current = false;
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (isTypingRef.current && socket && conversationId) {
        socket.emit("typing:stop", { conversationId });
      }
    };
  }, [conversationId, socket]);

  return { handleTyping };
}
