'use client';

import React, { useEffect } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled app error:', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        backgroundColor: '#030712',
        color: '#f8fafc',
      }}
    >
      <div
        className="glass-card"
        style={{
          maxWidth: '500px',
          padding: '2.5rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AlertCircle size={28} color="#ef4444" />
        </div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Something went wrong</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
          An unexpected error occurred while processing your data. You can retry the operation or refresh the page.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => reset()}
          style={{ marginTop: '0.5rem' }}
        >
          <RotateCcw size={15} /> Try Again
        </button>
      </div>
    </div>
  );
}
