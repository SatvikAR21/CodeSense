import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import PRInput from "../components/PRInput";
import ReviewDashboard from "../components/ReviewDashboard";

export default function Home() {
  const { authFetch } = useAuth();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleReview({ repo, prNumber, token }) {
    setLoading(true);
    setError(null);
    setReview(null);
    try {
      const res = await authFetch("/api/review", {
        method: "POST",
        body: JSON.stringify({ repo, pr_number: prNumber, github_token: token }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || `Server error: ${res.status}`);
      }
      const data = await res.json();
      setReview(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setReview(null);
    setError(null);
  }

  return (
    <main className="main">
      {!review && !loading && (
        <div className="hero">
          <div className="hero-badge">Powered by CodeLlama 13B</div>
          <h1 className="hero-title">
            Code review,<br />
            <span className="hero-accent">supercharged by AI</span>
          </h1>
          <p className="hero-sub">
            Paste a GitHub PR link. Get instant analysis of bugs, security
            vulnerabilities, complexity issues, and style violations — with
            line-level fix suggestions.
          </p>
        </div>
      )}
      <PRInput
        onSubmit={handleReview}
        loading={loading}
        hasResult={!!review}
        onReset={handleReset}
      />
      {error && (
        <div className="error-banner">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{flexShrink:0}}>
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 5v3.5M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {error}
        </div>
      )}
      {review && <ReviewDashboard review={review} />}
    </main>
  );
}
