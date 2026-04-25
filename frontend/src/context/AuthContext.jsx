import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // sessionStorage clears automatically when tab/browser is closed
    // So every new tab or shared link starts completely fresh
    const savedToken = sessionStorage.getItem("reviewai_token");
    const savedUser  = sessionStorage.getItem("reviewai_user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  function login(tokenValue, userData) {
    setToken(tokenValue);
    setUser(userData);
    sessionStorage.setItem("reviewai_token", tokenValue);
    sessionStorage.setItem("reviewai_user", JSON.stringify(userData));
  }

  function logout() {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem("reviewai_token");
    sessionStorage.removeItem("reviewai_user");
  }

  async function authFetch(url, options = {}) {
    const base = import.meta.env.VITE_API_URL || "";
    return fetch(`${base}${url}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, authFetch, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}