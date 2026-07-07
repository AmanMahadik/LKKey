'use client';

import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  Plus, 
  Copy, 
  Check, 
  Trash, 
  AlertTriangle,
  Loader2,
  Calendar,
  Layers,
  Activity,
  X
} from 'lucide-react';

interface ApiKeyItem {
  _id: string;
  keyId: string;
  ownerLabel: string;
  allowedDatasets: string[];
  requestCount: number;
  lastUsedAt?: string;
  isActive: boolean;
  createdAt: string;
}

interface DatasetItem {
  _id: string;
  name: string;
  slug: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Key creation state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [ownerLabel, setOwnerLabel] = useState('');
  const [selectedScope, setSelectedScope] = useState('*'); // '*' or specific dataset slug
  const [creating, setCreating] = useState(false);
  
  // Post-creation modal state
  const [showRawKeyModal, setShowRawKeyModal] = useState(false);
  const [rawKey, setRawKey] = useState('');
  const [copied, setCopied] = useState(false);

  const [adminSecret, setAdminSecret] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('lkkey_admin_secret') || '';
    setAdminSecret(saved);
  }, []);

  useEffect(() => {
    if (adminSecret) {
      fetchKeys();
      fetchDatasets();
    } else {
      setLoading(false);
    }
  }, [adminSecret]);

  async function fetchKeys() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/api-keys', {
        headers: { 'x-admin-secret': adminSecret }
      });
      if (!res.ok) {
        setError('Failed to fetch API keys. Please verify your admin secret.');
        return;
      }
      const data = await res.json();
      setKeys(data);
    } catch (err) {
      setError('Network error retrieving keys.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchDatasets() {
    try {
      const res = await fetch('/api/admin/datasets', {
        headers: { 'x-admin-secret': adminSecret }
      });
      if (res.ok) {
        const data = await res.json();
        setDatasets(data);
      }
    } catch (err) {
      console.error('Error fetching datasets:', err);
    }
  }

  async function handleCreateKey(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const allowedDatasets = selectedScope === '*' ? ['*'] : [selectedScope];
      const res = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminSecret
        },
        body: JSON.stringify({ ownerLabel, allowedDatasets })
      });

      if (!res.ok) {
        alert('Failed to generate key');
        return;
      }

      const data = await res.json();
      setRawKey(data.key); // Raw key returned once
      setShowCreateModal(false);
      setShowRawKeyModal(true);
      
      // Reset form
      setOwnerLabel('');
      setSelectedScope('*');
      
      fetchKeys();
    } catch (err) {
      console.error('Error generating key:', err);
    } finally {
      setCreating(false);
    }
  }

  async function handleRevokeKey(id: string) {
    if (!confirm('Are you sure you want to revoke this API key? This action is permanent and will block all client integrations using this credential.')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/api-keys/${id}/revoke`, {
        method: 'PATCH',
        headers: {
          'x-admin-secret': adminSecret
        }
      });

      if (!res.ok) {
        alert('Failed to revoke API key');
        return;
      }

      fetchKeys();
    } catch (err) {
      console.error('Error revoking key:', err);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(rawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <header className="page-header">
        <div className="page-title-row">
          <div>
            <h1 className="page-title">API Keys Management</h1>
            <p className="page-subtitle">Expose secure lookup datasets to external client websites using API credentials.</p>
          </div>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)} disabled={!adminSecret}>
            <Plus size={16} />
            <span>Generate API Key</span>
          </button>
        </div>
      </header>

      {error && (
        <div style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: 'var(--color-danger)', padding: '12px 16px', borderRadius: '10px', fontSize: '13.5px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Main Table */}
      <div className="table-container">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', gap: '16px' }}>
            <Loader2 className="text-secondary" style={{ animation: 'spin 1s linear infinite' }} size={28} />
            <span className="text-muted" style={{ fontSize: '13px' }}>Loading API keys...</span>
          </div>
        ) : keys.length === 0 ? (
          <div style={{ padding: '80px 40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <KeyRound size={32} className="text-muted" style={{ marginBottom: '16px' }} />
            <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>No API Keys Found</h4>
            <p className="text-muted" style={{ fontSize: '13px', marginBottom: '16px' }}>
              Create an API key credential to authenticate public database lookup routes.
            </p>
            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} />
              <span>Generate First Key</span>
            </button>
          </div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Owner / Label</th>
                <th>Key Identifier</th>
                <th>Scopes</th>
                <th>Requests Count</th>
                <th>Last Used At</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr key={key._id}>
                  <td>
                    <div style={{ fontWeight: '700', color: '#fff' }}>{key.ownerLabel}</div>
                  </td>
                  <td>
                    <code style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>{key.keyId}</code>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {key.allowedDatasets.map((scope) => (
                        <span key={scope} style={{
                          backgroundColor: 'rgba(255,255,255,0.03)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          padding: '2px 6px',
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          color: scope === '*' ? 'var(--accent-glow)' : 'var(--text-secondary)'
                        }}>
                          {scope === '*' ? 'all datasets (*)' : scope}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>
                      {key.requestCount.toLocaleString()}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : 'Never used'}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${key.isActive ? 'badge-active' : 'badge-inactive'}`}>
                      {key.isActive ? 'Active' : 'Revoked'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {key.isActive && (
                      <button 
                        className="btn-danger" 
                        style={{ padding: '6px 12px', fontSize: '11.5px', borderRadius: '8px' }}
                        onClick={() => handleRevokeKey(key._id)}
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* CREATE KEY MODAL */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '460px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Generate API Credential</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateKey}>
              <div className="form-group">
                <label className="form-label">Owner Label</label>
                <input 
                  type="text" 
                  value={ownerLabel} 
                  onChange={(e) => setOwnerLabel(e.target.value)} 
                  className="form-input" 
                  placeholder="e.g. SocietySync / Billing Widget"
                  required
                />
                <span className="form-help">Identify who or which project will use this key.</span>
              </div>

              <div className="form-group" style={{ marginBottom: '28px' }}>
                <label className="form-label">Authorized Scope</label>
                <select 
                  value={selectedScope} 
                  onChange={(e) => setSelectedScope(e.target.value)}
                  className="form-input"
                  style={{ width: '100%' }}
                >
                  <option value="*">All Datasets (*)</option>
                  {datasets.map(d => (
                    <option key={d._id} value={d.slug}>{d.name} ({d.slug})</option>
                  ))}
                </select>
                <span className="form-help">Determine which dataset this credential has access to.</span>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={creating}>
                  {creating ? 'Generating...' : 'Generate Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RAW KEY MODAL (SHOWN ONCE) */}
      {showRawKeyModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '500px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-warning)' }}>
                <AlertTriangle size={18} />
                <span>API Key Generated Successfully</span>
              </h3>
            </div>
            
            <div style={{ fontSize: '13px', lineHeight: '1.5', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              <p style={{ marginBottom: '12px' }}>
                Please copy this key and store it securely. For security reasons, <strong>you will not be able to see it again</strong>.
              </p>
              
              <div className="copy-block">
                <span>{rawKey}</span>
                <button className="copy-btn" onClick={handleCopy}>
                  {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button className="btn-primary" onClick={() => setShowRawKeyModal(false)}>
                I have saved this key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
