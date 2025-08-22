// Login.js
import React, { useState } from "react";
import supabase from "../lib/supabase";
import './Login.css';

export default function Login({ onEmailSent }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleMagicLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      const { data, error: signInError } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: window.location.origin,
          shouldCreateUser: true // Ensure user is created if doesn't exist
        },
      });

      if (signInError) {
        console.error("Sign in error:", signInError);
        throw new Error(signInError.message || "Failed to send magic link");
      }

      if (data) {
        setSuccess("Check your email for the login link!");
        onEmailSent(email);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Government Services Portal</h1>
          <p>Sign in with Magic Link</p>
        </div>
        
        <form onSubmit={handleMagicLink} className="login-form">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Magic Link"}
          </button>
        </form>
        
        <div className="login-footer">
          <p>You'll receive a secure login link in your email</p>
          {error && (
            <p className="help-text">
              If the problem persists, check your Supabase Auth configuration.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}