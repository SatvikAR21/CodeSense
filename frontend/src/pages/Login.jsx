import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const base = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${base}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Login failed");
      login(data.access_token, data.user);
      navigate("/app");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-icon">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 4h12M3 8h8M3 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="14" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M13 12l.8.8 1.6-1.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="logo-text">CodeSense</span>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-sub">Sign in to your account to continue</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label className="field-label">Email</label>
            <input
              type="email" required
              className="field-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="field">
            <label className="field-label">Password</label>
            <input
              type="password" required
              className="field-input"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account?{" "}
          <Link to="/signup" className="auth-link">Create one</Link>
        </p>
      </div>
    </div>
  );
}
