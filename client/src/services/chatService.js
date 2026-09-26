import api from "./api";

// Users
export const searchUsers = async (q) => {
  const { data } = await api.get(`/users/search?q=${encodeURIComponent(q)}`);
  return data;
};

export const getAllUsers = async () => {
  const { data } = await api.get("/users");
  return data;
};

export const updateProfile = async (formData) => {
  const { data } = await api.put("/users/profile", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const updatePassword = async (currentPassword, newPassword) => {
  const { data } = await api.put("/users/password", { currentPassword, newPassword });
  return data;
};

// Conversations
export const getConversations = async () => {
  const { data } = await api.get("/conversations");
  return data;
};

export const createPrivateConversation = async (userId) => {
  const { data } = await api.post("/conversations/private", { userId });
  return data;
};

export const createGroupConversation = async (formData) => {
  const { data } = await api.post("/conversations/group", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const updateConversation = async (id, payload) => {
  const { data } = await api.put(`/conversations/${id}`, payload);
  return data;
};

export const deleteConversation = async (id) => {
  const { data } = await api.delete(`/conversations/${id}`);
  return data;
};

// Messages
export const getMessages = async (conversationId, page = 1) => {
  const { data } = await api.get(`/messages/${conversationId}?page=${page}`);
  return data;
};

export const deleteMessage = async (messageId) => {
  const { data } = await api.delete(`/messages/${messageId}`);
  return data;
};

// Upload
export const uploadFile = async (file, onProgress) => {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (evt) => {
      if (onProgress) onProgress(Math.round((evt.loaded * 100) / evt.total));
    },
  });
  return data;
};

// Notifications
export const getNotifications = async () => {
  const { data } = await api.get("/notifications");
  return data;
};

export const markAllNotificationsRead = async () => {
  const { data } = await api.put("/notifications/read-all");
  return data;
};
