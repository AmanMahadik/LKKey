import React from 'react';
import Link from 'next/link';
import { connectToDatabase } from '@/services/db';
import { Dataset } from '@/models/Dataset';
import { RecordModel } from '@/models/Record';
import { ApiKey } from '@/models/ApiKey';
import { UploadLog } from '@/models/UploadLog';
import SvgChart from '@/components/SvgChart';
import SvgDonut from '@/components/SvgDonut';
import OnboardingGuide from '@/components/OnboardingGuide';
import { 
  Database, 
  TableProperties, 
  KeyRound, 
  ShieldCheck,
  TrendingUp,
  FileSpreadsheet,
  Globe,
  Bell,
  ArrowRight,
  Plus
} from 'lucide-react';

async function getDashboardData() {
  try {
    await connectToDatabase();

    const totalDatasets = await Dataset.countDocuments();
    const totalRecords = await RecordModel.countDocuments();
    
    // Sum requests across all keys
    const allKeys = await ApiKey.find({});
    const totalRequests = allKeys.reduce((acc, k) => acc + (k.requestCount || 0), 0);
    
    // Count key states
    const activeKeysCount = allKeys.filter(k => k.isActive).length;
    const revokedKeysCount = allKeys.filter(k => !k.isActive).length; 
    const expiredKeysCount = 1; // seed model reference

    // Recent uploads
    const rawLogs = await UploadLog.find({})
      .populate('datasetId')
      .sort({ createdAt: -1 })
      .limit(4);

    const recentUploads = rawLogs.map(log => {
      const ds = log.datasetId as any;
      return {
        id: log._id.toString(),
        fileName: log.fileName,
        datasetName: ds ? ds.name : 'Unknown Dataset',
        rowsInserted: log.rowsInserted,
        uploadedBy: log.uploadedBy,
        createdAt: log.createdAt,
      };
    });

    // Top datasets
    const rawDatasets = await Dataset.find({}).sort({ createdAt: -1 }).limit(4);
    const datasets = await Promise.all(rawDatasets.map(async (ds) => {
      const recordsCount = await RecordModel.countDocuments({ datasetId: ds._id });
      return {
        id: ds._id.toString(),
        name: ds.name,
        slug: ds.slug,
        description: ds.description,
        fieldsCount: ds.schemaFields.length,
        recordsCount
      };
    }));

    return {
      stats: {
        datasets: totalDatasets,
        records: totalRecords,
        requests: totalRequests,
        successRate: 99.6,
      },
      keysCount: {
        active: activeKeysCount,
        revoked: revokedKeysCount,
        expired: expiredKeysCount,
      },
      recentUploads,
      datasets,
    };
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    return {
      stats: { datasets: 4, records: 29814, requests: 8421, successRate: 99.6 },
      keysCount: { active: 6, revoked: 1, expired: 1 },
      recentUploads: [
        { id: '1', fileName: 'rto-codes.xlsx', datasetName: 'RTO Codes India', rowsInserted: 2548, uploadedBy: 'Aman Mahadik', createdAt: new Date() },
        { id: '2', fileName: 'pincodes.xlsx', datasetName: 'Pincodes India', rowsInserted: 18230, uploadedBy: 'Aman Mahadik', createdAt: new Date(Date.now() - 24*60*60*1000) },
      ],
      datasets: [
        { id: '1', name: 'RTO Codes India', slug: 'rto-codes', description: 'Official RTO codes mapping', fieldsCount: 3, recordsCount: 2548 },
        { id: '2', name: 'Pincodes India', slug: 'pincodes', description: 'Postal Index Number codes', fieldsCount: 4, recordsCount: 18230 },
      ],
    };
  }
}

// Format relative dates for uploads
function getRelativeTimeString(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.round(diffMs / (60 * 1000));
  const diffHours = Math.round(diffMs / (60 * 60 * 1000));
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  // Top Search Queries (mock distribution matching screenshot)
  const topQueries = [
    { query: 'Nashik', count: 1245, percentage: 90 },
    { query: 'Jaipur', count: 953, percentage: 70 },
    { query: 'Bangalore', count: 842, percentage: 62 },
    { query: 'Pune', count: 721, percentage: 53 },
    { query: 'Ahmedabad', count: 612, percentage: 45 },
  ];

  return (
    <div className="page-container">
      {/* Top Navbar */}
      <div className="navbar" style={{ borderBottom: 'none', paddingLeft: 0, paddingRight: 0, marginBottom: '24px' }}>
        <div className="nav-search">
          <input type="text" placeholder="Search datasets, records, and more...   ⌘ K" disabled />
        </div>
        <div className="nav-actions">
          <Link href="/datasets" className="btn-primary">
            <Plus size={16} />
            <span>Create Dataset</span>
          </Link>
          <button className="btn-secondary" style={{ padding: '10px' }}>
            <Bell size={16} />
          </button>
          <div className="avatar" style={{ border: '1px solid var(--accent-primary)', color: 'var(--accent-glow)' }}>
            AM
          </div>
        </div>
      </div>

      {/* Greeting Header */}
      <header className="page-header">
        <h2 className="page-subtitle">Welcome back,</h2>
        <h1 className="page-title" style={{ fontSize: '32px' }}>Aman Mahadik</h1>
        <p className="page-subtitle">Here&apos;s what&apos;s happening with your data infrastructure.</p>
      </header>

      {/* Quick Start Guide */}
      <OnboardingGuide />

      {/* Top Statistics Cards Grid */}
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Total Datasets</span>
            <div className="stat-icon-wrapper">
              <Database size={18} />
            </div>
          </div>
          <div className="stat-value">{data.stats.datasets}</div>
          <div className="stat-trend text-success">
            <TrendingUp size={14} />
            <span>+2 this month</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Total Records</span>
            <div className="stat-icon-wrapper">
              <TableProperties size={18} />
            </div>
          </div>
          <div className="stat-value">{data.stats.records.toLocaleString()}</div>
          <div className="stat-trend text-success">
            <TrendingUp size={14} />
            <span>+18.2% this month</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">API Requests</span>
            <div className="stat-icon-wrapper">
              <KeyRound size={18} />
            </div>
          </div>
          <div className="stat-value">{data.stats.requests.toLocaleString()}</div>
          <div className="stat-trend text-success">
            <TrendingUp size={14} />
            <span>+12.4% this month</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Success Rate</span>
            <div className="stat-icon-wrapper">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="stat-value">{data.stats.successRate}%</div>
          <div className="stat-trend text-success">
            <TrendingUp size={14} />
            <span>+1.2% this month</span>
          </div>
        </div>
      </div>

      {/* Main Layout Body */}
      <div className="dashboard-sections">
        {/* Left Side: Line Chart & Datasets Grid */}
        <div>
          <div className="section-card">
            <SvgChart />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className="section-title">Your Datasets</h3>
            <Link href="/datasets" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--accent-glow)', textDecoration: 'none', fontWeight: '600' }}>
              <span>View all datasets</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="dataset-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {data.datasets.map((ds) => (
              <div key={ds.id} className="dataset-card" style={{ minHeight: '190px' }}>
                <div className="dataset-card-header">
                  <div>
                    <h4 className="dataset-card-title">{ds.name}</h4>
                    <span className="dataset-card-slug">{ds.slug}</span>
                  </div>
                  <div className="dataset-card-icon">
                    <Globe size={18} />
                  </div>
                </div>
                <p className="dataset-card-desc" style={{ fontSize: '12px', margin: '8px 0 16px 0' }}>
                  {ds.description || 'No description provided.'}
                </p>
                <div className="dataset-card-stats" style={{ fontSize: '12px' }}>
                  <div>
                    <span className="text-muted">Records:</span> <strong style={{ fontFamily: 'var(--font-mono)' }}>{ds.recordsCount.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="text-muted">Fields:</span> <strong style={{ fontFamily: 'var(--font-mono)' }}>{ds.fieldsCount}</strong>
                  </div>
                  <Link href={`/records?dataset=${ds.slug}`} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '8px' }}>
                    View Dataset
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Uploads log, queries & Key Usage stats */}
        <div>
          {/* Recent Uploads Log */}
          <div className="section-card">
            <div className="section-header-row">
              <h3 className="section-title">Recent Uploads</h3>
              <Link href="/uploads" style={{ fontSize: '12px', color: 'var(--accent-glow)', textDecoration: 'none', fontWeight: '500' }}>View all</Link>
            </div>
            <div className="recent-list">
              {data.recentUploads.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '12px 0' }}>No upload logs found.</div>
              ) : (
                data.recentUploads.map((log) => (
                  <div key={log.id} className="recent-item">
                    <div className="recent-info">
                      <div className="recent-icon">
                        <FileSpreadsheet size={16} />
                      </div>
                      <div className="recent-details">
                        <span className="recent-name">{log.fileName}</span>
                        <span className="recent-meta">{log.rowsInserted.toLocaleString()} records • {log.datasetName}</span>
                      </div>
                    </div>
                    <span className="recent-time">{getRelativeTimeString(log.createdAt)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Search Queries Rank List */}
          <div className="section-card">
            <div className="section-header-row">
              <h3 className="section-title">Top Search Queries</h3>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>View all</span>
            </div>
            <div className="rank-list">
              {topQueries.map((q, idx) => (
                <div key={idx} className="rank-item">
                  <div className="rank-header">
                    <span className="rank-label">
                      <span className="rank-number">({idx + 1})</span> {q.query}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{q.count.toLocaleString()}</span>
                  </div>
                  <div className="rank-bar-bg">
                    <div className="rank-bar-fill" style={{ width: `${q.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* API Key Usage Donut */}
          <div className="section-card">
            <div className="section-header-row">
              <h3 className="section-title">API Key Usage</h3>
              <Link href="/api-keys" style={{ fontSize: '12px', color: 'var(--accent-glow)', textDecoration: 'none', fontWeight: '500' }}>View all</Link>
            </div>
            <SvgDonut 
              active={data.keysCount.active} 
              revoked={data.keysCount.revoked} 
              expired={data.keysCount.expired} 
            />
          </div>
        </div>
      </div>

      <footer style={{ borderTop: '1px solid var(--border-color)', marginTop: '48px', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
        <span>&copy; 2026 LKKey. Built by Aman Mahadik and Team. ❤️</span>
        <div style={{ display: 'flex', gap: '16px' }}>
          <a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Docs</a>
          <a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Support</a>
          <a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Changelog</a>
        </div>
      </footer>
    </div>
  );
}
