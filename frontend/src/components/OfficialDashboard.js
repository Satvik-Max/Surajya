// components/OfficialDashboard.js
import React from "react";

const OfficialDashboard = ({ level, user }) => {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Official Dashboard - Level {level}</h2>
        <p>Government administration portal</p>
      </div>
      
      <div className="dashboard-content">
        <div className="card">
          <h3>Administrative Tools</h3>
          <div className="tool-grid">
            <div className="tool-item">
              <h4>Case Management</h4>
              <p>Review and process citizen requests</p>
              <button className="action-btn">Access</button>
            </div>
            
            <div className="tool-item">
              <h4>Document Verification</h4>
              <p>Verify submitted documents and applications</p>
              <button className="action-btn">Verify</button>
            </div>
            
            <div className="tool-item">
              <h4>Analytics Dashboard</h4>
              <p>View service metrics and statistics</p>
              <button className="action-btn">View Reports</button>
            </div>
            
            {level === 2 && (
              <div className="tool-item">
                <h4>Administrator Settings</h4>
                <p>System configuration and user management</p>
                <button className="action-btn">Configure</button>
              </div>
            )}
          </div>
        </div>
        
        <div className="card">
          <h3>Pending Actions</h3>
          <div className="pending-actions">
            <div className="pending-item">
              <span>5 document reviews pending</span>
              <button className="action-btn">Review</button>
            </div>
            <div className="pending-item">
              <span>3 applications need approval</span>
              <button className="action-btn">Approve</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfficialDashboard;