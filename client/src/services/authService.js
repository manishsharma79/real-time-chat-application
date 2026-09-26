import api from "./api";

export const registerUser = async (formData) => {
  const { data } = await api.post("/auth/register", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const loginUser = async (emailOrUsername, password) => {
  const { data } = await api.post("/auth/login", { emailOrUsername, password });
  return data;
};

export const logoutUser = async () => {
  const { data } = await api.post("/auth/logout");
  return data;
};

export const getMe = async () => {
  const { data } = await api.get("/auth/me");
  return data;
};
