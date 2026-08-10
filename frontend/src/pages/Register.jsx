import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/auth.css";

const ShieldIcon = (props) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    {...props}
  >
    <path
      d="M12 2.5c-.28 0-.55.08-.78.22L5.8 5.82c-.48.26-.78.76-.78 1.31v5.12c0 5.02 3.25 8.92 6.66 9.98.2.06.4.06.6 0 3.41-1.06 6.66-4.96 6.66-9.98V7.13c0-.55-.3-1.05-.78-1.31l-5.42-3.1A1.6 1.6 0 0 0 12 2.5Z"
      stroke="white"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
    <path
      d="M9.25 12.2l1.9 1.9 3.7-4.1"
      stroke="white"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const EyeIcon = ({ open }) => {
  if (open) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M1.8 12s3.8-7 10.2-7 10.2 7 10.2 7-3.8 7-10.2 7S1.8 12 1.8 12Z"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="M12 15.3a3.3 3.3 0 1 0 0-6.6 3.3 3.3 0 0 0 0 6.6Z"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </svg>
    );
  }

  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3.5 4.9l17 17"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M10.6 9.4A3.3 3.3 0 0 0 12 15.3c.42 0 .82-.08 1.19-.22"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M6.2 6.9C3.6 8.7 1.8 12 1.8 12s3.8 7 10.2 7c2.1 0 4-.76 5.6-1.82"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M9.7 5.4c.74-.25 1.52-.4 2.3-.4 6.4 0 10.2 7 10.2 7a17 17 0 0 1-3.2 4.1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
};

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("student");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const canSubmit = useMemo(() => {
    return (
      username.trim().length > 0 &&
      email.trim().length > 0 &&
      password.length >= 6 &&
      confirmPassword.length >= 6 &&
      password === confirmPassword &&
      !loading
    );
  }, [username, email, password, confirmPassword, loading]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Keep backend/API logic intact (your backend currently expects `name`).
        body: JSON.stringify({
          name: username,
          email,
          password,
          role,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        navigate("/");
        return;
      }

      setError(data?.message || "Registration failed. Please try again.");
    } catch {
      setError("Unable to register. Please make sure the server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="auth-header">
          <div className="auth-logo" aria-hidden="true">
            <ShieldIcon />
          </div>
          <div>
            <h1 className="auth-title">Watchify</h1>
            <p className="auth-subtitle">AI-Powered Exam Proctoring Platform</p>
          </div>
        </div>

        {error ? <div className="auth-error">{error}</div> : null}

        <form className="auth-form" onSubmit={handleRegister}>
          <div className="auth-field">
            <label htmlFor="register-username">Username</label>
            <div className="auth-control">
              <input
                id="register-username"
                className="auth-input"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="register-email">Email</label>
            <div className="auth-control">
              <input
                id="register-email"
                className="auth-input"
                placeholder="Enter your email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="register-password">Password</label>
            <div className="auth-control">
              <input
                id="register-password"
                className="auth-input"
                placeholder="Create a password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="auth-icon-btn"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((v) => !v)}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="register-confirm-password">Confirm Password</label>
            <div className="auth-control">
              <input
                id="register-confirm-password"
                className="auth-input"
                placeholder="Confirm your password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="auth-icon-btn"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                onClick={() => setShowConfirmPassword((v) => !v)}
              >
                <EyeIcon open={showConfirmPassword} />
              </button>
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="register-role">Role</label>
            <div className="auth-control">
              <select
                id="register-role"
                className="auth-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="student">Student</option>
                <option value="mentor">Mentor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="auth-actions">
            <button className="auth-primary-btn" type="submit" disabled={!canSubmit}>
              {loading ? "Creating account..." : "Register"}
            </button>

            <div className="auth-divider" />

            <div className="auth-link-row">
              <span>Already have an account?</span>
              <Link className="auth-link" to="/">
                Login
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;
