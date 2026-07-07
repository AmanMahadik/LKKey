'use client';

import React from 'react';
import { 
  BarChart3, 
  Clock, 
  Activity, 
  AlertOctagon,
  Percent,
  CheckCircle,
  XCircle,
  HelpCircle
} from 'lucide-react';

export default function AnalyticsPage() {
  // Mock analytics aggregates matching system health
  const metrics = {
    totalRequests: 8421,
    successRate: 99.6,
    avgLatency: '14ms',
    errorRate: 0.4
  };

  // Response Codes distribution
  const responseCodes = [
    { code: '200 OK', count: 8387, pct: 99.6, color: 'var(--color-success)' },
    { code: '400 Bad Request', count: 18, pct: 0.2, color: 'var(--color-warning)' },
    { code: '403 Forbidden', count: 11, pct: 0.1, color: 'var(--color-danger)' },
    { code: '429 Rate Limited', count: 5, pct: 0.1, color: '#6B7280' },
  ];

  // Most used endpoints
  const topEndpoints = [
    { method: 'GET', path: '/api/v1/rto-codes/search', count: 5241, pct: 62 },
    { method: 'GET', path: '/api/v1/pincodes/lookup', count: 2132, pct: 25 },
    { method: 'GET', path: '/api/v1/ifsc-codes/search', count: 704, pct: 8 },
    { method: 'GET', path: '/api/v1/isd-codes/lookup', count: 344, pct: 4 },
  ];

  return (
    <div className="page-container">
      {/* Page Header */}
      <header className="page-header">
        <h1 className="page-title">Usage & Analytics</h1>
        <p className="page-subtitle">Analyze API request volumes, error distributions, and response latency statistics.</p>
      </header>

      {/* Stats Cards */}
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Total Queries</span>
            <div className="stat-icon-wrapper">
              <BarChart3 size={18} />
            </div>
          </div>
          <div className="stat-value">{metrics.totalRequests.toLocaleString()}</div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Accumulated across active tokens</span>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Average Latency</span>
            <div className="stat-icon-wrapper">
              <Clock size={18} />
            </div>
          </div>
          <div className="stat-value">{metrics.avgLatency}</div>
          <span style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: '600' }}>✓ Optimal db read speeds</span>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Service Availability</span>
            <div className="stat-icon-wrapper">
              <Percent size={18} />
            </div>
          </div>
          <div className="stat-value">{metrics.successRate}%</div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Target SLA threshold: 99.9%</span>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Request Failures</span>
            <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', color: 'var(--color-danger)' }}>
              <AlertOctagon size={18} />
            </div>
          </div>
          <div className="stat-value">{metrics.errorRate}%</div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>34 authentication blockages</span>
        </div>
      </div>

      <div className="dashboard-sections" style={{ gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        {/* Endpoints breakdown */}
        <div>
          <div className="section-card">
            <h3 className="section-title" style={{ marginBottom: '20px' }}>Top Query Endpoints</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {topEndpoints.map((ep, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        color: 'var(--accent-glow)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '700',
                        fontFamily: 'var(--font-mono)'
                      }}>{ep.method}</span>
                      <code style={{ fontFamily: 'var(--font-mono)', color: '#fff', fontSize: '12px' }}>{ep.path}</code>
                    </div>
                    <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      {ep.count.toLocaleString()} <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>({ep.pct}%)</span>
                    </span>
                  </div>
                  <div className="rank-bar-bg" style={{ height: '4px' }}>
                    <div className="rank-bar-fill" style={{ width: `${ep.pct}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* HTTP Response codes breakdown */}
        <div>
          <div className="section-card">
            <h3 className="section-title" style={{ marginBottom: '20px' }}>HTTP Response Distribution</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {responseCodes.map((rc, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.005)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {idx === 0 ? (
                      <CheckCircle className="text-success" size={16} />
                    ) : (
                      <XCircle style={{ color: rc.color }} size={16} />
                    )}
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>{rc.code}</span>
                  </div>
                  <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: '700', fontFamily: 'var(--font-mono)', display: 'block', color: '#fff' }}>
                      {rc.count.toLocaleString()}
                    </span>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{rc.pct}% of total</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
