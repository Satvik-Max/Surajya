import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { getContract, getAccount, initWeb3, getWeb3 } from "../utils/web3";
import './CitizenDashboard.css';

const CitizenDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState("services");
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [web3Initialized, setWeb3Initialized] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  const initializeWeb3 = useCallback(async () => {
    try {
      await initWeb3();
      setWeb3Initialized(true);
      setNetworkError(false);
    } catch (error) {
      console.error("Failed to initialize Web3:", error);
      setNetworkError(true);
    }
  }, []);

  const fetchMyGrievances = useCallback(async () => {
    setLoading(true);
    setNetworkError(false);
    try {
      const { data, error } = await supabase
        .from("grievances")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      setGrievances(data || []);
    } catch (error) {
      console.error("Error fetching grievances:", error);
      if (error.message?.includes('Failed to fetch') || error.message?.includes('Network')) {
        setNetworkError(true);
      }
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    initializeWeb3();
    if (activeTab === "my-grievances") {
      fetchMyGrievances();
    }
  }, [activeTab, initializeWeb3, fetchMyGrievances]);

 const assignPriorityAndLevel = async (grievance) => {
  try {
    const { data: rules } = await supabase.from("priority_rules").select("*");

    let rule = rules.find(r => r.category === grievance.category);

    if (!rule) {
      const { data: newRule, error: insertError } = await supabase
        .from("priority_rules")
        .insert([{
          category: grievance.category,
          base_priority: 3,  
          keywords: []       
        }])
        .select()
        .single();

      if (insertError) throw insertError;
      rule = newRule;
      console.log(`✅ Added new category to priority_rules: ${grievance.category}`);
    }

    const priority = rule.base_priority;

    let level = grievance.assigned_level;
    let auto_escalated = false;

     if (priority >= 9) {
      level = 3; 
      auto_escalated = true;
    } else if (priority === 7 || priority === 8) {
      level = 2; 
    } else {
      level = 1; 
    }

    const { data, error } = await supabase
      .from("grievances")
      .update({
        priority,
        assigned_level: level,
        auto_escalated
      })
      .eq("id", grievance.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error assigning priority:", error);
    return grievance;
  }
};

  const handleGrievanceCreated = async (grievanceData) => {
    setNetworkError(false);
    try {
      if (!web3Initialized) {
        await initializeWeb3();
      }

      const contract = getContract();
      const account = getAccount();
      const web3Instance = getWeb3();
      
      if (!contract || !account || !web3Instance) {
        throw new Error("Web3 not initialized properly");
      }

      console.log("Creating grievance on blockchain...");
      const tx = await contract.methods
        .createGrievance(
          grievanceData.category,
          web3Instance.utils.keccak256(grievanceData.location || ""),
          web3Instance.utils.keccak256(grievanceData.description || "")
        )
        .send({ from: account });

      console.log("Blockchain transaction successful:", tx);

      const blockchainId = tx.events.GrievanceCreated.returnValues.id.toString();

      // Then store in Supabase
      console.log("Storing in Supabase...");
      const { data, error } = await supabase
        .from("grievances")
        .insert([{
          user_id: user.id,
          category: grievanceData.category,
          description: grievanceData.description,
          location: grievanceData.location,
          contact_number: grievanceData.contact_number,
          email: grievanceData.email,
          image_url: grievanceData.image_url,
          status: 'pending',
          assigned_level: 1,
          blockchain_id: blockchainId
        }])
        .select()
        .single();

      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
      }

      console.log("Supabase insert successful:", data);

      // 🔹 Immediately assign priority + auto-escalate if needed
      const updated = await assignPriorityAndLevel(data);

      setGrievances(prev => [updated, ...prev]);
      setActiveTab("my-grievances");
      
    } catch (error) {
      console.error("Error creating grievance:", error);
      if (error.message?.includes('Failed to fetch') || error.message?.includes('Network')) {
        setNetworkError(true);
        alert("Network error: Please check your internet connection and try again.");
      } else {
        alert("Failed to create grievance: " + (error.message || error));
      }
    }
  };

  if (networkError) {
    return (
      <div className="dashboard">
        <div className="error-message">
          <h2>Network Connection Error</h2>
          <p>Please check your internet connection and try again.</p>
          <button onClick={() => window.location.reload()} className="retry-btn">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Citizen Dashboard</h2>
        <p>Welcome, {user.name}</p>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={activeTab === "services" ? "active" : ""}
          onClick={() => setActiveTab("services")}
        >
          Services
        </button>
        <button 
          className={activeTab === "my-grievances" ? "active" : ""}
          onClick={() => setActiveTab("my-grievances")}
        >
          My Grievances
        </button>
        <button 
          className={activeTab === "new-grievance" ? "active" : ""}
          onClick={() => setActiveTab("new-grievance")}
        >
          File New Grievance
        </button>
      </div>
      
      <div className="dashboard-content">
        {activeTab === "my-grievances" && (
          <div className="card">
            <h3>My Grievances</h3>
            {loading ? (
              <div className="loading">Loading grievances...</div>
            ) : grievances.length === 0 ? (
              <div className="empty-state">
                <p>No grievances filed yet</p>
              </div>
            ) : (
              <div className="grievances-list">
                {grievances.map(grievance => (
                  <div key={grievance.id} className={`grievance-item ${grievance.status}`}>
                    <div className="grievance-header">
                      <h4>{grievance.category}</h4>
                      <span className={`status-badge ${grievance.status}`}>
                        {grievance.status}
                      </span>
                      {grievance.priority && (
                        <span className={`priority-badge ${grievance.priority >= 9 ? 'high' : grievance.priority >= 6 ? 'medium' : 'low'}`}>
                          Priority: {grievance.priority}
                        </span>
                      )}
                    </div>
                    <p className="grievance-description">{grievance.description}</p>
                    {grievance.location && (
                      <p className="grievance-location">📍 {grievance.location}</p>
                    )}
                    <div className="grievance-meta">
                      <span>ID: #{grievance.blockchain_id || grievance.id}</span>
                      <span>Level: {grievance.assigned_level}</span>
                      {grievance.auto_escalated && (
                        <span className="auto-escalated-badge">⚡ Auto-Escalated</span>
                      )}
                      <span>Filed: {new Date(grievance.created_at).toLocaleDateString()}</span>
                    </div>
                    {grievance.image_url && (
                      <div className="grievance-image">
                        <img src={grievance.image_url} alt="Grievance evidence" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "new-grievance" && (
          <div className="card">
            <h3>File New Grievance</h3>
            <CreateGrievanceForm onSubmit={handleGrievanceCreated} />
          </div>
        )}

        <div className="card">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            {grievances.slice(0, 3).map(activity => (
              <div key={activity.id} className="activity-item">
                <span className="activity-text">
                  Grievance #{activity.blockchain_id || activity.id} - {activity.status}
                </span>
                <span className="activity-date">
                  {new Date(activity.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
            {grievances.length === 0 && (
              <div className="empty-state">
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const CreateGrievanceForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    location: '',
    contact_number: '',
    email: '',
    image_url: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    'Water Supply',
    'Electricity',
    'Road Maintenance',
    'Sanitation',
    'Healthcare',
    'Education',
    'Other'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category || !formData.description || !formData.contact_number || !formData.email) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
      // Reset form after successful submission
      setFormData({
        category: '',
        description: '',
        location: '',
        contact_number: '',
        email: '',
        image_url: ''
      });
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grievance-form">
      <div className="form-group">
        <label>Category *</label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({...formData, category: e.target.value})}
          required
        >
          <option value="">Select Category</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Description *</label>
        <textarea
          placeholder="Describe your grievance in detail..."
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          rows="4"
          required
        />
      </div>

      <div className="form-group">
        <label>Contact Number *</label>
        <input
          type="tel"
          placeholder="Enter your contact number..."
          value={formData.contact_number}
          onChange={(e) => setFormData({...formData, contact_number: e.target.value})}
          required
        />
      </div>

      <div className="form-group">
        <label>Email *</label>
        <input
          type="email"
          placeholder="Enter your email address..."
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />
      </div>

      <div className="form-group">
        <label>Location</label>
        <input
          type="text"
          placeholder="Enter location details (street, area, landmark)..."
          value={formData.location}
          onChange={(e) => setFormData({...formData, location: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label>Image URL (Optional)</label>
        <input
          type="url"
          placeholder="Paste image URL here..."
          value={formData.image_url}
          onChange={(e) => setFormData({...formData, image_url: e.target.value})}
        />
        <small>Provide a direct link to an image that shows the issue</small>
      </div>

      {formData.image_url && (
        <div className="image-preview">
          <img src={formData.image_url} alt="Preview" style={{maxWidth: '200px', maxHeight: '200px'}} />
          <small>Image Preview</small>
        </div>
      )}

      <button 
        type="submit" 
        className="submit-btn"
        disabled={submitting}
      >
        {submitting ? 'Submitting...' : 'Submit Grievance'}
      </button>
    </form>
  );
};

export default CitizenDashboard;