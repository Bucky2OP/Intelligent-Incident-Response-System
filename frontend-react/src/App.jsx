import React, { useState, useEffect } from "react";

function App() {
  const [message, setMessage] = useState("");
  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  });
  const [filter, setFilter] = useState("all");
  const [lastAction, setLastAction] = useState(null);
  const [error, setError] = useState(null);

  const BACKEND_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:8080"
    : "http://incidents-backend:8080";


  const getSeverityIcon = (severity) => {
    switch (severity?.toLowerCase()) {
      case "critical": return "🚨";
      case "high": return "⚠️";
      case "medium": return "ℹ️";
      default: return "✅";
    }
  };

  const calculateStats = (incidentList) => {
    const stats = {
      total: incidentList.length,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    incidentList.forEach(incident => {
      const severity = incident.severity?.toLowerCase();
      if (stats[severity] !== undefined) {
        stats[severity]++;
      }
    });

    setStats(stats);
  };

  const sendIncident = async () => {
    if (!message.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${BACKEND_URL}/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setLastAction(data);
      setMessage("");
      
      setTimeout(() => setLastAction(null), 5000);
      
      await loadIncidents();
    } catch (error) {
      console.error("Error submitting incident:", error);
      setError("Failed to submit incident. Make sure backend is running on port 8080");
    } finally {
      setIsLoading(false);
    }
  };

  const loadIncidents = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/incidents`);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      setIncidents(data || []);
      calculateStats(data || []);
      setError(null);
    } catch (error) {
      console.error("Error loading incidents:", error);
      setError("Cannot connect to backend. Make sure it's running on port 8080");
    }
  };

  useEffect(() => {
    loadIncidents();
    const interval = setInterval(loadIncidents, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredIncidents = filter === "all" 
    ? incidents 
    : incidents.filter(i => i.severity?.toLowerCase() === filter);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendIncident();
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(to bottom right, #0f172a, #1e3a8a, #0f172a)',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(30, 41, 59, 0.9)',
        padding: '24px',
        borderRadius: '12px',
        marginBottom: '24px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
      }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
          ⚡ Intelligent Incident Response System
        </h1>
        <p style={{ color: '#93c5fd', fontSize: '14px', margin: 0 }}>
          AI-Powered Classification & Auto-Response Engine
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.2)',
          border: '2px solid #ef4444',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px',
          color: '#fca5a5'
        }}>
          ❌ {error}
        </div>
      )}

      {/* Stats Dashboard */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <StatCard label="Total" value={stats.total} icon="📊" color="#60a5fa" />
        <StatCard label="Critical" value={stats.critical} icon="🚨" color="#ef4444" />
        <StatCard label="High" value={stats.high} icon="⚠️" color="#f97316" />
        <StatCard label="Medium" value={stats.medium} icon="ℹ️" color="#eab308" />
        <StatCard label="Low" value={stats.low} icon="✅" color="#22c55e" />
      </div>

      {/* Action Notification */}
      {lastAction && (
        <div style={{
          marginBottom: '24px',
          background: 'rgba(30, 58, 138, 0.4)',
          border: '2px solid #3b82f6',
          padding: '16px',
          borderRadius: '8px'
        }}>
          <p style={{ fontWeight: '600', color: '#93c5fd', margin: '0 0 8px 0' }}>
            📈 Incident Processed
          </p>
          <p style={{ fontSize: '14px', color: '#cbd5e1', margin: '0 0 8px 0' }}>
            Category: <strong>{lastAction.category}</strong> | 
            Severity: <strong>{lastAction.severity?.toUpperCase()}</strong>
          </p>
          <p style={{ color: '#60a5fa', fontWeight: '500', margin: 0 }}>
            {lastAction.action}
          </p>
        </div>
      )}

      {/* Input Section */}
      <div style={{
        background: 'rgba(30, 41, 59, 0.7)',
        padding: '24px',
        borderRadius: '12px',
        marginBottom: '24px'
      }}>
        <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>
          🔔 Report New Incident
        </h2>
        
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <input
            style={{
              flex: 1,
              background: '#334155',
              color: 'white',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '2px solid #475569',
              fontSize: '14px'
            }}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe the incident..."
            disabled={isLoading}
          />
          <button 
            onClick={sendIncident}
            disabled={isLoading || !message.trim()}
            style={{
              background: isLoading || !message.trim() ? '#475569' : '#2563eb',
              color: 'white',
              padding: '12px 32px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: '600',
              cursor: isLoading || !message.trim() ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            {isLoading ? '⏳ Processing...' : '⚡ Submit'}
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: '#94a3b8', marginRight: '8px' }}>Quick:</span>
          {["database timeout failure", "SSL certificate expired", "disk space almost full"].map(example => (
            <button
              key={example}
              onClick={() => setMessage(example)}
              style={{
                fontSize: '12px',
                background: '#334155',
                color: '#cbd5e1',
                padding: '6px 12px',
                borderRadius: '16px',
                border: '1px solid #475569',
                cursor: 'pointer'
              }}
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {["all", "critical", "high", "medium", "low"].map(severity => (
          <button
            key={severity}
            onClick={() => setFilter(severity)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: '500',
              border: 'none',
              cursor: 'pointer',
              background: filter === severity ? '#2563eb' : 'rgba(30, 41, 59, 0.7)',
              color: 'white'
            }}
          >
            {severity.charAt(0).toUpperCase() + severity.slice(1)}
            {severity !== "all" && ` (${stats[severity] || 0})`}
          </button>
        ))}
        <button
          onClick={loadIncidents}
          style={{
            marginLeft: 'auto',
            padding: '8px 16px',
            background: 'rgba(30, 41, 59, 0.7)',
            color: 'white',
            borderRadius: '8px',
            border: '1px solid #475569',
            cursor: 'pointer'
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Incidents List */}
      <div style={{
        background: 'rgba(30, 41, 59, 0.7)',
        padding: '24px',
        borderRadius: '12px'
      }}>
        <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>📋 Recent Incidents</h2>
        
        {filteredIncidents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
            <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>📁</p>
            <p>No incidents found</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredIncidents.map((incident) => (
              <div
                key={incident.id}
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  background: 'rgba(51, 65, 85, 0.5)',
                  borderLeft: `4px solid ${
                    incident.severity === 'critical' ? '#ef4444' :
                    incident.severity === 'high' ? '#f97316' :
                    incident.severity === 'medium' ? '#eab308' : '#22c55e'
                  }`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <p style={{ margin: 0, fontWeight: '500' }}>
                    {getSeverityIcon(incident.severity)} {incident.message}
                  </p>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {new Date(incident.created_at).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#cbd5e1' }}>
                  <span>Category: <strong style={{ color: '#60a5fa' }}>{incident.category}</strong></span>
                  <span>Severity: <strong>{incident.severity?.toUpperCase()}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div style={{
      background: 'rgba(30, 41, 59, 0.7)',
      padding: '20px',
      borderRadius: '12px',
      border: '1px solid rgba(51, 65, 85, 1)'
    }}>
      <div style={{ fontSize: '32px', marginBottom: '8px' }}>{icon}</div>
      <p style={{ color, fontSize: '14px', margin: '0 0 4px 0' }}>{label}</p>
      <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color }}>{value}</p>
    </div>
  );
}

export default App;