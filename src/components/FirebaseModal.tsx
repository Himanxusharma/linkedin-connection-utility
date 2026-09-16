'use client';

import React, { useState } from 'react';
import { Database, Cloud, ExternalLink, X, CheckCircle2, ShieldCheck, Copy, Check } from 'lucide-react';
import { isFirebaseConfigured } from '../lib/firebase';

interface FirebaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  companiesCount: number;
}

export const FirebaseModal: React.FC<FirebaseModalProps> = ({
  isOpen,
  onClose,
  companiesCount,
}) => {
  const [copiedEnv, setCopiedEnv] = useState<boolean>(false);

  if (!isOpen) return null;

  const isConfigured = isFirebaseConfigured();

  const envSnippet = `NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id`;

  const copyEnvSnippet = async () => {
    try {
      await navigator.clipboard.writeText(envSnippet);
      setCopiedEnv(true);
      setTimeout(() => setCopiedEnv(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.82)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
      className="modal-overlay-responsive"
      onClick={onClose}
    >
      <div
        className="glass-card modal-dialog-responsive"
        style={{
          width: '100%',
          maxWidth: '620px',
          padding: '2rem',
          position: 'relative',
          backgroundColor: '#0B1120',
          borderColor: 'rgba(99, 102, 241, 0.35)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(99, 102, 241, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close dialog"
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
            }}
          >
            <Database size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>
              Google Cloud Firebase Firestore
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              Dual Storage Engine: Local Seed Dataset + Cloud Persistence
            </p>
          </div>
        </div>

        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: isConfigured ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)',
            border: `1px solid ${isConfigured ? 'rgba(16, 185, 129, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`,
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.875rem',
          }}
        >
          {isConfigured ? (
            <CheckCircle2 size={20} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
          ) : (
            <ShieldCheck size={20} color="#6366F1" style={{ flexShrink: 0, marginTop: '2px' }} />
          )}
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: isConfigured ? '#34D399' : '#A5B4FC' }}>
              {isConfigured ? 'Live Cloud Sync Connected' : 'Seed Dataset Mode Active'}
            </div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: '1.45' }}>
              {isConfigured
                ? 'Your application is actively querying and saving to Google Cloud Firestore.'
                : `Using bundled verified library with ${companiesCount} fintech companies. The app functions completely offline without any API keys.`}
            </div>
          </div>
        </div>

        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
          To connect your own free Firebase Firestore:
        </h4>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '0.875rem', lineHeight: '1.5' }}>
          Create a project at{' '}
          <a
            href="https://console.firebase.google.com"
            target="_blank"
            rel="noreferrer"
            style={{ color: '#38bdf8', textDecoration: 'underline' }}
          >
            console.firebase.google.com
          </a>
          , enable Cloud Firestore in test or web rules mode, and add these environment variables to your <code>.env.local</code> or Vercel:
        </p>

        <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
          <pre
            style={{
              backgroundColor: '#030712',
              borderRadius: 'var(--radius-md)',
              padding: '0.875rem 1rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.775rem',
              color: '#94a3b8',
              border: '1px solid var(--border-subtle)',
              lineHeight: '1.6',
              overflowX: 'auto',
            }}
          >
            {envSnippet}
          </pre>
          <button
            onClick={copyEnvSnippet}
            className={`btn ${copiedEnv ? 'btn-success' : 'btn-secondary'}`}
            style={{
              position: 'absolute',
              top: '0.5rem',
              right: '0.5rem',
              padding: '0.35rem 0.65rem',
              fontSize: '0.725rem',
            }}
          >
            {copiedEnv ? (
              <>
                <Check size={12} /> Copied!
              </>
            ) : (
              <>
                <Copy size={12} /> Copy Template
              </>
            )}
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
