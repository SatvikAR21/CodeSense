import { useEffect, useState } from "react";

export default function ScoreMeter({ score }) {
  const [animated, setAnimated] = useState(0);
  const radius = 36;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (animated / 100) * circ;

  const color =
    score >= 80 ? "#22c55e" :
    score >= 60 ? "#f59e0b" :
    score >= 40 ? "#f97316" : "#ef4444";

  const label =
    score >= 80 ? "Great"  :
    score >= 60 ? "Fair"   :
    score >= 40 ? "Risky"  : "Critical";

  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 100);
    return () => clearTimeout(t);
  }, [score]);

  return (
    <div className="score-meter">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={radius} fill="none" stroke="var(--track)" strokeWidth="5"/>
        <circle cx="48" cy="48" r={radius} fill="none" stroke={color} strokeWidth="5"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          transform="rotate(-90 48 48)"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)" }}
        />
        <text x="48" y="44" textAnchor="middle" dominantBaseline="central"
          fill={color} fontSize="20" fontWeight="600" fontFamily="'DM Mono', monospace">
          {score}
        </text>
        <text x="48" y="62" textAnchor="middle"
          fill="var(--text-muted)" fontSize="10" fontFamily="'DM Sans', sans-serif">
          {label}
        </text>
      </svg>
      <span className="score-label">Quality score</span>
    </div>
  );
}
