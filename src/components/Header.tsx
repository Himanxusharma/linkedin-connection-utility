'use client';

import React from 'react';
import {
  Sparkles,
  Database,
  Layers,
  Building2,
  Cloud,
  FileSpreadsheet,
  ShieldCheck,
  Zap,
  Keyboard,
} from 'lucide-react';
import { isFirebaseConfigured } from '../lib/firebase';

interface HeaderProps {
  activeTab: 'catalog' | 'workspace';
  onSelectTab: (tab: 'catalog' | 'workspace') => void;
  totalCompanies: number;
  totalCategories: number;
  onOpenFirebaseModal: () => void;
  onOpenShortcuts?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  totalCompanies,
  totalCategories,
  onOpenFirebaseModal,
  onOpenShortcuts,
}) => {
  const isCloud = isFirebaseConfigured();

  return (
    <header style={{ borderBottom: '1px solid var(--border-subtle)', padding: '1.25rem 0', marginBottom: '2rem' }}>
      <div className="container">
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.25rem',
          }}
        >
          {/* Logo & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
                flexShrink: 0,
              }}
            >
              <Sparkles size={24} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.025em', color: '#f8fafc' }}>
                  Link Builder <span style={{ color: '#38bdf8' }}>Pro</span>
                </h1>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.55rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(99, 102, 241, 0.16)',
                    color: '#a5b4fc',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    letterSpacing: '0.04em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Zap size={11} color="#818cf8" /> NEXT.JS 15
                </span>
              </div>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                LinkedIn People, Jobs & Careers link generator with pre-verified fintech database
              </p>
            </div>
          </div>

          {/* Quick Metrics & Cloud Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.825rem',
              }}
            >
              <Building2 size={16} color="#06b6d4" />
              <span style={{ color: 'var(--text-muted)' }}>Catalog:</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {totalCompanies}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.825rem',
              }}
            >
              <Layers size={16} color="#a855f7" />
              <span style={{ color: 'var(--text-muted)' }}>Categories:</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {totalCategories}
              </span>
            </div>

            <button
              onClick={onOpenFirebaseModal}
              className="btn btn-secondary"
              style={{
                padding: '0.45rem 0.85rem',
                fontSize: '0.825rem',
                borderColor: isCloud ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.3)',
              }}
              title="Click to view database connection status"
            >
              {isCloud ? (
                <>
                  <Cloud size={15} color="#10b981" />
                  <span style={{ color: '#34d399' }}>Firebase Live</span>
                </>
              ) : (
                <>
                  <Database size={15} color="#f59e0b" />
                  <span>Seed Mode (Offline Ready)</span>
                </>
              )}
            </button>

            {onOpenShortcuts && (
              <button
                onClick={onOpenShortcuts}
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.8rem', fontSize: '0.825rem' }}
                title="View Keyboard Shortcuts (?)"
                aria-label="View Keyboard Shortcuts"
              >
                <Keyboard size={15} color="#38bdf8" />
                <span>Shortcuts</span>
                <kbd
                  style={{
                    fontSize: '0.7rem',
                    fontFamily: 'var(--font-mono)',
                    background: 'rgba(255,255,255,0.12)',
                    padding: '1px 5px',
                    borderRadius: '3px',
                  }}
                >
                  ?
                </kbd>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          role="tablist"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginTop: '1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '0.25rem',
          }}
        >
          <button
            role="tab"
            aria-selected={activeTab === 'catalog'}
            onClick={() => onSelectTab('catalog')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.25rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'catalog' ? '2px solid #6366f1' : '2px solid transparent',
              color: activeTab === 'catalog' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Layers size={18} color={activeTab === 'catalog' ? '#6366f1' : 'var(--text-muted)'} />
            Pre-Verified Catalog & Filters
            <span
              style={{
                fontSize: '0.725rem',
                padding: '0.15rem 0.5rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: activeTab === 'catalog' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                color: activeTab === 'catalog' ? '#a5b4fc' : 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {totalCompanies}
            </span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'workspace'}
            onClick={() => onSelectTab('workspace')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.25rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'workspace' ? '2px solid #06b6d4' : '2px solid transparent',
              color: activeTab === 'workspace' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <FileSpreadsheet size={18} color={activeTab === 'workspace' ? '#06b6d4' : 'var(--text-muted)'} />
            Custom Link Builder Workspace
          </button>
        </div>
      </div>
    </header>
  );
};
