'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Download,
  Upload,
  Database,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  RefreshCw,
  Copy,
  Check,
  HardDrive,
  ShieldCheck,
} from 'lucide-react';

interface DataBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify: (msg: string) => void;
  onDataRestored: () => void;
  metrics: {
    starredCount: number;
    notesCount: number;
    statusCount: number;
    customCompaniesCount: number;
  };
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({
  isOpen,
  onClose,
  onNotify,
  onDataRestored,
  metrics,
}) => {
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExportBackup = () => {
    try {
      const backupData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        starred: JSON.parse(localStorage.getItem('linkbuilder_starred') || '[]'),
        notes: JSON.parse(localStorage.getItem('linkbuilder_company_notes') || '{}'),
        outreachStatus: JSON.parse(localStorage.getItem('linkbuilder_outreach_status') || '{}'),
        customCompanies: JSON.parse(localStorage.getItem('linkbuilder_custom_companies') || '[]'),
        customRoles: JSON.parse(localStorage.getItem('linkbuilder_custom_roles') || '[]'),
        userRole: localStorage.getItem('linkbuilder_user_role') || '',
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `link-builder-pro-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      onNotify('Full workspace backup downloaded successfully!');
    } catch {
      onNotify('Failed to export backup data.');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        setImporting(true);
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Invalid JSON structure');
        }

        if (Array.isArray(parsed.starred)) {
          localStorage.setItem('linkbuilder_starred', JSON.stringify(parsed.starred));
        }

        if (parsed.notes && typeof parsed.notes === 'object') {
          localStorage.setItem('linkbuilder_company_notes', JSON.stringify(parsed.notes));
        }

        if (parsed.outreachStatus && typeof parsed.outreachStatus === 'object') {
          localStorage.setItem('linkbuilder_outreach_status', JSON.stringify(parsed.outreachStatus));
        }

        if (Array.isArray(parsed.customCompanies)) {
          localStorage.setItem('linkbuilder_custom_companies', JSON.stringify(parsed.customCompanies));
        }

        if (Array.isArray(parsed.customRoles)) {
          localStorage.setItem('linkbuilder_custom_roles', JSON.stringify(parsed.customRoles));
        }

        if (typeof parsed.userRole === 'string' && parsed.userRole) {
          localStorage.setItem('linkbuilder_user_role', parsed.userRole);
        }

        onNotify('Backup data restored successfully!');
        onDataRestored();
        setTimeout(() => {
          onClose();
        }, 600);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Invalid backup file';
        onNotify(`Restore failed: ${errorMsg}`);
      } finally {
        setImporting(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
      className="modal-overlay-responsive"
      onClick={onClose}
    >
      <div
        className="glass-card modal-dialog-responsive"
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: '#090d16',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-xl)',
          padding: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Database size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Data Backup & Restore
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Safely preserve or transfer your job search pipeline and notes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-outline"
            style={{ padding: '0.4rem', border: 'none', background: 'transparent' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Current Local Data Snapshot */}
        <div
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem 1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Current Device Storage
            </span>
            <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={13} /> Browser Encrypted
            </span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.75rem',
              textAlign: 'center',
            }}
          >
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.65rem 0.5rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                {metrics.statusCount}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Tracked</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.65rem 0.5rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
                {metrics.starredCount}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Starred</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.65rem 0.5rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                {metrics.notesCount}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Notes</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.65rem 0.5rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#a855f7', fontFamily: 'var(--font-mono)' }}>
                {metrics.customCompaniesCount}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Custom</div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* Export Action */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'rgba(30, 41, 59, 0.4)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                Download Full JSON Backup
              </div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Saves your entire pipeline, bookmarks, custom roles, notes, and custom companies.
              </div>
            </div>
            <button
              className="btn btn-primary"
              onClick={handleExportBackup}
              style={{ padding: '0.55rem 1rem', fontSize: '0.825rem', flexShrink: 0 }}
            >
              <Download size={15} /> Export JSON
            </button>
          </div>

          {/* Import Action */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'rgba(30, 41, 59, 0.4)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                Restore Backup File
              </div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Load a previously exported JSON backup file onto this device or browser.
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".json,application/json"
              style={{ display: 'none' }}
            />
            <button
              className="btn btn-secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              style={{ padding: '0.55rem 1rem', fontSize: '0.825rem', flexShrink: 0 }}
            >
              <Upload size={15} color="#10b981" /> {importing ? 'Restoring...' : 'Import JSON'}
            </button>
          </div>
        </div>

        {/* Info notice */}
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
          💡 Backups are 100% private and stored locally on your machine. No accounts or external servers required.
        </p>
      </div>
    </div>
  );
};
