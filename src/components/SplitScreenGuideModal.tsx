'use client';

import React, { useState } from 'react';
import {
  X,
  Columns,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Keyboard,
  Monitor,
  Check,
  Zap,
  HelpCircle,
} from 'lucide-react';
import { launchSplitScreenLinkedIn, SPLIT_TAB_NAME, LinkOpenMode } from '../lib/navigation';

interface SplitScreenGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify: (msg: string) => void;
  onChangeLinkOpenMode?: (mode: LinkOpenMode) => void;
}

type PlatformTab = 'chrome' | 'macos' | 'windows';

export const SplitScreenGuideModal: React.FC<SplitScreenGuideModalProps> = ({
  isOpen,
  onClose,
  onNotify,
  onChangeLinkOpenMode,
}) => {
  const [activePlatform, setActivePlatform] = useState<PlatformTab>('chrome');
  const [isPaired, setIsPaired] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleLaunchAndPair = () => {
    launchSplitScreenLinkedIn();
    setIsPaired(true);
    if (onChangeLinkOpenMode) {
      onChangeLinkOpenMode('split');
    }
    onNotify('🚀 Launched LinkedIn in Split Tab ("' + SPLIT_TAB_NAME + '")!');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.85)',
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
          maxWidth: '720px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#0a0f1d',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: 'var(--radius-xl)',
          padding: '1.75rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 35px rgba(56, 189, 248, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '1.2rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(6, 182, 212, 0.35)',
                flexShrink: 0,
              }}
            >
              <Columns size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc' }}>
                  Chrome Split Screen Mode
                </h2>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                >
                  RECOMMENDED
                </span>
              </div>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Use Linkedin Utility on the left and LinkedIn on the right for zero popup glitches and zero tab clutter.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-outline"
            style={{ padding: '0.35rem', border: 'none', background: 'transparent' }}
            title="Close guide"
            aria-label="Close guide"
          >
            <X size={20} />
          </button>
        </div>

        {/* Why Split Screen? Callout */}
        <div
          style={{
            margin: '1.25rem 0',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <HelpCircle size={20} color="#38bdf8" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: '0.8rem', color: '#e0f2fe', lineHeight: 1.45 }}>
            <strong>Why Split Screen instead of floating popup windows?</strong> Modern browsers block floating popups or force them into background tabs. Split screen gives you a stable, side-by-side cockpit where every company link updates the LinkedIn tab <em>in place</em>.
          </p>
        </div>

        {/* Step 1: Quick Pair Button */}
        <div
          style={{
            padding: '1.25rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid var(--border-medium)',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>
                  Step 1
                </span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                  Launch & Pair Target LinkedIn Tab
                </h3>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Opens the dedicated LinkedIn workstation tab that Linkedin Utility will steer.
              </p>
            </div>

            <button
              onClick={handleLaunchAndPair}
              className="btn btn-primary"
              style={{
                padding: '0.65rem 1.25rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                background: isPaired
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                boxShadow: '0 4px 15px rgba(2, 132, 199, 0.4)',
                gap: '8px',
              }}
            >
              {isPaired ? <Check size={16} /> : <ExternalLink size={16} />}
              <span>{isPaired ? 'Linked! Click to Re-Open' : '🚀 Launch & Pair LinkedIn Tab'}</span>
            </button>
          </div>

          {isPaired && (
            <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#34d399' }}>
              <CheckCircle2 size={14} />
              <span>Target tab <code>{SPLIT_TAB_NAME}</code> is active. Now tile it to the right half of your screen!</span>
            </div>
          )}
        </div>

        {/* Step 2: Platform Selection Tabs */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>
              Step 2
            </span>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
              Position Windows Side-by-Side (Select Your System)
            </h3>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActivePlatform('chrome')}
              className={`btn ${activePlatform === 'chrome' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                fontSize: '0.8rem',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-md)',
              }}
            >
              🌐 Chrome & Edge Split Screen
            </button>
            <button
              onClick={() => setActivePlatform('macos')}
              className={`btn ${activePlatform === 'macos' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                fontSize: '0.8rem',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-md)',
              }}
            >
              🍎 macOS (Tile Windows)
            </button>
            <button
              onClick={() => setActivePlatform('windows')}
              className={`btn ${activePlatform === 'windows' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                fontSize: '0.8rem',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-md)',
              }}
            >
              🪟 Windows (Snap Assist)
            </button>
          </div>

          {/* Platform Step Content */}
          <div
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '1.5rem',
            }}
          >
            {activePlatform === 'chrome' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <span style={{ background: '#38bdf8', color: '#000', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>1</span>
                  <p style={{ fontSize: '0.825rem', color: '#e2e8f0', margin: 0 }}>
                    In Google Chrome or Microsoft Edge, drag the <strong>LinkedIn</strong> tab header to the right half of your window, or right-click the tab and choose <strong>"Add tab to new split screen"</strong> (or <strong>"Split screen"</strong> in Edge).
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <span style={{ background: '#38bdf8', color: '#000', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>2</span>
                  <p style={{ fontSize: '0.825rem', color: '#e2e8f0', margin: 0 }}>
                    Now both Linkedin Utility and LinkedIn will appear inside the <strong>same browser window side-by-side</strong>!
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <span style={{ background: '#38bdf8', color: '#000', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>3</span>
                  <p style={{ fontSize: '0.825rem', color: '#e2e8f0', margin: 0 }}>
                    Every company link (People, Jobs, Careers, Next/Prev) will update the LinkedIn pane smoothly in real time!
                  </p>
                </div>
              </div>
            )}

            {activePlatform === 'macos' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <span style={{ background: '#38bdf8', color: '#000', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>1</span>
                  <p style={{ fontSize: '0.825rem', color: '#e2e8f0', margin: 0 }}>
                    Hover your mouse over the <strong>green full-screen button 🟢</strong> at the top-left of this browser window.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <span style={{ background: '#38bdf8', color: '#000', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>2</span>
                  <p style={{ fontSize: '0.825rem', color: '#e2e8f0', margin: 0 }}>
                    Click <strong>"Tile Window to Left of Screen"</strong>.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <span style={{ background: '#38bdf8', color: '#000', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>3</span>
                  <p style={{ fontSize: '0.825rem', color: '#e2e8f0', margin: 0 }}>
                    Select the LinkedIn window on the other side to tile to the right. Both windows will lock into an ultra-productive split screen.
                  </p>
                </div>
              </div>
            )}

            {activePlatform === 'windows' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <span style={{ background: '#38bdf8', color: '#000', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>1</span>
                  <p style={{ fontSize: '0.825rem', color: '#e2e8f0', margin: 0 }}>
                    Click on the Linkedin Utility window and press: <kbd style={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '4px', padding: '2px 6px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>Win</kbd> + <kbd style={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '4px', padding: '2px 6px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>Left ⬅️</kbd>
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <span style={{ background: '#38bdf8', color: '#000', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>2</span>
                  <p style={{ fontSize: '0.825rem', color: '#e2e8f0', margin: 0 }}>
                    Click on the LinkedIn window and press: <kbd style={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '4px', padding: '2px 6px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>Win</kbd> + <kbd style={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '4px', padding: '2px 6px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>Right ➡️</kbd>
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <span style={{ background: '#38bdf8', color: '#000', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>3</span>
                  <p style={{ fontSize: '0.825rem', color: '#e2e8f0', margin: 0 }}>
                    Windows Snap Assist instantly aligns both apps 50/50 on your monitor.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 3: High Speed Outreach Hotkeys */}
        <div
          style={{
            padding: '1.25rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid var(--border-medium)',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem' }}>
            <Zap size={16} color="#facc15" />
            <h4 style={{ fontSize: '0.925rem', fontWeight: 700, color: '#f8fafc' }}>
              Speed-Run Outreach Flow
            </h4>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <kbd style={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '4px', padding: '2px 8px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#38bdf8' }}>J</kbd>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Next company (updates right pane)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <kbd style={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '4px', padding: '2px 8px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#38bdf8' }}>K</kbd>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Previous company</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#facc15', fontSize: '0.9rem' }}>★</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>1-Click Copy Note on left, paste on right</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button onClick={onClose} className="btn btn-primary" style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}>
            Got it, Let's Go!
          </button>
        </div>
      </div>
    </div>
  );
};
