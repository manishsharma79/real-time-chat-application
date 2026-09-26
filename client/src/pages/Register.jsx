import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

import { registerUser } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [profilePic, setProfilePic] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      Object.entries(form).forEach(([k, v]) =>
        formData.append(k, v)
      );

      if (profilePic) {
        formData.append(
          "profilePicture",
          profilePic
        );
      }

      const data = await registerUser(formData);

      login(data, data.token);

      showToast(
        `Welcome to ChatApp, ${data.name}!`,
        "success"
      );

      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form
        className="auth-card"
        onSubmit={handleSubmit}
      >
        <h1>ChatApp</h1>

        <p className="auth-subtitle">
          Create your account
        </p>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <label>Full Name</label>

        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <label>Username</label>

        <input
          name="username"
          value={form.username}
          onChange={handleChange}
          required
        />

        <label>Email</label>

        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <label>Password</label>

        <div className="password-input-wrapper">
          <input
            type={
              showPassword
                ? "text"
                : "password"
            }
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={6}
          />

          <button
            type="button"
            className="password-toggle"
            onClick={() =>
              setShowPassword(
                (prev) => !prev
              )
            }
            title={
              showPassword
                ? "Hide password"
                : "Show password"
            }
            aria-label={
              showPassword
                ? "Hide password"
                : "Show password"
            }
          >
            {showPassword ? (
              <EyeOff
                size={19}
                strokeWidth={2}
              />
            ) : (
              <Eye
                size={19}
                strokeWidth={2}
              />
            )}
          </button>
        </div>

        <label>Confirm Password</label>

        <div className="password-input-wrapper">
          <input
            type={
              showConfirmPassword
                ? "text"
                : "password"
            }
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            minLength={6}
          />

          <button
            type="button"
            className="password-toggle"
            onClick={() =>
              setShowConfirmPassword(
                (prev) => !prev
              )
            }
            title={
              showConfirmPassword
                ? "Hide password"
                : "Show password"
            }
            aria-label={
              showConfirmPassword
                ? "Hide password"
                : "Show password"
            }
          >
            {showConfirmPassword ? (
              <EyeOff
                size={19}
                strokeWidth={2}
              />
            ) : (
              <Eye
                size={19}
                strokeWidth={2}
              />
            )}
          </button>
        </div>

        <label>
          Profile Picture (optional)
        </label>

        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            setProfilePic(
              e.target.files[0]
            )
          }
        />

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Creating account..."
            : "Sign Up"}
        </button>

        <p className="auth-footer">
          Already have an account?{" "}
          <Link to="/login">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}