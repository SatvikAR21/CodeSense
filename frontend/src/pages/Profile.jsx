import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function Profile() {
  const { user, authFetch, login, token } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: "", username: "" });
  const [editMode, setEditMode] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [meRes, histRes] = await Promise.all([
        authFetch("/api/auth/me"),
        authFetch("/api/history"),
      ]);
      const me = await meRes.json();
      const hist = await histRes.json();
      setProfile(me);
      setEditForm({ full_name: me.full_name || "", username: me.username || "" });
      setReviews(Array.isArray(hist) ? hist : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Build monthly chart data from review history
  function buildChartData() {
    const counts = Array(12).fill(0);
    const scores = Array(12).fill([]);
    reviews.forEach(r => {
      const m = new Date(r.created_at).getMonth();
      counts[m]++;
    });
    return MONTHS.map((month, i) => ({
      month,
      reviews: counts[i],
    }));
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setMsg("Image must be under 2MB.");
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      try {
        const res = await authFetch("/api/auth/upload-photo", {
          method: "POST",
          body: JSON.stringify({ photo: base64 }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail);
        setProfile(prev => ({ ...prev, photo: base64 }));
        // update user in context
        login(token, { ...user, photo: base64 });
        setMsg("Profile photo updated!");
      } catch (err) {
        setMsg(err.message);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSaveProfile() {
    setSaving(true);
    try {
      const res = await authFetch("/api/auth/update-profile", {
        method: "PATCH",
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setProfile(prev => ({ ...prev, ...editForm }));
      login(token, { ...user, ...editForm });
      setEditMode(false);
      setMsg("Profile updated successfully!");
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  function initials() {
    if (profile?.photo) return null;
    const n = profile?.full_name || profile?.username || "U";
    return n.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  }

  function avgScore() {
    if (!reviews.length) return 0;
    return Math.round(reviews.reduce((s, r) => s + r.overall_score, 0) / reviews.length);
  }

  function totalIssues() {
    return reviews.reduce((s, r) => s + (r.total_issues || 0), 0);
  }

  const chartData = buildChartData();
  const maxBar = Math.max(...chartData.map(d => d.reviews), 1);

  if (loading) return (
    <div className="profile-loading">
      <div className="spinner-ring" />
      Loading profile...
    </div>
  );

  return (
    <div className="profile-page">

      {msg && (
        <div className="profile-msg" onClick={() => setMsg("")}>
          {msg} <span style={{ opacity: 0.6, marginLeft: 8 }}>✕</span>
        </div>
      )}

      {/* ── Profile header ── */}
      <div className="profile-header-card">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar" onClick={() => fileRef.current.click()}>
            {profile?.photo
              ? <img src={profile.photo} alt="avatar" className="avatar-img" />
              : <span className="avatar-initials">{initials()}</span>
            }
            <div className="avatar-overlay">
              {uploading
                ? <div className="btn-spinner" />
                : (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M9 3v10M5 7l4-4 4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 15h12" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                )
              }
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }}
            onChange={handlePhotoUpload} />
          <p className="avatar-hint">Click to change photo</p>
        </div>

        <div className="profile-info">
          {editMode ? (
            <div className="edit-fields">
              <div className="edit-field-row">
                <div className="edit-field">
                  <label className="field-label">Full name</label>
                  <input className="field-input" value={editForm.full_name}
                    onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} />
                </div>
                <div className="edit-field">
                  <label className="field-label">Username</label>
                  <input className="field-input" value={editForm.username}
                    onChange={e => setEditForm({ ...editForm, username: e.target.value })} />
                </div>
              </div>
              <div className="edit-actions">
                <button className="prof-btn prof-btn--save" onClick={handleSaveProfile} disabled={saving}>
                  {saving ? "Saving..." : "Save changes"}
                </button>
                <button className="prof-btn prof-btn--cancel" onClick={() => setEditMode(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="profile-name">{profile?.full_name || profile?.username}</h1>
              <p className="profile-username">@{profile?.username}</p>
              <p className="profile-email">{profile?.email}</p>
              <p className="profile-joined">
                Member since {new Date(profile?.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
              <button className="prof-btn prof-btn--edit" onClick={() => setEditMode(true)}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M9 2l2 2-7 7H2V9l7-7z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                </svg>
                Edit profile
              </button>
            </>
          )}
        </div>

        {/* Quick stats */}
        <div className="profile-stats-grid">
          <ProfileStat label="Total reviews" value={reviews.length} color="violet" />
          <ProfileStat label="Avg score" value={`${avgScore()}/100`} color="green" />
          <ProfileStat label="Issues found" value={totalIssues()} color="amber" />
          <ProfileStat label="This month"
            value={chartData[new Date().getMonth()].reviews} color="blue" />
        </div>
      </div>

      {/* ── Monthly bar chart ── */}
      <div className="chart-card">
        <div className="chart-card-head">
          <div>
            <h2 className="chart-title">Review activity</h2>
            <p className="chart-sub">Monthly PRs analyzed — {new Date().getFullYear()}</p>
          </div>
          <div className="chart-legend">
            <span className="chart-legend-dot" />
            <span>Reviews</span>
          </div>
        </div>

        <div style={{ height: "260px", marginTop: "8px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap="30%" barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: "var(--cs-muted)", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--cs-muted)", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}
                axisLine={false} tickLine={false} allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--cs-surface)",
                  border: "1px solid var(--cs-border)",
                  borderRadius: "8px",
                  color: "var(--cs-text)",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "13px",
                }}
                cursor={{ fill: "rgba(99,102,241,0.06)" }}
              />
              <Bar dataKey="reviews" radius={[5, 5, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.reviews === maxBar ? "#6366f1" : entry.reviews > 0 ? "#4f46e5" : "rgba(99,102,241,0.2)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Recent reviews ── */}
      <div className="profile-recent">
        <div className="profile-recent-head">
          <h2 className="chart-title">Recent reviews</h2>
          <button className="prof-btn prof-btn--ghost" onClick={() => navigate("/history")}>
            View all →
          </button>
        </div>
        {reviews.length === 0 ? (
          <div className="profile-empty">
            No reviews yet. <button className="auth-link" onClick={() => navigate("/app")}>Analyze your first PR</button>
          </div>
        ) : (
          <div className="recent-list">
            {reviews.slice(0, 5).map(r => (
              <div key={r.id} className="recent-item" onClick={() => navigate(`/review/${r.id}`)}>
                <div className="recent-score" style={{ color: scoreColor(r.overall_score) }}>
                  {r.overall_score}
                </div>
                <div className="recent-info">
                  <p className="recent-title">{r.pr_title}</p>
                  <p className="recent-meta">{r.repo} · #{r.pr_number} · {r.total_issues} issues</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "var(--cs-muted)", flexShrink: 0 }}>
                  <path d="M4 7h6M7 4l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileStat({ label, value, color }) {
  return (
    <div className={`pstat pstat--${color}`}>
      <span className="pstat-val">{value}</span>
      <span className="pstat-label">{label}</span>
    </div>
  );
}

function scoreColor(s) {
  if (s >= 80) return "#34d399";
  if (s >= 60) return "#fbbf24";
  if (s >= 40) return "#f97316";
  return "#f87171";
}
