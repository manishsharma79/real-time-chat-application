import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "../components/Avatar.jsx";
import { useAuth } from "../context/AuthContext";
import { updateProfile, updatePassword } from "../services/chatService";
import { useToast } from "../components/Toast";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || "");
  const [picFile, setPicFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("bio", bio);
      if (picFile) formData.append("profilePicture", picFile);

      const updated = await updateProfile(formData);
      updateUser({ ...user, ...updated });
      showToast("Profile updated", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangingPw(true);
    try {
      await updatePassword(currentPassword, newPassword);
      showToast("Password changed", "success");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to change password", "error");
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <button className="icon-btn back-btn" onClick={() => navigate("/")}>← Back</button>
        <h2>Your Profile</h2>

        <div className="profile-avatar-row">
          <Avatar src={picFile ? URL.createObjectURL(picFile) : user.profilePicture} name={user.name} size={90} />
          <input type="file" accept="image/*" onChange={(e) => setPicFile(e.target.files[0])} />
        </div>

        <form onSubmit={handleSaveProfile}>
          <label>Full Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />

          <label>Username</label>
          <input value={user.username} disabled />

          <label>Email</label>
          <input value={user.email} disabled />

          <label>Bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />

          <button type="submit" className="primary-btn" disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>

        <hr />

        <h3>Change Password</h3>
        <form onSubmit={handleChangePassword}>
          <label>Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />

          <label>New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={6}
            required
          />

          <button type="submit" className="primary-btn" disabled={changingPw}>
            {changingPw ? "Updating..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
