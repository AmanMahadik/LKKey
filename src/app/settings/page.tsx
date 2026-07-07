'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Database, 
  Server, 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  RefreshCw,
  Info,
  Loader2
} from 'lucide-react';

interface HealthData {
  success: boolean;
  status: string;
  database: {
    state: string;
    connectionString: string;
  };
  stats: {
    datasets: number;
    records: number;
    apiKeys: number;
  };
  environment: {
    nodeVersion: string;
    platform: string;
    port: string;
  };
}

export default function SettingsPage() {
  const [adminSecret, setAdminSecret] = useState('');
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('lkkey_admin_secret') || '';
    setAdminSecret(saved);
  }, []);

  useEffect(() => {
    if (adminSecret) {
      fetchHealth();
    }
  }, [adminSecret]);

  async function fetchHealth() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/health', {
        headers: { 'x-admin-secret': adminSecret }
      });
      if (!res.ok) {
        setError('Unauthorized admin secret or unhealthy backend status.');
        setHealth(null);
        return;
      }
      const data = await res.json();
      setHealth(data);
    } catch (err: any) {
      setError('Communication error with health service backend.');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }

  function handleSaveSecret(e: React.FormEvent) {
    e.preventDefault();
    localStorage.setItem('lkkey_admin_secret', adminSecret);
    setSaveSuccess(true);
    fetchHealth();
    setTimeout(() => setSaveSuccess(false), 3000);
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <header className="page-header">
        <h1 className="page-title">Settings & System Health</h1>
        <p className="page-subtitle">Manage administrative access keys, review server status, and monitor database infrastructure.</p>
      </header>

      <div className="dashboard-sections" style={{ gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        {/* Admin Secret Configuration */}
        <div>
          <div className="section-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Server size={18} className="text-secondary" />
              <h3 className="section-title">Credentials Config</h3>
            </div>
            
            <form onSubmit={handleSaveSecret}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <p className="text-secondary" style={{ fontSize: '13px', lineHeight: '1.5', marginBottom: '16px' }}>
                  The dashboard authenticates with your backend REST service using the <code>ADMIN_SECRET</code>. Set it here to unlock read/write dashboard features.
                </p>
                <label className="form-label">Admin Secret Key</label>
                <input 
                  type="password" 
                  value={adminSecret} 
                  onChange={(e) => setAdminSecret(e.target.value)} 
                  className="form-input" 
                  placeholder="e.g. amanadminsecret123"
                  required
                />
              </div>

              {saveSuccess && (
                <div className="text-success" style={{ fontSize: '12.5px', fontWeight: '600', marginBottom: '16px' }}>
                  ✓ Secret updated and stored in browser cache successfully.
                </div>
              )}

              <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                Apply Credentials
              </button>
            </form>
          </div>

          <div className="section-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Info size={18} className="text-secondary" />
              <h3 className="section-title">Rate Limiting Thresholds</h3>
            </div>
            <div style={{ fontSize: '13px', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
              <p style={{ marginBottom: '10px' }}>
                LKKey enforces automated rate limits at the gateway layer using sliding window timestamps:
              </p>
              <ul style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>
                  Public Queries (<code>/search</code>, <code>/lookup</code>):{' '}
                  <strong style={{ color: 'var(--accent-glow)' }}>100 requests / minute</strong> per key.
                </li>
                <li>
                  Full Dataset Scans (<code>/all</code>):{' '}
                  <strong style={{ color: 'var(--color-warning)' }}>10 requests / minute</strong> per key.
                </li>
                <li>
                  Admin Endpoints (<code>/admin/*</code>): Enforced by secret matches, no rate throttling applied.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Server & DB Status */}
        <div>
          <div className="section-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} className="text-secondary" />
                <h3 className="section-title">Infrastructure Status</h3>
              </div>
              <button 
                onClick={fetchHealth} 
                className="btn-secondary" 
                style={{ padding: '6px 10px', fontSize: '11px' }}
                disabled={loading || !adminSecret}
              >
                {loading ? <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={12} /> : <RefreshCw size={12} />}
              </button>
            </div>

            {error && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)', color: 'var(--color-danger)', padding: '12px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            {health ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Status Badge */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.015)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ fontSize: '13px', fontWeight: '600' }}>Overall System Health</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: '700' }} className="text-success">
                    <ShieldCheck size={16} />
                    <span>Active / {health.status.toUpperCase()}</span>
                  </span>
                </div>

                {/* Database Metrics */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>Database Settings</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="text-muted">MongoDB Connection</span>
                      <span style={{ fontWeight: '600' }} className={health.database.state === 'connected' ? 'text-success' : 'text-danger'}>
                        {health.database.state.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="text-muted">Total Records Cached</span>
                      <span style={{ fontWeight: '600', fontFamily: 'var(--font-mono)' }}>{health.stats.records.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="text-muted">Total Active Datasets</span>
                      <span style={{ fontWeight: '600', fontFamily: 'var(--font-mono)' }}>{health.stats.datasets}</span>
                    </div>
                  </div>
                </div>

                {/* Environment Info */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>Runtime Environment</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="text-muted" style={{ fontFamily: 'var(--font-sans)' }}>Node.js Version</span>
                      <span>{health.environment.nodeVersion}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="text-muted" style={{ fontFamily: 'var(--font-sans)' }}>Platform OS</span>
                      <span style={{ textTransform: 'capitalize' }}>{health.environment.platform}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="text-muted" style={{ fontFamily: 'var(--font-sans)' }}>Server Port</span>
                      <span>{health.environment.port}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                {!adminSecret ? 'Configure your Admin Secret to retrieve live metrics.' : 'Gathering system metrics...'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
