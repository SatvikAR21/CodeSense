import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function History() {
  const { authFetch, user } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setLoading(true);
    try {
      const res = await authFetch("/api/history");
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setReviews(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, e) {
    e.stopPropagation();
    setDeleting(id);
    try {
      await authFetch(`/api/review/${id}`, { method: "DELETE" });
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert("Failed to delete review.");
    } finally {
      setDeleting(null);
    }
  }

  async function handleDownloadPDF(id, e) {
    e.stopPropagation();
    const res = await authFetch(`/api/review/${id}/pdf`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `review_${id}.pdf`;
    a.click();
  }

  function scoreColor(score) {
    if (score >= 80) return "#22c55e";
    if (score >= 60) return "#f59e0b";
    if (score >= 40) return "#f97316";
    return "#ef4444";
  }

  function scoreLabel(score) {
    if (score >= 80) return "Great";
    if (score >= 60) return "Fair";
    if (score >= 40) return "Risky";
    return "Critical";
  }

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return "Just now";
  }

  return (
    <div className="history-page">
      <div className="history-header">
        <div>
          <h1 className="history-title">Review history</h1>
          <p className="history-sub">
            {user?.username} · {reviews.length} review{reviews.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button className="btn-new" onClick={() => navigate("/")}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          New review
        </button>
      </div>

      {loading && (
        <div className="history-loading">
          <div className="spinner-ring"></div>
          <span>Loading your reviews...</span>
        </div>
      )}

      {error && <div className="auth-error">{error}</div>}

      {!loading && reviews.length === 0 && (
        <div className="history-empty">
          <div className="empty-icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M4 6h20M4 12h14M4 18h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p>No reviews yet</p>
          <span>Analyze your first PR to see it here</span>
          <button className="auth-btn" style={{marginTop:"16px",width:"auto",padding:"10px 24px"}}
            onClick={() => navigate("/")}>
            Analyze a PR
          </button>
        </div>
      )}

      <div className="history-list">
        {reviews.map(review => (
          <div
            key={review.id}
            className="history-card"
            onClick={() => navigate(`/review/${review.id}`)}
          >
            <div className="hcard-left">
              <div className="hcard-score" style={{ color: scoreColor(review.overall_score) }}>
                <span className="hcard-score-num">{review.overall_score}</span>
                <span className="hcard-score-label">{scoreLabel(review.overall_score)}</span>
              </div>
              <div className="hcard-info">
                <p className="hcard-title">{review.pr_title}</p>
                <div className="hcard-meta">
                  <span className="hcard-repo">{review.repo} #{review.pr_number}</span>
                  <span className="hcard-dot">·</span>
                  <span>{review.total_issues} issue{review.total_issues !== 1 ? "s" : ""}</span>
                  <span className="hcard-dot">·</span>
                  <span>{timeAgo(review.created_at)}</span>
                </div>
                <p className="hcard-summary">{review.summary}</p>
              </div>
            </div>
            <div className="hcard-actions">
              <button
                className="hcard-btn hcard-btn--pdf"
                onClick={(e) => handleDownloadPDF(review.id, e)}
                title="Download PDF"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                PDF
              </button>
              <button
                className="hcard-btn hcard-btn--del"
                onClick={(e) => handleDelete(review.id, e)}
                disabled={deleting === review.id}
                title="Delete"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 4h10M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4M3 4l.8 7.5h6.4L11 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
