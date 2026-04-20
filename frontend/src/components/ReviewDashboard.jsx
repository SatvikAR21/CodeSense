import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import SeverityBadge from "./SeverityBadge";
import ScoreMeter from "./ScoreMeter";

export default function ReviewDashboard({ review, showPDF = true }) {
  const { authFetch } = useAuth();
  const [activeTab, setActiveTab] = useState("bugs");
  const [downloading, setDownloading] = useState(false);

  const tabs = [
    { id: "bugs",       label: "Bugs",       count: review.bugs.length,        color: "red"    },
    { id: "security",   label: "Security",   count: review.security.length,    color: "amber"  },
    { id: "complexity", label: "Complexity", count: review.complexity.length,  color: "purple" },
    { id: "style",      label: "Style",      count: review.style.length,       color: "blue"   },
  ];

  const highCount = review.bugs.filter(b => b.severity === "HIGH").length
                  + review.security.length;

  async function handleExportPDF() {
    if (!review.id) return;
    setDownloading(true);
    try {
      const res = await authFetch(`/api/review/${review.id}/pdf`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ReviewAI_${review.repo?.replace("/", "_") || "report"}_PR${review.pr_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("PDF export failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="dashboard">
      <div className="summary-strip">
        <div className="summary-left">
          <div className="pr-meta">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{flexShrink:0}}>
              <circle cx="3.5" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <circle cx="3.5" cy="11" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <circle cx="10.5" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M3.5 4.5V9.5M5 3h2.5a2 2 0 0 1 2 2v1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <span className="pr-title">{review.pr_title}</span>
          </div>
          <p className="summary-text">{review.summary}</p>
          {highCount > 0 && (
            <div className="critical-banner">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{flexShrink:0}}>
                <path d="M7 1L13 12H1L7 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                <path d="M7 5.5v3M7 10v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              {highCount} critical issue{highCount > 1 ? "s" : ""} require immediate attention
            </div>
          )}

          {showPDF && review.id && (
            <button
              className="pdf-btn"
              onClick={handleExportPDF}
              disabled={downloading}
            >
              {downloading ? (
                <>
                  <div className="btn-spinner" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor"
                      strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Export audit report PDF
                </>
              )}
            </button>
          )}
        </div>

        <div className="summary-right">
          <ScoreMeter score={review.overall_score} />
          <div className="stat-row">
            <StatChip label="Issues"
              value={review.bugs.length + review.security.length + review.complexity.length} />
            <StatChip label="Author" value={`@${review.author}`} mono />
          </div>
        </div>
      </div>

      <div className="tab-nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn tab-btn--${tab.color} ${activeTab === tab.id ? "tab-btn--active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            <span className={`tab-count tab-count--${tab.color}`}>{tab.count}</span>
          </button>
        ))}
      </div>

      <div className="tab-panel">
        {activeTab === "bugs" && (
          <div className="issue-list">
            {review.bugs.length === 0
              ? <EmptyState message="No bugs detected" />
              : review.bugs.map((bug, i) => (
                <div key={i} className="issue-card issue-card--bug">
                  <div className="issue-header">
                    <SeverityBadge severity={bug.severity} />
                    <span className="issue-line">Line {bug.line}</span>
                  </div>
                  <p className="issue-desc">{bug.description}</p>
                </div>
              ))
            }
          </div>
        )}

        {activeTab === "security" && (
          <div className="issue-list">
            {review.security.length === 0
              ? <EmptyState message="No security issues found" />
              : review.security.map((sec, i) => (
                <div key={i} className="issue-card issue-card--security">
                  <div className="issue-header">
                    <span className="severity-badge severity-badge--security">SECURITY</span>
                    <span className="issue-line">Line {sec.line}</span>
                  </div>
                  <p className="issue-desc">{sec.issue}</p>
                  <div className="fix-block">
                    <div className="fix-label">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Suggested fix
                    </div>
                    <code className="fix-code">{sec.fix}</code>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {activeTab === "complexity" && (
          <div className="issue-list">
            {review.complexity.length === 0
              ? <EmptyState message="Complexity looks good" />
              : review.complexity.map((cx, i) => (
                <div key={i} className="issue-card issue-card--complexity">
                  <div className="issue-header">
                    <span className="severity-badge severity-badge--complexity">REFACTOR</span>
                    <code className="fn-name">{cx.function}</code>
                  </div>
                  <p className="issue-desc">{cx.suggestion}</p>
                </div>
              ))
            }
          </div>
        )}

        {activeTab === "style" && (
          <div className="issue-list">
            {review.style.length === 0
              ? <EmptyState message="Style looks great" />
              : review.style.map((s, i) => (
                <div key={i} className="issue-card issue-card--style">
                  <div className="issue-header">
                    <span className="severity-badge severity-badge--style">STYLE</span>
                  </div>
                  <p className="issue-desc">{s.description}</p>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
}

function StatChip({ label, value, mono }) {
  return (
    <div className="stat-chip">
      <span className="stat-label">{label}</span>
      <span className={`stat-value ${mono ? "mono" : ""}`}>{value}</span>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M11 4l1.5 3.5L16 8l-2.5 2.5.5 3.5L11 12l-3 2 .5-3.5L6 8l3.5-.5L11 4z"
            stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
        </svg>
      </div>
      <p>{message}</p>
    </div>
  );
}
