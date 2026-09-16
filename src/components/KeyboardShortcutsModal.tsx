'use client';

import React, { useEffect } from 'react';
import { X, Keyboard, Zap, Search, Bookmark, CheckCircle2, MessageSquare, ArrowRight } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sections = [
    {
      title: 'Global Shortcuts',
      shortcuts: [
        { key: '⌘ K / Ctrl+K', desc: 'Focus company search bar' },
        { key: 'Shift + S', desc: 'Launch Turbo Speed-Run for current/selected companies' },
        { key: '?', desc: 'Toggle this keyboard shortcuts cheat sheet' },
        { key: 'Esc', desc: 'Close any active drawer, modal, or dismiss runner' },
      ],
    },
    {
      title: '⚡ Speed-Run Mode Hotkeys',
      shortcuts: [
        { key: 'Space / Enter', desc: 'Open target page + auto-copy personalized 300-char note' },
        { key: '1', desc: 'Mark as "Contacted" & advance to next target' },
        { key: '2', desc: 'Mark as "Applied" & advance to next target' },
        { key: '3', desc: 'Mark as "Connected" & advance to next target' },
        { key: 'C', desc: 'Copy 300-char note to clipboard without opening' },
        { key: 'N / →', desc: 'Skip to next queued target' },
        { key: 'P / ←', desc: 'Go back to previous queued target' },
      ],
    },
    {
      title: 'Catalog & CRM Actions',
      shortcuts: [
        { key: '⭐ Click Star', desc: 'Bookmark company to your dream shortlist' },
        { key: '📝 Notes', desc: 'Add private context, referral names, or job IDs' },
        { key: '🎯 Role Filter', desc: 'Generate URLs tailored to Recruiters, Engineers, or Custom titles' },
      ],
    },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.8)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        animation: 'fadeIn 0.18s ease',
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '88vh',
          backgroundColor: '#0a0f1d',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          borderRadius: 'var(--radius-xl)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 30px rgba(99, 102, 241, 0.2)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.9)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <Keyboard size={18} />
            </div>
            <div>
              <h2 id="shortcuts-modal-title" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                Keyboard Shortcuts & Power Controls
              </h2>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                Master Link Builder Pro without touching your mouse
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-outline"
            style={{ padding: '0.4rem', borderRadius: '50%', color: 'var(--text-muted)' }}
            aria-label="Close shortcuts dialog"
          >
            <X size={16} />
          </button>
        </div>

        {/* Shortcuts List */}
        <div
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {sections.map((sec, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#93c5fd',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {sec.title}
              </span>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  padding: '0.5rem',
                }}
              >
                {sec.shortcuts.map((sc, scIdx) => (
                  <div
                    key={scIdx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: scIdx % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                    }}
                  >
                    <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                      {sc.desc}
                    </span>
                    <kbd
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: 'rgba(30, 41, 59, 0.9)',
                        color: '#f8fafc',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-xs)',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.4)',
                      }}
                    >
                      {sc.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '0.875rem 1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.775rem',
            color: 'var(--text-muted)',
          }}
        >
          <span>Press <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: '3px' }}>?</kbd> anytime to reopen this cheatsheet</span>
          <button className="btn btn-secondary" onClick={onClose} style={{ fontSize: '0.75rem', padding: '0.35rem 0.8rem' }}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
