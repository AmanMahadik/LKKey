'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  TableProperties, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  FileDown, 
  Loader2,
  Database,
  ArrowUpDown
} from 'lucide-react';

interface DatasetItem {
  _id: string;
  name: string;
  slug: string;
  schemaFields: string[];
  searchableFields: string[];
}

interface RecordItem {
  _id: string;
  data: Record<string, any>;
}

function RecordsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialSlug = searchParams.get('dataset') || '';

  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<DatasetItem | null>(null);
  
  // Records State
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  
  const [adminSecret, setAdminSecret] = useState('');
  const [error, setError] = useState('');

  // Demo API Key seeded in DB for dashboard querying
  const DEMO_API_KEY = 'lk_key_demo12345678_demosecretkey';

  useEffect(() => {
    const saved = localStorage.getItem('lkkey_admin_secret') || '';
    setAdminSecret(saved);
  }, []);

  // Fetch all datasets for selector
  useEffect(() => {
    if (adminSecret) {
      fetchDatasets();
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
      
      // Auto-select dataset based on query param or first dataset
      if (data.length > 0) {
        const matching = data.find((d: DatasetItem) => d.slug === initialSlug);
        setSelectedDataset(matching || data[0]);
      }
    } catch (err) {
      console.error('Error fetching datasets:', err);
    }
  }

  // Load records whenever selected dataset, page, or search query changes
  const loadRecords = useCallback(async () => {
    if (!selectedDataset) return;
    setLoading(true);
    setError('');

    try {
      let url = '';
      const headers: Record<string, string> = {
        'x-api-key': DEMO_API_KEY
      };

      if (searchQuery.trim()) {
        url = `/api/v1/${selectedDataset.slug}/search?q=${encodeURIComponent(searchQuery.trim())}`;
      } else {
        url = `/api/v1/${selectedDataset.slug}/all?page=${page}&limit=12`;
      }

      const res = await fetch(url, { headers });
      if (!res.ok) {
        const errData = await res.json();
        setError(errData.error || 'Failed to retrieve records');
        setRecords([]);
        return;
      }

      const resData = await res.json();
      
      if (searchQuery.trim()) {
        // Search endpoint returns { results }
        setRecords(resData.results || []);
        setTotalRecords(resData.count || 0);
        setTotalPages(1); // Search doesn't paginate by default, returns top matching items
      } else {
        // All endpoint returns { results, pagination }
        setRecords(resData.results || []);
        if (resData.pagination) {
          setTotalRecords(resData.pagination.totalRecords);
          setTotalPages(resData.pagination.totalPages);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with lookup service');
    } finally {
      setLoading(false);
    }
  }, [selectedDataset, page, searchQuery]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Handle dataset dropdown change
  function handleDatasetChange(slug: string) {
    const matching = datasets.find(d => d.slug === slug);
    if (matching) {
      setSelectedDataset(matching);
      setPage(1);
      setSearchQuery('');
      // Update URL query parameter
      router.push(`/records?dataset=${slug}`);
    }
  }

  // Handle search input with debounce / direct trigger
  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchQuery(e.target.value);
    setPage(1);
  }

  // Export CSV
  function handleExportCsv() {
    if (!selectedDataset || records.length === 0) return;
    
    const headersList = selectedDataset.schemaFields;
    
    // Add extra headers dynamically from records if any
    const allRowKeys = new Set<string>();
    records.forEach(r => {
      Object.keys(r.data).forEach(k => allRowKeys.add(k));
    });
    
    const finalHeaders = Array.from(new Set([...headersList, ...Array.from(allRowKeys)]));
    
    // Build CSV content
    const csvRows = [];
    csvRows.push(finalHeaders.join(',')); // Add header row

    records.forEach(r => {
      const values = finalHeaders.map(header => {
        const val = r.data[header] || '';
        // Escape quotes
        const escaped = String(val).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${selectedDataset.slug}_records.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <header className="page-header">
        <div className="page-title-row">
          <div>
            <h1 className="page-title">Records Inspector</h1>
            <p className="page-subtitle">Inspect, search, and export data rows using live client-side queries.</p>
          </div>
          
          {/* Dataset Selector */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Active Dataset:</span>
            <select 
              value={selectedDataset?.slug || ''} 
              onChange={(e) => handleDatasetChange(e.target.value)}
              className="form-input"
              style={{ width: '220px', cursor: 'pointer' }}
            >
              {datasets.map(d => (
                <option key={d._id} value={d.slug}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Main Records Control Panel */}
      {selectedDataset ? (
        <div>
          {/* Controls Navbar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            gap: '16px'
          }}>
            {/* Search Input */}
            <div className="nav-search" style={{ width: '400px', backgroundColor: 'var(--bg-card)' }}>
              <Search size={16} />
              <input 
                type="text" 
                placeholder={`Search records by ${selectedDataset.searchableFields.join(' or ')}...`}
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>

            {/* Actions */}
            <button 
              className="btn-secondary"
              onClick={handleExportCsv}
              disabled={records.length === 0}
            >
              <FileDown size={16} />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Error alert */}
          {error && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: 'var(--color-danger)',
              padding: '12px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              marginBottom: '20px'
            }}>
              {error}
            </div>
          )}

          {/* Table Container */}
          <div className="table-container">
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 0', gap: '16px' }}>
                <Loader2 className="text-secondary" style={{ animation: 'spin 1s linear infinite' }} size={28} />
                <span className="text-muted" style={{ fontSize: '13px' }}>Querying lookup backend...</span>
              </div>
            ) : records.length === 0 ? (
              <div style={{ padding: '80px 40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <TableProperties size={32} className="text-muted" style={{ marginBottom: '16px' }} />
                <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>No Matching Records Found</h4>
                <p className="text-muted" style={{ fontSize: '13px' }}>
                  {searchQuery ? 'Try refinement or checking for typos.' : 'No data rows exist in this dataset. Go to Uploads to add some.'}
                </p>
              </div>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    {selectedDataset.schemaFields.map((field) => (
                      <th key={field}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{field.replace('_', ' ')}</span>
                          <ArrowUpDown size={11} className="text-muted" />
                        </div>
                      </th>
                    ))}
                    {/* Capture extra column keys that aren't strictly in schema fields but exist in records */}
                    {Array.from(
                      new Set(
                        records.flatMap(r => Object.keys(r.data || {})).filter(k => !selectedDataset.schemaFields.includes(k))
                      )
                    ).map((extraField) => (
                      <th key={extraField} style={{ textTransform: 'lowercase', fontStyle: 'italic', opacity: 0.8 }}>
                        {extraField}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => {
                    const schemaFieldsList = selectedDataset.schemaFields;
                    const extraFieldsList = Object.keys(record.data || {}).filter(k => !schemaFieldsList.includes(k));
                    
                    return (
                      <tr key={record._id}>
                        {schemaFieldsList.map((field) => (
                          <td key={field}>
                            {record.data[field] !== undefined ? String(record.data[field]) : '-'}
                          </td>
                        ))}
                        {extraFieldsList.map((field) => (
                          <td key={field} style={{ color: 'var(--text-secondary)' }}>
                            {String(record.data[field])}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Controls */}
          {!searchQuery && (
            <div className="pagination">
              <span className="pagination-stats">
                Showing <strong style={{ color: '#fff' }}>{records.length}</strong> of{' '}
                <strong style={{ color: '#fff' }}>{totalRecords}</strong> records
              </span>
              <div className="pagination-buttons">
                <button 
                  className="btn-secondary" 
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  style={{ padding: '8px 12px' }}
                >
                  <ChevronLeft size={16} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Page {page} of {totalPages}
                </div>
                <button 
                  className="btn-secondary" 
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  style={{ padding: '8px 12px' }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ padding: '80px 0', textAlign: 'center' }}>
          <Loader2 className="text-secondary" style={{ animation: 'spin 1s linear infinite' }} size={28} />
        </div>
      )}
    </div>
  );
}

export default function RecordsPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 0', gap: '16px' }}>
        <Loader2 className="text-secondary" style={{ animation: 'spin 1s linear infinite' }} size={28} />
        <span className="text-muted" style={{ fontSize: '13px' }}>Loading records...</span>
      </div>
    }>
      <RecordsContent />
    </Suspense>
  );
}
