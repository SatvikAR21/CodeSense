import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const STATS = [
  { value: "12,400+", label: "PRs Analyzed" },
  { value: "38,000+", label: "Bugs Caught" },
  { value: "2,100+",  label: "Developers" },
  { value: "99.2%",   label: "Accuracy Rate" },
];

const FEATURES = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "Deep Code Analysis",
    desc: "Powered by CodeLlama 13B, CodeSense reads your PR diff line by line — finding real bugs, not surface-level linting errors.",
    color: "teal",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "Security Scanning",
    desc: "Detects SQL injection, hardcoded secrets, insecure auth patterns, and exposed stack traces before they reach production.",
    color: "coral",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "PDF Audit Reports",
    desc: "Generate professional-grade PDF reports for every review. Share with your team or attach to sprint documentation.",
    color: "violet",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "Review Analytics",
    desc: "Track your code quality trends month-over-month. See exactly where your team is improving and where attention is needed.",
    color: "amber",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "Instant Results",
    desc: "No waiting in queues. CodeSense runs analysis locally on your machine via Ollama — private, fast, and completely free.",
    color: "blue",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "Per-User History",
    desc: "Every review is saved to your account. Revisit past analyses, track PR quality over time, and build a review audit trail.",
    color: "green",
  },
];

const STEPS = [
  { num: "01", title: "Paste your PR link", desc: "Drop any GitHub pull request URL into CodeSense. Public or private repos both work." },
  { num: "02", title: "AI analyzes the diff", desc: "CodeLlama reads every changed line. Bugs, security holes, complexity issues — nothing slips through." },
  { num: "03", title: "Get your report", desc: "Receive a structured review with severity scores, fix suggestions, and a downloadable PDF audit report." },
];

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [heroRef, heroIn] = useInView(0.1);
  const [featRef, featIn] = useInView(0.1);
  const [stepsRef, stepsIn] = useInView(0.1);
  const [statsRef, statsIn] = useInView(0.1);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="landing">

      {/* ── NAV ── */}
      <nav className={`land-nav ${scrolled ? "land-nav--scrolled" : ""}`}>
        <div className="land-nav-inner">
          <div className="land-logo">
            <div className="land-logo-icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 3h12M2 7h8M2 11h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                <circle cx="13" cy="11" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M12.2 11l.6.6 1.2-1.2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="land-logo-text">CodeSense</span>
          </div>

          <div className="land-nav-links">
            <a href="#features" className="land-nav-a">Features</a>
            <a href="#how" className="land-nav-a">How it works</a>
            <a href="#about" className="land-nav-a">About</a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="land-nav-a">GitHub</a>
          </div>

          <div className="land-nav-cta">
            {user ? (
              <>
                <button className="land-btn-ghost" onClick={() => navigate("/app")}>Dashboard</button>
                <button className="land-btn-primary" onClick={() => navigate("/profile")}>My profile</button>
              </>
            ) : (
              <>
                <button className="land-btn-ghost" onClick={() => navigate("/login")}>Sign in</button>
                <button className="land-btn-primary" onClick={() => navigate("/signup")}>Get started free</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="land-hero" ref={heroRef}>
        <div className="hero-bg-grid" />
        <div className="hero-bg-glow hero-bg-glow--1" />
        <div className="hero-bg-glow hero-bg-glow--2" />

        <div className={`land-hero-content ${heroIn ? "reveal" : ""}`}>
          <div className="hero-eyebrow">
            <span className="hero-eyebrow-dot" />
            Powered by CodeLlama 13B · Runs locally · Free
          </div>

          <h1 className="hero-h1">
            Your AI-powered<br />
            <span className="hero-gradient">code review</span><br />
            co-pilot
          </h1>

          <p className="hero-p">
            Paste a GitHub PR. Get instant, line-level analysis of bugs,
            security vulnerabilities, complexity issues, and style violations —
            with professional PDF audit reports.
          </p>

          <div className="hero-actions">
            <button className="hero-cta-primary" onClick={() => navigate(user ? "/app" : "/signup")}>
              Start reviewing for free
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="hero-cta-ghost" onClick={() => document.getElementById("how").scrollIntoView({ behavior: "smooth" })}>
              See how it works
            </button>
          </div>

          <div className="hero-social-proof">
            <div className="hero-avatars">
              {["S","M","R","A","K"].map((l,i) => (
                <div key={i} className="hero-av" style={{ zIndex: 5-i, marginLeft: i === 0 ? 0 : "-10px" }}>{l}</div>
              ))}
            </div>
            <span>Trusted by <strong>2,100+</strong> developers worldwide</span>
          </div>
        </div>

        {/* Code preview card */}
        <div className={`hero-code-card ${heroIn ? "reveal-right" : ""}`}>
          <div className="code-card-header">
            <div className="code-card-dots">
              <span style={{background:"#f87171"}}/>
              <span style={{background:"#fbbf24"}}/>
              <span style={{background:"#34d399"}}/>
            </div>
            <span className="code-card-title">auth.js — PR #42</span>
            <div className="code-card-score">
              <span style={{color:"#f59e0b", fontWeight:600}}>61</span>
              <span style={{color:"var(--cs-muted)", fontSize:"11px"}}>/ 100</span>
            </div>
          </div>
          <div className="code-card-body">
            <CodeLine num={12} type="danger" text='const SECRET = "mysecret123"' />
            <CodeLine num={13} type="normal" text="const token = jwt.sign(" />
            <CodeLine num={14} type="normal" text="  { userId: user.id }," />
            <CodeLine num={15} type="normal" text="  SECRET" />
            <CodeLine num={16} type="normal" text=");" />
          </div>
          <div className="code-card-issues">
            <Issue color="#f87171" label="HIGH" text="Hardcoded JWT secret in source" />
            <Issue color="#fbbf24" label="MED"  text="Missing token expiry option" />
            <Issue color="#34d399" label="FIX"  text='Use process.env.JWT_SECRET' />
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="land-stats" ref={statsRef}>
        {STATS.map((s, i) => (
          <div key={i} className={`land-stat ${statsIn ? "reveal" : ""}`}
            style={{ animationDelay: `${i * 0.1}s` }}>
            <span className="land-stat-val">{s.value}</span>
            <span className="land-stat-label">{s.label}</span>
          </div>
        ))}
      </section>

      {/* ── FEATURES ── */}
      <section className="land-section" id="features" ref={featRef}>
        <div className="land-section-head">
          <p className="land-label">Features</p>
          <h2 className="land-h2">Everything your code review<br />workflow needs</h2>
          <p className="land-sub">No more missed bugs in code review. CodeSense gives every PR the attention it deserves.</p>
        </div>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className={`feat-card feat-card--${f.color} ${featIn ? "reveal" : ""}`}
              style={{ animationDelay: `${i * 0.08}s` }}>
              <div className={`feat-icon feat-icon--${f.color}`}>{f.icon}</div>
              <h3 className="feat-title">{f.title}</h3>
              <p className="feat-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="land-section land-section--alt" id="how" ref={stepsRef}>
        <div className="land-section-head">
          <p className="land-label">How it works</p>
          <h2 className="land-h2">From PR link to full audit<br />in under 60 seconds</h2>
        </div>
        <div className="steps-row">
          {STEPS.map((s, i) => (
            <div key={i} className={`step-card ${stepsIn ? "reveal" : ""}`}
              style={{ animationDelay: `${i * 0.15}s` }}>
              <div className="step-num">{s.num}</div>
              <h3 className="step-title">{s.title}</h3>
              <p className="step-desc">{s.desc}</p>
              {i < STEPS.length - 1 && <div className="step-arrow">→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section className="land-section" id="about">
        <div className="about-inner">
          <div className="about-text">
            <p className="land-label">About</p>
            <h2 className="land-h2" style={{textAlign:"left"}}>Built for developers<br />who care about quality</h2>
            <p className="land-sub" style={{textAlign:"left", maxWidth:"420px"}}>
              CodeSense was built as a full-stack AI project combining React, FastAPI,
              MongoDB, and CodeLlama 13B. It runs entirely on your local machine —
              your code never leaves your environment.
            </p>
            <div className="about-tags">
              {["React","FastAPI","MongoDB","CodeLlama 13B","Ollama","GitHub API"].map(t => (
                <span key={t} className="about-tag">{t}</span>
              ))}
            </div>
            <button className="hero-cta-primary" style={{marginTop:"28px"}}
              onClick={() => navigate(user ? "/app" : "/signup")}>
              Try CodeSense free
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <div className="about-card-stack">
            <div className="about-card about-card--back" />
            <div className="about-card about-card--mid" />
            <div className="about-card about-card--front">
              <div className="acard-row">
                <span className="acard-label">Total reviews</span>
                <span className="acard-val" style={{color:"#818cf8"}}>12,400</span>
              </div>
              <div className="acard-bar-wrap">
                {[65,80,45,90,70,85,60].map((h,i) => (
                  <div key={i} className="acard-bar" style={{height:`${h}%`}} />
                ))}
              </div>
              <div className="acard-row" style={{marginTop:"12px"}}>
                <span className="acard-label">Avg quality score</span>
                <span className="acard-val" style={{color:"#34d399"}}>74 / 100</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="land-cta-banner">
        <div className="cta-banner-glow" />
        <h2 className="cta-banner-h">Ready to write better code?</h2>
        <p className="cta-banner-p">Join 2,100+ developers using CodeSense to ship higher-quality PRs.</p>
        <button className="hero-cta-primary" onClick={() => navigate(user ? "/app" : "/signup")}>
          Get started — it's free
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </section>

      {/* ── FOOTER ── */}
      <footer className="land-footer">
        <div className="land-footer-inner">
          <div className="land-logo">
            <div className="land-logo-icon">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M2 3h12M2 7h8M2 11h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                <circle cx="13" cy="11" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
              </svg>
            </div>
            <span className="land-logo-text">CodeSense</span>
          </div>
          <p className="footer-copy">© 2025 CodeSense. Built with React, FastAPI & CodeLlama 13B.</p>
          <div className="footer-links">
            <a href="#features" className="land-nav-a">Features</a>
            <a href="#how" className="land-nav-a">How it works</a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="land-nav-a">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function CodeLine({ num, type, text }) {
  return (
    <div className={`code-line ${type === "danger" ? "code-line--danger" : ""}`}>
      <span className="code-ln">{num}</span>
      <span className="code-text">{text}</span>
      {type === "danger" && <span className="code-flag">!</span>}
    </div>
  );
}

function Issue({ color, label, text }) {
  return (
    <div className="code-issue">
      <span className="code-issue-badge" style={{ color, borderColor: `${color}44`, background: `${color}14` }}>{label}</span>
      <span className="code-issue-text">{text}</span>
    </div>
  );
}
