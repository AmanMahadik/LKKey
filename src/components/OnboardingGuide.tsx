'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Database, 
  UploadCloud, 
  KeyRound, 
  X,
  Sparkles
} from 'lucide-react';

export default function OnboardingGuide() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if the user has dismissed the onboarding guide before
    const isDismissed = localStorage.getItem('lkkey_hide_onboarding');
    if (!isDismissed) {
      setVisible(true);
    }
  }, []);

  function handleDismiss() {
    localStorage.setItem('lkkey_hide_onboarding', 'true');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(0,0,0,0) 100%)',
      border: '1px solid rgba(37, 99, 235, 0.2)',
      borderRadius: 'var(--radius-card)',
      padding: '24px',
      marginBottom: '32px',
      position: 'relative',
      boxShadow: 'var(--shadow-glow)',
      animation: 'slideDown 0.3s ease-out'
    }}>
      {/* Dismiss Button */}
      <button 
        onClick={handleDismiss}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          transition: 'var(--transition)'
        }}
        title="Dismiss Guide"
      >
        <X size={18} />
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          backgroundColor: 'rgba(37,99,235,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent-glow)'
        }}>
          <Sparkles size={16} />
        </div>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>Quick Start Guide</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Get your search API up and running in 4 easy steps</p>
        </div>
      </div>

      {/* Roadmap Steps */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px',
        marginTop: '20px'
      }}>
        {/* Step 1 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent-glow)', fontFamily: 'var(--font-mono)' }}>01</span>
            <ShieldCheck size={14} className="text-secondary" />
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Save Admin Secret</span>
          </div>
          <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Go to <strong>Settings</strong> and save the admin secret (default: <code>amanadminsecret123</code>) to authorize writes.
          </p>
        </div>

        {/* Step 2 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent-glow)', fontFamily: 'var(--font-mono)' }}>02</span>
            <Database size={14} className="text-secondary" />
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Define Dataset</span>
          </div>
          <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Go to <strong>Datasets</strong>, click Create, and define your schema fields, searchable parameters, and natural keys.
          </p>
        </div>

        {/* Step 3 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent-glow)', fontFamily: 'var(--font-mono)' }}>03</span>
            <UploadCloud size={14} className="text-secondary" />
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Upload Excel</span>
          </div>
          <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Drop your sheet in <strong>Uploads</strong>. The smart parser maps cities and auto-infers states from RTO prefixes (e.g. <code>MH</code>).
          </p>
        </div>

        {/* Step 4 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent-glow)', fontFamily: 'var(--font-mono)' }}>04</span>
            <KeyRound size={14} className="text-secondary" />
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Query the API</span>
          </div>
          <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Generate a key in <strong>API Keys</strong> and start sending fuzzy requests (e.g. <code>/search?q=Nasik</code>) in your apps!
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
