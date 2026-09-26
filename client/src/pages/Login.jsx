import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

import { loginUser } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

export default function Login() {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await loginUser(
        emailOrUsername,
        password
      );

      login(data, data.token);

      showToast(
        `Welcome back, ${data.name}!`,
        "success"
      );

      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed"
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
          Log in to continue
        </p>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <label>Email or Username</label>

        <input
          type="text"
          value={emailOrUsername}
          onChange={(e) =>
            setEmailOrUsername(e.target.value)
          }
          required
          autoFocus
        />

        <label>Password</label>

        <div className="password-input-wrapper">
          <input
            type={
              showPassword
                ? "text"
                : "password"
            }
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            required
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

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Logging in..."
            : "Log In"}
        </button>

        <p className="auth-footer">
          Don't have an account?{" "}
          <Link to="/register">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}