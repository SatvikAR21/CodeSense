import { useState } from "react";

export default function PRInput({ onSubmit, loading, hasResult, onReset }) {
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [urlError, setUrlError] = useState("");

  function parseGitHubUrl(raw) {
    const match = raw.match(/github\.com\/([^/]+\/[^/]+)\/pull\/(\d+)/);
    if (!match) return null;
    return { repo: match[1], prNumber: parseInt(match[2]) };
  }

  function handleSubmit(e) {
    e.preventDefault();
    setUrlError("");
    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      setUrlError("Paste a valid GitHub PR URL, e.g. github.com/owner/repo/pull/42");
      return;
    }
    onSubmit({ ...parsed, token });
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-card">
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring spinner-ring--2"></div>
            <div className="spinner-ring spinner-ring--3"></div>
          </div>
          <p className="loading-title">Analyzing your PR</p>
          <div className="loading-steps">
            <LoadingStep label="Fetching diff from GitHub"      delay={0}    />
            <LoadingStep label="Chunking code for CodeLlama"    delay={900}  />
            <LoadingStep label="Running AI analysis"            delay={1700} />
            <LoadingStep label="Structuring review output"      delay={2300} />
          </div>
        </div>
      </div>
    );
  }

  if (hasResult) {
    return (
      <div className="result-bar">
        <div className="result-bar-url">{url}</div>
        <button className="btn-ghost" onClick={onReset}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 7a5 5 0 1 0 1-2.9M2 4V7h3" stroke="currentColor"
              strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          New review
        </button>
      </div>
    );
  }

  return (
    <form className="pr-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <div className={`input-group ${urlError ? "input-group--error" : ""}`}>
          <label className="input-label">GitHub PR URL</label>
          <div className="input-wrapper">
            <svg className="input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 3.5A2.5 2.5 0 0 1 8.5 1a2.5 2.5 0 0 1 .5 4.95V7H9a1 1 0 0 0-1 1v.05A2.5 2.5 0 1 1 6.5 10H7a1 1 0 0 0 1-1V8a3 3 0 0 1 3-3h.05A2.5 2.5 0 0 1 8.5 1z"
                stroke="currentColor" strokeWidth="1.2" fill="none"/>
            </svg>
            <input
              type="url"
              className="text-input"
              placeholder="https://github.com/owner/repo/pull/42"
              value={url}
              onChange={e => { setUrl(e.target.value); setUrlError(""); }}
              required
            />
          </div>
          {urlError && <p className="input-error">{urlError}</p>}
        </div>

        <div className="input-group">
          <label className="input-label">
            GitHub token
            <span className="label-hint">optional — for private repos</span>
          </label>
          <div className="input-wrapper">
            <svg className="input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <input
              type={showToken ? "text" : "password"}
              className="text-input"
              placeholder="ghp_xxxxxxxxxxxx"
              value={token}
              onChange={e => setToken(e.target.value)}
            />
            <button type="button" className="input-toggle"
              onClick={() => setShowToken(!showToken)} tabIndex={-1}>
              {showToken ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 7s2-4 6-4 6 4 6 4-2 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.2"/>
                  <circle cx="7" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M2 2l10 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 7s2-4 6-4 6 4 6 4-2 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.2"/>
                  <circle cx="7" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      <button type="submit" className="submit-btn">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        Analyze pull request
      </button>
    </form>
  );
}

function LoadingStep({ label, delay }) {
  const [done, setDone] = useState(false);
  const [active, setActive] = useState(false);

  useState(() => {
    const t1 = setTimeout(() => setActive(true), delay);
    const t2 = setTimeout(() => setDone(true), delay + 600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  });

  return (
    <div className={`loading-step ${active ? "loading-step--active" : ""} ${done ? "loading-step--done" : ""}`}>
      <div className="step-dot">
        {done && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.4"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <span>{label}</span>
    </div>
  );
}
