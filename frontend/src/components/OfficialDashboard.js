// components/OfficialDashboard.js
import React, { useState, useEffect, useCallback } from "react";
import supabase from "../lib/supabase";
import { getContract, getAccount, initWeb3 } from "../utils/web3";
import './OfficialDashboard.css';

const OfficialDashboard = ({ level, user }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ pending: 0, resolved: 0, total: 0 });
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const fetchGrievances = useCallback(async () => {
  setLoading(true);
  try {
    let query = supabase
      .from("grievances")
      .select("*")
      .order("created_at", { ascending: false });

    if (activeTab === "pending") {
      query = query.eq("status", "pending");
    } else if (activeTab === "resolved") {
      query = query.eq("status", "resolved");
    }

    // Filter by current official's level - ONLY SHOW GRIEVANCES ASSIGNED TO THIS LEVEL
    query = query.eq("assigned_level", level);

    const { data, error } = await query;

    if (error) throw error;
    setGrievances(data || []);
  } catch (error) {
    console.error("Error fetching grievances:", error);
  } finally {
    setLoading(false);
  }
}, [activeTab, level]); // Added level to dependencies

  const fetchStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("grievances")
        .select("status");

      if (error) throw error;

      const stats = {
        pending: data.filter(g => g.status === 'pending').length,
        resolved: data.filter(g => g.status === 'resolved').length,
        total: data.length
      };

      setStats(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, []);

  useEffect(() => {
    fetchGrievances();
    fetchStats();
  }, [activeTab, fetchGrievances, fetchStats]);

  const contactCitizen = (grievance) => {
    if (grievance.contact_number) {
      window.open(`tel:${grievance.contact_number}`, '_blank');
    } else {
      alert("Contact number not available for this grievance.");
    }
  };

  const sendSMS = (grievance) => {
    if (grievance.contact_number) {
      window.open(`sms:${grievance.contact_number}`, '_blank');
    } else {
      alert("Contact number not available for this grievance.");
    }
  };

   const sendEmailOTP = async (grievance) => {
  try {
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP in DB
    const { error } = await supabase
      .from("grievances")
      .update({
        verification_otp: generatedOtp,
        otp_expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      })
      .eq("id", grievance.id);

    if (error) throw error;

    // Call your NodeMailer server (now with grievanceId)
    const response = await fetch("http://localhost:3001/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: grievance.email,
        otp: generatedOtp,
        grievanceId: grievance.id
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || "Failed to send OTP email");
    }

    alert(`✅ OTP sent successfully to ${grievance.email}`);
    setSelectedGrievance(grievance);
    setOtpSent(true);
    console.log(otpSent)
  } catch (error) {
    console.error("Error sending OTP:", error);
    alert("❌ Failed to send OTP. Please try again.");
  }
};

  const verifyOTPAndResolve = async () => {
  if (!selectedGrievance || !otp) {
    alert("Please enter the OTP");
    return;
  }

  setVerifying(true);
  try {
    // Verify OTP from database
    const { data: grievanceData, error: fetchError } = await supabase
      .from("grievances")
      .select("verification_otp, otp_expires_at, blockchain_id")
      .eq("id", selectedGrievance.id)
      .single();

    if (fetchError) throw fetchError;

    // Check if OTP is valid and not expired
    if (grievanceData.verification_otp !== otp) {
      alert("Invalid OTP. Please try again.");
      return;
    }

    if (new Date(grievanceData.otp_expires_at) < new Date()) {
      alert("OTP has expired. Please send a new one.");
      return;
    }

    console.log("Initializing Web3...");
    await initWeb3();
    const contract = getContract();
    const account = getAccount();

    console.log("Contract:", contract);
    console.log("Account:", account);
    console.log("Blockchain ID:", grievanceData.blockchain_id);

    // Check if contract methods are available
    if (!contract.methods.resolveGrievance) {
      throw new Error("resolveGrievance method not found on contract");
    }

    // Resolve on blockchain with better error handling
    console.log("Sending blockchain transaction...");
    const tx = await contract.methods
      .resolveGrievance(grievanceData.blockchain_id)
      .send({ 
        from: account,
        gas: 300000 // Add sufficient gas limit
      });

    console.log("Transaction successful:", tx);

    // Update status in database
    const { error: updateError } = await supabase
      .from("grievances")
      .update({ 
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolved_by: user.id,
        verification_otp: null,
        otp_expires_at: null
      })
      .eq("id", selectedGrievance.id);

    if (updateError) throw updateError;

    alert("Grievance resolved successfully!");
    
    // Reset state and refresh data
    setOtp('');
    setOtpSent(false);
    setSelectedGrievance(null);
    setVerifying(false);
    
    fetchGrievances();
    fetchStats();

  } catch (error) {
    console.error("Error verifying OTP:", error);
    
    // More specific error messages
    if (error.message.includes('revert')) {
      alert("Transaction failed: The grievance might not exist or is already resolved on blockchain.");
    } else if (error.message.includes('gas')) {
      alert("Transaction failed: Insufficient gas. Please try again.");
    } else {
      alert("Failed to verify OTP: " + (error.message || error));
    }
  } finally {
    setVerifying(false);
  }
};

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Official Dashboard - Level {level}</h2>
        <p>Government Grievance Management System</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Grievances</h3>
          <div className="stat-number">{stats.total}</div>
        </div>
        <div className="stat-card pending">
          <h3>Pending</h3>
          <div className="stat-number">{stats.pending}</div>
        </div>
        <div className="stat-card resolved">
          <h3>Resolved</h3>
          <div className="stat-number">{stats.resolved}</div>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={activeTab === "overview" ? "active" : ""}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button 
          className={activeTab === "pending" ? "active" : ""}
          onClick={() => setActiveTab("pending")}
        >
          Pending ({stats.pending})
        </button>
        <button 
          className={activeTab === "resolved" ? "active" : ""}
          onClick={() => setActiveTab("resolved")}
        >
          Resolved ({stats.resolved})
        </button>
      </div>
      
      <div className="dashboard-content">
        {/* OTP Verification Modal */}
        {selectedGrievance && (
          <div className="otp-modal">
            <div className="otp-modal-content">
              <h3>Verify OTP for Resolution</h3>
              <p>An OTP has been sent to the citizen's email: {selectedGrievance.email}</p>
              
              <div className="otp-input-group">
                <label>Enter OTP:</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  maxLength="6"
                />
              </div>
              
              <div className="otp-actions">
                <button 
                  onClick={verifyOTPAndResolve}
                  disabled={verifying || otp.length !== 6}
                  className="verify-btn"
                >
                  {verifying ? 'Verifying...' : 'Verify & Resolve'}
                </button>
                <button 
                  onClick={() => {
                    setSelectedGrievance(null);
                    setOtp('');
                    setOtpSent(false);
                  }}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {(activeTab === "overview" || activeTab === "pending" || activeTab === "resolved") && (
          <div className="card">
            <h3>{activeTab === "pending" ? "Pending" : activeTab === "resolved" ? "Resolved" : "All"} Grievances</h3>
            {loading ? (
              <div className="loading">Loading grievances...</div>
            ) : grievances.length === 0 ? (
              <div className="empty-state">
                <p>No grievances found</p>
              </div>
            ) : (
              <div className="grievances-list">
                {grievances.map(grievance => (
                  <div key={grievance.id} className={`grievance-item ${grievance.status}`}>
                    <div className="grievance-header">
                      <h4>{grievance.category}</h4>
                      <div className="grievance-status">
                        <span className={`status-badge ${grievance.status}`}>
                          {grievance.status}
                        </span>
                        <span className="level-badge">Level {grievance.assigned_level}</span>
                      </div>
                    </div>
                    
                    <p className="grievance-description">{grievance.description}</p>
                    
                    <div className="grievance-details">
                      {grievance.location && (
                        <div className="detail-row">
                          <strong>Location:</strong> {grievance.location}
                        </div>
                      )}
                      
                      {grievance.contact_number && (
                        <div className="detail-row">
                          <strong>Contact:</strong> {grievance.contact_number}
                        </div>
                      )}
                      
                      {grievance.email && (
                        <div className="detail-row">
                          <strong>Email:</strong> {grievance.email}
                        </div>
                      )}
                      
                      <div className="detail-row">
                        <strong>Grievance ID:</strong> #{grievance.blockchain_id || grievance.id}
                      </div>
                      
                      <div className="detail-row">
                        <strong>Filed On:</strong> {new Date(grievance.created_at).toLocaleDateString()}
                      </div>
                      
                      {grievance.resolved_at && (
                        <div className="detail-row">
                          <strong>Resolved On:</strong> {new Date(grievance.resolved_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    {grievance.image_url && (
                      <div className="grievance-image">
                        <img src={grievance.image_url} alt="Grievance evidence" />
                      </div>
                    )}

                    <div className="grievance-actions">
                      {grievance.contact_number && (
                        <>
                          <button 
                            className="action-btn contact"
                            onClick={() => contactCitizen(grievance)}
                            title="Call citizen"
                          >
                            📞 Call Citizen
                          </button>
                          <button 
                            className="action-btn sms"
                            onClick={() => sendSMS(grievance)}
                            title="Send SMS"
                          >
                            💬 Send SMS
                          </button>
                        </>
                      )}
                      
                      {grievance.status === 'pending' && grievance.email && (
                        <button 
                          className="action-btn resolve"
                          onClick={() => sendEmailOTP(grievance)}
                          title="Resolve with OTP verification"
                        >
                            ✅ Mark as Resolved
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="card">
          <h3>Quick Actions</h3>
          <div className="quick-actions">
            <button 
              className="action-btn primary"
              onClick={() => setActiveTab("pending")}
            >
              Review Pending Grievances
            </button>
            <button className="action-btn">
              Generate Report
            </button>
            <button className="action-btn">
              View Statistics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfficialDashboard;