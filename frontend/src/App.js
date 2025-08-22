// App.js
import React, { useState, useEffect } from "react";
import Login from "./pages/Login";
import CitizenDashboard from "./components/CitizenDashboard";
import OfficialDashboard from "./components/OfficialDashboard";
import EmailVerification from "./components/EmailVerification";
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [authState, setAuthState] = useState("login");
  const [authEmail, setAuthEmail] = useState("");

  // Load session on app start
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedEmail = localStorage.getItem("auth_email");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setAuthState("dashboard");
    }
    if (storedEmail) {
      setAuthEmail(storedEmail);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("auth_email");
    setUser(null);
    setAuthEmail("");
    setAuthState("login");
  };

  const handleEmailSent = (email) => {
    localStorage.setItem("auth_email", email);
    setAuthEmail(email);
    setAuthState("verify");
  };

  const handleLoginSuccess = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    setAuthState("dashboard");
    localStorage.removeItem("auth_email");
    setAuthEmail("");
  };

  const handleBackToLogin = () => {
    setAuthState("login");
    localStorage.removeItem("auth_email");
    setAuthEmail("");
  };

  return (
    <div className="app-container">
      {authState !== "login" && (
        <header className="app-header">
          <div className="header-content">
            <h1>Government Portal</h1>
            <div className="header-actions">
              {authState === "dashboard" && user && (
                <div className="user-info">
                  <span>Welcome, {user.name}</span>
                  <button onClick={handleLogout} className="logout-btn">
                    Logout
                  </button>
                </div>
              )}
              {authState === "verify" && (
                <button onClick={handleBackToLogin} className="back-btn">
                  Back to Login
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      <main className="main-content">
        {authState === "login" && <Login onEmailSent={handleEmailSent} />}
        {authState === "verify" && (
          <EmailVerification
            email={authEmail}
            onLogin={handleLoginSuccess}
            onBack={handleBackToLogin}
          />
        )}
        {authState === "dashboard" && user && (
          <>
            {user.user_type === "citizen" && (
              <CitizenDashboard user={user} />
            )}
            {user.user_type === "official" && (
              <OfficialDashboard level={user.user_level} user={user} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
