'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Upload, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle2, 
  History, 
  Loader2, 
  FileCheck,
  X
} from 'lucide-react';

interface DatasetItem {
  _id: string;
  name: string;
  slug: string;
  schemaFields: string[];
}

interface UploadHistoryItem {
  _id: string;
  fileName: string;
  datasetId: {
    _id: string;
    name: string;
    slug: string;
  } | null;
  rowsInserted: number;
  rowsFailed: number;
  uploadedBy: string;
  createdAt: string;
}

function UploadsContent() {
  const searchParams = useSearchParams();
  const initialDataset = searchParams.get('dataset') || '';

  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<DatasetItem | null>(null);
  
  // File state
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload progress & results
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<{
    success: boolean;
    summary?: {
      totalRows: number;
      inserted: number;
      updated: number;
      failed: number;
    };
    errors?: string[];
  } | null>(null);
  const [error, setError] = useState('');

  // History logs state
  const [history, setHistory] = useState<UploadHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [adminSecret, setAdminSecret] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('lkkey_admin_secret') || '';
    setAdminSecret(saved);
  }, []);

  useEffect(() => {
    if (adminSecret) {
      fetchDatasets();
      fetchHistory();
    }
  }, [adminSecret]);

  async function fetchDatasets() {
    try {
      const res = await fetch('/api/admin/datasets', {
        headers: { 'x-admin-secret': adminSecret }
      });
      if (!res.ok) return;
      const data = await res.json();
      setDatasets(data);
      if (data.length > 0) {
        const matching = data.find((d: DatasetItem) => d.slug === initialDataset);
        setSelectedDataset(matching || data[0]);
      }
    } catch (err) {
      console.error('Error fetching datasets:', err);
    }
  }

  async function fetchHistory() {
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/admin/uploads', {
        headers: { 'x-admin-secret': adminSecret }
      });
      if (!res.ok) return;
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error('Error fetching uploads history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }

  // Drag-and-drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    setError('');
    setResults(null);
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'xls') {
      setError('Invalid file type. Please upload an Excel workbook (.xlsx or .xls)');
      return;
    }
    setFile(selectedFile);
  };

  const clearFile = () => {
    setFile(null);
    setResults(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Upload action
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedDataset) return;
    
    setUploading(true);
    setError('');
    setResults(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploadedBy', 'Aman Mahadik');

    try {
      const res = await fetch(`/api/admin/datasets/${selectedDataset.slug}/upload`, {
        method: 'POST',
        headers: {
          'x-admin-secret': adminSecret
        },
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to upload and parse file');
        if (data.details) {
          setResults({ success: false, errors: data.details });
        }
        return;
      }

      setResults({
        success: true,
        summary: data.summary,
        errors: data.errors
      });
      setFile(null); // Clear file on success
      fetchHistory(); // Refresh history log
    } catch (err: any) {
      setError(err.message || 'Network error during upload');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <header className="page-header">
        <h1 className="page-title">Upload Center</h1>
        <p className="page-subtitle">Import or update dataset rows by dropping Excel workbooks. Natural keys prevent duplicate rows.</p>
      </header>

      <div className="dashboard-sections" style={{ gridTemplateColumns: '5fr 4fr', gap: '32px' }}>
        {/* Upload Panel */}
        <div>
          <div className="section-card">
            <h3 className="section-title" style={{ marginBottom: '20px' }}>Import Excel Sheet</h3>
            
            <form onSubmit={handleUploadSubmit}>
              {/* Dataset dropdown */}
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Target Dataset</label>
                <select 
                  value={selectedDataset?.slug || ''} 
                  onChange={(e) => setSelectedDataset(datasets.find(d => d.slug === e.target.value) || null)}
                  className="form-input"
                  style={{ width: '100%' }}
                >
                  {datasets.map(d => (
                    <option key={d._id} value={d.slug}>{d.name} ({d.slug})</option>
                  ))}
                </select>
                {selectedDataset && (
                  <span className="form-help">
                    Expected columns: <strong style={{ color: 'var(--text-secondary)' }}>{selectedDataset.schemaFields.join(', ')}</strong>
                  </span>
                )}
              </div>

              {/* Drag & Drop Dropzone */}
              {!file ? (
                <div 
                  className="dropzone"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ borderColor: dragging ? 'var(--accent-primary)' : 'var(--border-color)', backgroundColor: dragging ? 'rgba(37,99,235,0.03)' : '' }}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept=".xlsx, .xls"
                    style={{ display: 'none' }}
                  />
                  <div className="dropzone-icon">
                    <Upload size={22} />
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '700', marginBottom: '4px' }}>
                      Drag and drop your Excel file here
                    </p>
                    <p className="text-muted" style={{ fontSize: '12px' }}>
                      or click to browse (.xlsx or .xls files only)
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: '14px',
                  padding: '20px',
                  backgroundColor: 'rgba(255, 255, 255, 0.01)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <div className="avatar" style={{ backgroundColor: 'rgba(34,197,94,0.08)', color: 'var(--color-success)' }}>
                    <FileSpreadsheet size={18} />
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <h4 style={{ fontSize: '13.5px', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.name}
                    </h4>
                    <p className="text-muted" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button type="button" className="btn-secondary" style={{ padding: '6px' }} onClick={clearFile}>
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Action buttons */}
              {file && (
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                  <button type="button" className="btn-secondary" onClick={clearFile}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={uploading}>
                    {uploading ? (
                      <>
                        <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={14} />
                        <span>Parsing sheet & Upserting...</span>
                      </>
                    ) : (
                      <>
                        <FileCheck size={14} />
                        <span>Confirm Upload</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Results Summary Alert */}
          {error && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              color: 'var(--color-danger)',
              padding: '16px',
              borderRadius: '12px',
              fontSize: '13.5px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              marginTop: '20px'
            }}>
              <AlertCircle size={18} style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong style={{ display: 'block', marginBottom: '4px' }}>Upload Failed</strong>
                <span>{error}</span>
              </div>
            </div>
          )}

          {results && results.success && results.summary && (
            <div style={{
              backgroundColor: 'rgba(34, 197, 94, 0.08)',
              border: '1px solid rgba(34, 197, 94, 0.15)',
              color: 'var(--color-success)',
              padding: '20px',
              borderRadius: '12px',
              fontSize: '13.5px',
              marginTop: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <CheckCircle2 size={20} />
                <strong style={{ fontSize: '15px' }}>File successfully processed!</strong>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '12px', fontFamily: 'var(--font-mono)' }}>
                <div style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Rows</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>{results.summary.totalRows}</div>
                </div>
                <div style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Inserted</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-success)' }}>{results.summary.inserted}</div>
                </div>
                <div style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Updated</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--accent-glow)' }}>{results.summary.updated}</div>
                </div>
                <div style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Failed</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-danger)' }}>{results.summary.failed}</div>
                </div>
              </div>

              {/* Show errors in sheet */}
              {results.errors && results.errors.length > 0 && (
                <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                  <div style={{ fontWeight: '700', color: '#fff', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase' }}>Validation logs:</div>
                  <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {results.errors.map((err, idx) => (
                      <div key={idx} style={{ color: 'var(--color-warning)' }}>• {err}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Upload History Log */}
        <div>
          <div className="section-card" style={{ maxHeight: '600px', display: 'flex', flexDirection: 'column' }}>
            <div className="section-header-row" style={{ marginBottom: '16px' }}>
              <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={18} />
                <span>Upload Logs History</span>
              </h3>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {historyLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                  <Loader2 className="text-secondary" style={{ animation: 'spin 1s linear infinite' }} size={24} />
                </div>
              ) : history.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '40px 0' }}>
                  No historical upload logs recorded.
                </div>
              ) : (
                history.map((log) => (
                  <div key={log._id} style={{
                    padding: '14px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255,255,255,0.005)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff', wordBreak: 'break-all' }}>{log.fileName}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {new Date(log.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      <span>Dataset: <strong>{log.datasetId ? log.datasetId.name : 'Deleted Dataset'}</strong></span>
                      <span>By: {log.uploadedBy}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '10px', fontSize: '11px', fontFamily: 'var(--font-mono)', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '8px' }}>
                      <span className="text-success">+{log.rowsInserted} rows</span>
                      {log.rowsFailed > 0 && <span className="text-danger">-{log.rowsFailed} failed</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UploadsPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 0', gap: '16px' }}>
        <Loader2 className="text-secondary" style={{ animation: 'spin 1s linear infinite' }} size={28} />
        <span className="text-muted" style={{ fontSize: '13px' }}>Loading upload center...</span>
      </div>
    }>
      <UploadsContent />
    </Suspense>
  );
}
