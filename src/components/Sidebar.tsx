'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Database, 
  TableProperties, 
  Upload, 
  KeyRound, 
  BarChart3, 
  Settings 
} from 'lucide-react';

interface SidebarProps {
  stats?: {
    requestCount: number;
    requestLimit: number;
  };
}

export default function Sidebar({ stats = { requestCount: 8421, requestLimit: 20000 } }: SidebarProps) {
  const pathname = usePathname();
  
  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Datasets', path: '/datasets', icon: Database },
    { name: 'Records', path: '/records', icon: TableProperties },
    { name: 'Uploads', path: '/uploads', icon: Upload },
    { name: 'API Keys', path: '/api-keys', icon: KeyRound },
    { name: 'Usage & Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const percentage = Math.min(100, Math.round((stats.requestCount / stats.requestLimit) * 100));

  return (
    <aside className="sidebar">
      <div>
        <div className="sidebar-logo-container">
          <img src="/logo.png" alt="LKKey Logo" className="sidebar-logo" />
          <div>
            <h1 className="sidebar-brand-name">LKKey</h1>
            <p className="sidebar-tagline">Forge Data. Find Clarity.</p>
          </div>
        </div>

        <nav className="sidebar-menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link 
                key={item.path} 
                href={item.path} 
                className={`sidebar-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div>
        {/* Usage Card */}
        <div className="usage-box">
          <div className="usage-box-title">API Usage This Month</div>
          <div className="usage-box-count">
            {stats.requestCount.toLocaleString()} <span className="text-muted">/ {stats.requestLimit.toLocaleString()}</span>
          </div>
          <div className="usage-progress-bar">
            <div className="usage-progress-fill" style={{ width: `${percentage}%` }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span>Monthly quota</span>
            <span>{percentage}%</span>
          </div>
        </div>

        {/* Profile Segments */}
        <div className="sidebar-footer">
          <div className="sidebar-profile">
            <div className="avatar">AM</div>
            <div className="profile-info">
              <span className="profile-name">Aman Mahadik</span>
              <span className="profile-role">Founder & Developer</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
