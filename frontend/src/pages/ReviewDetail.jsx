import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ReviewDashboard from "../components/ReviewDashboard";

export default function ReviewDetail() {
  const { id } = useParams();
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReview();
  }, [id]);

  async function loadReview() {
    try {
      const res = await authFetch(`/api/review/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setReview(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadPDF() {
    const res = await authFetch(`/api/review/${id}/pdf`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `review_${id}.pdf`;
    a.click();
  }

  if (loading) {
    return (
      <div className="history-loading">
        <div className="spinner-ring"></div>
        <span>Loading review...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main">
        <div className="auth-error">{error}</div>
        <button className="btn-new" onClick={() => navigate("/history")}
          style={{ marginTop: "16px" }}>
          Back to history
        </button>
      </div>
    );
  }

  return (
    <div className="main">
      <div className="review-detail-bar">
        <button className="btn-ghost" onClick={() => navigate("/history")}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.4"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to history
        </button>
        <button className="hcard-btn hcard-btn--pdf" onClick={handleDownloadPDF}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor"
              strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Export PDF
        </button>
      </div>
      {review && <ReviewDashboard review={review} showPDF={false} />}
    </div>
  );
}
