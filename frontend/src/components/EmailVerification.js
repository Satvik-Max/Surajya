// EmailVerification.js
import React, { useEffect, useState } from "react";
import supabase from "../lib/supabase";
import './EmailVerification.css';

const EmailVerification = ({ email, onLogin, onBack }) => {
  const [countdown, setCountdown] = useState(30);
  const [resendEnabled, setResendEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          try {
            console.log("User signed in:", session.user);
            
            // Get or create user profile from PROFILES table
            let { data: profile, error: fetchError } = await supabase
              .from('profiles')
              .select('*')
              .eq('email', session.user.email)
              .single();

            if (fetchError) {
              console.log("No existing profile found, creating new one...");
              
              // Create new profile with citizen role
              const { data: newProfile, error: insertError } = await supabase
                .from('profiles')
                .insert([{ 
                  id: session.user.id,
                  name: session.user.email.split('@')[0], 
                  email: session.user.email, 
                  user_type: "citizen", 
                  user_level: 0 
                }])
                .select()
                .single();
              
              if (insertError) {
                console.error("Error creating profile:", insertError);
                setMessage("Error creating user profile: " + insertError.message);
                return;
              }
              profile = newProfile;
              console.log("New profile created:", profile);
            } else {
              console.log("Existing profile found:", profile);
            }

            // Save to localStorage and notify parent
            localStorage.setItem("user", JSON.stringify(profile));
            onLogin(profile);
            
          } catch (err) {
            console.error("Error during authentication:", err);
            setMessage("Error during authentication: " + err.message);
          }
        }
      }
    );

    // Set up countdown for resend button
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setResendEnabled(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(timer);
    };
  }, [email, onLogin]);

  const handleResend = async () => {
    setLoading(true);
    setMessage("");
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      setCountdown(30);
      setResendEnabled(false);
      setMessage("New magic link sent! Check your email.");
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verification-container">
      <div className="verification-card">
        <div className="verification-header">
          <h2>Check Your Email</h2>
          <p>We sent a magic link to <strong>{email}</strong></p>
        </div>
        
        <div className="verification-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
            <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
          </svg>
        </div>
        
        <div className="verification-instructions">
          <p>Click the link in the email to securely access your account.</p>
          <p>The link will expire shortly for security reasons.</p>
          <p>You can close this window and return later to complete login.</p>
        </div>
        
        {message && (
          <div className={`verification-message ${message.includes('Error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}
        
        <div className="verification-actions">
          <button 
            onClick={handleResend} 
            disabled={!resendEnabled || loading}
            className="resend-button"
          >
            {loading ? 'Sending...' : `Resend Email ${countdown > 0 ? `(${countdown})` : ''}`}
          </button>
          
          <button onClick={onBack} className="back-button">
            Use Different Email
          </button>
        </div>

        <div className="verification-help">
          <p>Didn't receive the email?</p>
          <ul>
            <li>Check your spam folder</li>
            <li>Make sure you entered the correct email address</li>
            <li>Wait a few minutes and try again</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;