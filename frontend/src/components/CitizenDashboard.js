import React from "react";

const CitizenDashboard = ({ user }) => {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Citizen Dashboard</h2>
        <p>Welcome to government services portal</p>
      </div>
      
      <div className="dashboard-content">
        <div className="card">
          <h3>Available Services</h3>
          <div className="service-list">
            <div className="service-item">
              <h4>Document Requests</h4>
              <p>Request official documents and certificates</p>
              <button className="action-btn">Access</button>
            </div>
            
            <div className="service-item">
              <h4>Service Applications</h4>
              <p>Apply for government services and programs</p>
              <button className="action-btn">Apply</button>
            </div>
            
            <div className="service-item">
              <h4>Payment Center</h4>
              <p>Pay fees and taxes online</p>
              <button className="action-btn">Pay Now</button>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h3>Recent Activity</h3>
          <p className="empty-state">No recent activity</p>
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;