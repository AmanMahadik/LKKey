'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Database, 
  Plus, 
  X, 
  Globe, 
  Trash, 
  Pencil,
  ArrowRight,
  ShieldAlert,
  Loader2,
  FileSpreadsheet
} from 'lucide-react';

interface DatasetItem {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  schemaFields: string[];
  searchableFields: string[];
  uniqueKeys: string[];
  createdAt: string;
}

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Auth state
  const [adminSecret, setAdminSecret] = useState('');
  const [showSecretModal, setShowSecretModal] = useState(false);
  
  // Create dataset form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [schemaFields, setSchemaFields] = useState('');
  const [searchableFields, setSearchableFields] = useState('');
  const [uniqueKeys, setUniqueKeys] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit dataset form state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editId, setEditId] = useState('');
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSchemaFields, setEditSchemaFields] = useState('');
  const [editSearchableFields, setEditSearchableFields] = useState('');
  const [editUniqueKeys, setEditUniqueKeys] = useState('');
  const [editSubmitError, setEditSubmitError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => {
    // Load admin secret from localStorage if it exists
    const saved = localStorage.getItem('lkkey_admin_secret') || '';
    setAdminSecret(saved);
    if (!saved) {
      setShowSecretModal(true);
    }
  }, []);

  useEffect(() => {
    if (adminSecret) {
      fetchDatasets();
    } else {
      setLoading(false);
    }
  }, [adminSecret]);

  async function fetchDatasets() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/datasets', {
        headers: {
          'x-admin-secret': adminSecret
        }
      });
      if (!res.ok) {
        if (res.status === 401) {
          setError('Invalid Admin Secret. Please reset your secret in Settings.');
          setShowSecretModal(true);
        } else {
          const errData = await res.json();
          setError(errData.error || 'Failed to fetch datasets');
        }
        return;
      }
      const data = await res.json();
      setDatasets(data);
    } catch (err: any) {
      setError(err.message || 'Network error fetching datasets');
    } finally {
      setLoading(false);
    }
  }

  function handleSaveSecret(e: React.FormEvent) {
    e.preventDefault();
    localStorage.setItem('lkkey_admin_secret', adminSecret);
    setShowSecretModal(false);
    fetchDatasets();
  }

  async function handleCreateDataset(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);

    const fieldsArray = schemaFields.split(',').map(s => s.trim()).filter(Boolean);
    const searchableArray = searchableFields.split(',').map(s => s.trim()).filter(Boolean);
    const uniqueArray = uniqueKeys.split(',').map(s => s.trim()).filter(Boolean);

    if (fieldsArray.length === 0 || searchableArray.length === 0) {
      setSubmitError('Schema fields and searchable fields are required.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/datasets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminSecret
        },
        body: JSON.stringify({
          name,
          slug,
          description,
          schemaFields: fieldsArray,
          searchableFields: searchableArray,
          uniqueKeys: uniqueArray
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        setSubmitError(errData.error || 'Failed to create dataset');
        return;
      }

      // Success
      setName('');
      setSlug('');
      setDescription('');
      setSchemaFields('');
      setSearchableFields('');
      setUniqueKeys('');
      setShowCreateModal(false);
      fetchDatasets();
    } catch (err: any) {
      setSubmitError(err.message || 'Network error creating dataset');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteDataset(id: string, name: string) {
    if (!window.confirm(`Are you sure you want to delete the dataset "${name}"? This will permanently delete the schema definition AND all associated records and logs.`)) {
      return;
    }
    
    try {
      const res = await fetch(`/api/admin/datasets?id=${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-secret': adminSecret
        }
      });
      
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || 'Failed to delete dataset');
        return;
      }
      
      // Update local state
      setDatasets(datasets.filter(ds => ds._id !== id));
    } catch (err: any) {
      alert(err.message || 'Error occurred during deletion');
    }
  }

  function handleOpenEditModal(ds: DatasetItem) {
    setEditId(ds._id);
    setEditName(ds.name);
    setEditDescription(ds.description || '');
    setEditSchemaFields(ds.schemaFields.join(', '));
    setEditSearchableFields(ds.searchableFields.join(', '));
    setEditUniqueKeys(ds.uniqueKeys.join(', '));
    setEditSubmitError('');
    setShowEditModal(true);
  }

  async function handleEditDataset(e: React.FormEvent) {
    e.preventDefault();
    setEditSubmitError('');
    setEditSubmitting(true);

    const fieldsArray = editSchemaFields.split(',').map(s => s.trim()).filter(Boolean);
    const searchableArray = editSearchableFields.split(',').map(s => s.trim()).filter(Boolean);
    const uniqueArray = editUniqueKeys.split(',').map(s => s.trim()).filter(Boolean);

    // Validation
    if (!editName || fieldsArray.length === 0 || searchableArray.length === 0) {
      setEditSubmitError('Missing required fields: name, schema fields, searchable fields');
      setEditSubmitting(false);
      return;
    }

    // Verify searchableFields and uniqueKeys are sub-elements of schemaFields
    const invalidSearchable = searchableArray.filter(f => !fieldsArray.includes(f));
    if (invalidSearchable.length > 0) {
      setEditSubmitError(`Searchable fields must be part of schema fields: ${invalidSearchable.join(', ')}`);
      setEditSubmitting(false);
      return;
    }

    const invalidUnique = uniqueArray.filter(f => !fieldsArray.includes(f));
    if (invalidUnique.length > 0) {
      setEditSubmitError(`Unique keys must be part of schema fields: ${invalidUnique.join(', ')}`);
      setEditSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`/api/admin/datasets?id=${editId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminSecret
        },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
          schemaFields: fieldsArray,
          searchableFields: searchableArray,
          uniqueKeys: uniqueArray
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        setEditSubmitError(errData.error || 'Failed to update dataset');
        return;
      }

      // Success
      setShowEditModal(false);
      fetchDatasets();
    } catch (err: any) {
      setEditSubmitError(err.message || 'Network error updating dataset');
    } finally {
      setEditSubmitting(false);
    }
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <header className="page-header" style={{ marginBottom: '40px' }}>
        <div className="page-title-row">
          <div>
            <h1 className="page-title">Datasets</h1>
            <p className="page-subtitle">Configure schema definitions, natural keys, and view records count.</p>
          </div>
          <button 
            className="btn-primary" 
            onClick={() => setShowCreateModal(true)}
            disabled={!adminSecret}
          >
            <Plus size={16} />
            <span>Create Dataset</span>
          </button>
        </div>
      </header>

      {/* Error state */}
      {error && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          color: 'var(--color-danger)',
          padding: '16px',
          borderRadius: '12px',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <ShieldAlert size={18} />
          <span>{error}</span>
          <button 
            onClick={() => setShowSecretModal(true)} 
            className="btn-secondary" 
            style={{ padding: '6px 12px', fontSize: '11px', marginLeft: 'auto', border: '1px solid var(--color-danger)', color: 'var(--color-danger)' }}
          >
            Configure Secret
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', gap: '16px' }}>
          <Loader2 className="text-secondary" style={{ animation: 'spin 1s linear infinite' }} size={32} />
          <span className="text-secondary" style={{ fontSize: '14px' }}>Loading dataset metadata...</span>
        </div>
      ) : datasets.length === 0 ? (
        <div style={{
          border: '1px dashed var(--border-color)',
          borderRadius: '18px',
          padding: '60px 40px',
          textAlign: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.005)',
          maxWidth: '560px',
          margin: '0 auto'
        }}>
          <div className="avatar" style={{ width: '48px', height: '48px', margin: '0 auto 20px auto', backgroundColor: 'rgba(37,99,235,0.08)', color: 'var(--accent-glow)' }}>
            <Database size={20} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>No Datasets Configured</h3>
          <p className="text-secondary" style={{ fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
            Get started by defining your first dataset structure (e.g. state, city, pincode), unique upsert constraints, and fuzzy searchable parameters.
          </p>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            <span>Create First Dataset</span>
          </button>
        </div>
      ) : (
        <div className="dataset-grid">
          {datasets.map((ds) => (
            <div key={ds._id} className="dataset-card">
              <div className="dataset-card-header">
                <div>
                  <h3 className="dataset-card-title">{ds.name}</h3>
                  <span className="dataset-card-slug">{ds.slug}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button 
                    onClick={() => handleOpenEditModal(ds)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      transition: 'var(--transition)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-glow)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    title="Edit Dataset Schema"
                  >
                    <Pencil size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteDataset(ds._id, ds.name)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      transition: 'var(--transition)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-danger)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    title="Delete Dataset"
                  >
                    <Trash size={16} />
                  </button>
                  <div className="dataset-card-icon">
                    <Database size={18} />
                  </div>
                </div>
              </div>
              
              <p className="dataset-card-desc">
                {ds.description || 'No description provided.'}
              </p>

              <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                <div>
                  <span className="text-muted">Unique Keys:</span>{' '}
                  <code style={{ color: 'var(--accent-glow)', fontFamily: 'var(--font-mono)' }}>
                    {ds.uniqueKeys.join(', ') || 'None (Fallback to schema)'}
                  </code>
                </div>
                <div>
                  <span className="text-muted">Searchable:</span>{' '}
                  <code style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {ds.searchableFields.join(', ')}
                  </code>
                </div>
              </div>

              <div className="dataset-card-stats">
                <div>
                  <span className="text-muted">Schema fields:</span>{' '}
                  <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{ds.schemaFields.length}</strong>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link href={`/uploads?dataset=${ds.slug}`} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '8px' }}>
                    Upload Excel
                  </Link>
                  <Link href={`/records?dataset=${ds.slug}`} className="btn-primary" style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '8px', boxShadow: 'none' }}>
                    View Records
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADMIN SECRET CONFIG MODAL */}
      {showSecretModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert className="text-warning" size={18} />
                <span>Configure Admin Authorization</span>
              </h3>
            </div>
            <form onSubmit={handleSaveSecret}>
              <div className="form-group">
                <p className="text-secondary" style={{ fontSize: '13px', lineHeight: '1.5', marginBottom: '16px' }}>
                  Please enter the <code>ADMIN_SECRET</code> configured in your server&apos;s environment variables to perform admin tasks.
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
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                  Save & Validate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE DATASET MODAL */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Dataset</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                <X size={18} />
              </button>
            </div>
            
            {submitError && (
              <div style={{ color: 'var(--color-danger)', fontSize: '13px', padding: '10px 14px', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '8px', marginBottom: '16px' }}>
                {submitError}
              </div>
            )}

            <form onSubmit={handleCreateDataset}>
              <div className="form-group">
                <label className="form-label">Dataset Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="form-input" 
                  placeholder="e.g. RTO Codes India"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Slug</label>
                <input 
                  type="text" 
                  value={slug} 
                  onChange={(e) => setSlug(e.target.value)} 
                  className="form-input" 
                  placeholder="e.g. rto-codes"
                  required
                />
                <span className="form-help">Unique URL-friendly identifier. Cannot be changed later.</span>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  className="form-input form-textarea" 
                  placeholder="Define the purpose of this dataset..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Schema Fields</label>
                <input 
                  type="text" 
                  value={schemaFields} 
                  onChange={(e) => setSchemaFields(e.target.value)} 
                  className="form-input" 
                  placeholder="state, city, rto_code"
                  required
                />
                <span className="form-help">Comma-separated list of expected columns in Excel.</span>
              </div>

              <div className="form-group">
                <label className="form-label">Searchable Fields</label>
                <input 
                  type="text" 
                  value={searchableFields} 
                  onChange={(e) => setSearchableFields(e.target.value)} 
                  className="form-input" 
                  placeholder="city, state"
                  required
                />
                <span className="form-help">Fields where fuzzy text searching matches. Must be in Schema Fields.</span>
              </div>

              <div className="form-group">
                <label className="form-label">Unique Keys</label>
                <input 
                  type="text" 
                  value={uniqueKeys} 
                  onChange={(e) => setUniqueKeys(e.target.value)} 
                  className="form-input" 
                  placeholder="state, city"
                />
                <span className="form-help">Natural keys that prevent duplicate records on re-upload (e.g. unique combo).</span>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '28px' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create Dataset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DATASET MODAL */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Dataset Schema</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                <X size={18} />
              </button>
            </div>
            
            {editSubmitError && (
              <div style={{ color: 'var(--color-danger)', fontSize: '13px', padding: '10px 14px', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '8px', marginBottom: '16px' }}>
                {editSubmitError}
              </div>
            )}

            <form onSubmit={handleEditDataset}>
              <div className="form-group">
                <label className="form-label">Dataset Name</label>
                <input 
                  type="text" 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)} 
                  className="form-input" 
                  placeholder="e.g. RTO Codes India"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Slug (Uneditable)</label>
                <input 
                  type="text" 
                  value={datasets.find(d => d._id === editId)?.slug || ''} 
                  className="form-input" 
                  disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  value={editDescription} 
                  onChange={(e) => setEditDescription(e.target.value)} 
                  className="form-input form-textarea" 
                  placeholder="Define the purpose of this dataset..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Schema Fields</label>
                <input 
                  type="text" 
                  value={editSchemaFields} 
                  onChange={(e) => setEditSchemaFields(e.target.value)} 
                  className="form-input" 
                  placeholder="state, city, rto_code"
                  required
                />
                <span className="form-help">Comma-separated list of expected columns in Excel.</span>
              </div>

              <div className="form-group">
                <label className="form-label">Searchable Fields</label>
                <input 
                  type="text" 
                  value={editSearchableFields} 
                  onChange={(e) => setEditSearchableFields(e.target.value)} 
                  className="form-input" 
                  placeholder="city, state"
                  required
                />
                <span className="form-help">Fields where fuzzy text searching matches. Must be in Schema Fields.</span>
              </div>

              <div className="form-group">
                <label className="form-label">Unique Keys</label>
                <input 
                  type="text" 
                  value={editUniqueKeys} 
                  onChange={(e) => setEditUniqueKeys(e.target.value)} 
                  className="form-input" 
                  placeholder="state, city"
                />
                <span className="form-help">Natural keys that prevent duplicate records on re-upload (e.g. unique combo).</span>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '28px' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={editSubmitting}
                >
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
