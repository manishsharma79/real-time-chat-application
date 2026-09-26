import { useRef, useState } from "react";
import { Image, Paperclip, Send } from "lucide-react";

import { uploadFile } from "../services/chatService";
import { useTyping } from "../hooks/useTyping";
import { useToast } from "./Toast";

export default function MessageInput({ conversationId, onSend }) {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const { handleTyping } = useTyping(conversationId);
  const { showToast } = useToast();

  const handleTextChange = (e) => {
    setText(e.target.value);
    handleTyping();
  };

  const handleSendText = (e) => {
    e.preventDefault();

    if (!text.trim()) return;

    onSend({
      text: text.trim(),
      messageType: "text",
    });

    setText("");
  };

  const handleFilePick = async (e) => {
    const file = e.target.files[0];

    e.target.value = "";

    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      showToast("File exceeds 15MB limit", "error");
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const data = await uploadFile(file, setProgress);

      onSend({
        text: "",
        messageType: data.messageType,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
        fileType: data.fileType,
      });
    } catch (err) {
      showToast(
        err.response?.data?.message || "Upload failed",
        "error"
      );
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <form
      className="message-input-bar"
      onSubmit={handleSendText}
    >
      {/* Image button */}
      <button
        type="button"
        className="icon-btn"
        onClick={() => imageInputRef.current?.click()}
        title="Send image"
        disabled={uploading}
      >
        <Image size={20} strokeWidth={2} />
      </button>

      {/* File button */}
      <button
        type="button"
        className="icon-btn"
        onClick={() => fileInputRef.current?.click()}
        title="Send file"
        disabled={uploading}
      >
        <Paperclip size={20} strokeWidth={2} />
      </button>

      {/* Image input */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        hidden
        onChange={handleFilePick}
      />

      {/* File input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
        hidden
        onChange={handleFilePick}
      />

      {/* Message input */}
      <input
        className="message-text-input"
        placeholder={
          uploading
            ? `Uploading... ${progress}%`
            : "Type a message"
        }
        value={text}
        onChange={handleTextChange}
        disabled={uploading}
      />

      {/* Send button */}
      <button
        type="submit"
        className="send-btn"
        disabled={uploading || !text.trim()}
        title="Send message"
      >
        <Send size={19} strokeWidth={2} />
      </button>
    </form>
  );
}