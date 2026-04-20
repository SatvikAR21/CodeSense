import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/");
  }

  function initials(u) {
    if (!u) return "?";
    if (u.full_name) return u.full_name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2);
    return u.username.slice(0,2).toUpperCase();
  }

  const isActive = (p) => location.pathname === p;

  return (
    <header className="header">
      <div className="header-inner">
        <div style={{ display:"flex", alignItems:"center", gap:"24px" }}>
          <div className="logo" onClick={() => navigate("/")} style={{ cursor:"pointer" }}>
            <div className="logo-icon">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 4h12M3 8h8M3 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="14" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M13 12l.8.8 1.6-1.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="logo-text">CodeSense</span>
          </div>

          {user && (
            <nav className="nav">
              <button className={`nav-link ${isActive("/app") ? "nav-link--active" : ""}`}
                onClick={() => navigate("/app")}>Analyze</button>
              <button className={`nav-link ${isActive("/history") ? "nav-link--active" : ""}`}
                onClick={() => navigate("/history")}>History</button>
              <button className={`nav-link ${isActive("/profile") ? "nav-link--active" : ""}`}
                onClick={() => navigate("/profile")}>Profile</button>
            </nav>
          )}
        </div>

        <div className="nav">
          {user ? (
            <div className="user-menu-wrapper">
              <button className="user-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
                <div className="user-avatar">
                  {user.photo
                    ? <img src={user.photo} alt="" style={{width:"100%",height:"100%",borderRadius:"50%",objectFit:"cover"}}/>
                    : initials(user)
                  }
                </div>
                <span className="user-name">{user.username}</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                  style={{ transform: menuOpen ? "rotate(180deg)" : "none", transition:"transform 0.2s" }}>
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </button>

              {menuOpen && (
                <div className="user-dropdown">
                  <div className="dropdown-info">
                    <p className="dropdown-name">{user.full_name || user.username}</p>
                    <p className="dropdown-email">{user.email}</p>
                  </div>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item" onClick={() => { navigate("/profile"); setMenuOpen(false); }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="5" r="3" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M1 13c0-3 2.7-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                    My profile
                  </button>
                  <button className="dropdown-item" onClick={() => { navigate("/app"); setMenuOpen(false); }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                    New review
                  </button>
                  <button className="dropdown-item" onClick={() => { navigate("/history"); setMenuOpen(false); }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M1 7a6 6 0 1 0 1.5-3.9M1 3v4h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                    Review history
                  </button>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item dropdown-item--danger" onClick={handleLogout}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M5 2H2.5A1.5 1.5 0 0 0 1 3.5v7A1.5 1.5 0 0 0 2.5 12H5M9 10l3-3-3-3M13 7H5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button className="nav-link" onClick={() => navigate("/login")}>Sign in</button>
              <button className="nav-btn" onClick={() => navigate("/signup")}>Get started</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
