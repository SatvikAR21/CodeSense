import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Header from "./components/Header";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import History from "./pages/History";
import ReviewDetail from "./pages/ReviewDetail";
import Profile from "./pages/Profile";
import "./index.css";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
      height:"100vh", gap:"12px", color:"var(--cs-muted)", fontSize:"14px" }}>
      <div className="spinner-ring" style={{ position:"relative",
        width:"20px", height:"20px", flexShrink:0 }} />
      Loading...
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/app" replace />;
}

function AppLayout() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public landing page — no header */}
      <Route path="/" element={<Landing />} />

      {/* Auth pages — no header */}
      <Route path="/login"  element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />

      {/* App pages — with header */}
      <Route path="/app" element={
        <ProtectedRoute>
          <Header />
          <Home />
        </ProtectedRoute>
      } />
      <Route path="/history" element={
        <ProtectedRoute>
          <Header />
          <History />
        </ProtectedRoute>
      } />
      <Route path="/review/:id" element={
        <ProtectedRoute>
          <Header />
          <ReviewDetail />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Header />
          <Profile />
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to={user ? "/app" : "/"} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app">
          <AppLayout />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
