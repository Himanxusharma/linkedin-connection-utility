'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Zap,
  X,
  ChevronLeft,
  ChevronRight,
  AppWindow,
  Copy,
  Check,
  Users,
  Briefcase,
  Globe,
  Keyboard,
  Sparkles,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { CompanyRecord, OutreachStatus } from '../types/company';
import {
  buildPeopleUrl,
  buildJobsUrl,
  TARGET_ROLE_OPTIONS,
} from '../lib/slug-heuristics';

interface SpeedRunRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: CompanyRecord[];
  outreachMap: Record<string, OutreachStatus>;
  onUpdateStatus: (companyKey: string, status: OutreachStatus) => void;
  onNotify: (msg: string) => void;
  initialRoleId?: string;
}

type DestinationType = 'people' | 'jobs' | 'careers';

export const SpeedRunRunnerModal: React.FC<SpeedRunRunnerModalProps> = ({
  isOpen,
  onClose,
  companies,
  outreachMap,
  onUpdateStatus,
  onNotify,
  initialRoleId = 'recruiters',
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedRoleId, setSelectedRoleId] = useState<string>(initialRoleId);
  const [destination, setDestination] = useState<DestinationType>('people');
  const [autoOpenCompanion, setAutoOpenCompanion] = useState<boolean>(true);
  const [copiedNote, setCopiedNote] = useState<boolean>(false);
  const [templateType, setTemplateType] = useState<'referral' | 'outreach' | 'alumni'>('outreach');
  const [userRole] = useState<string>('Software Engineer');

  // Reset index when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
    }
  }, [isOpen]);

  const currentCompany: CompanyRecord | undefined = companies[currentIndex];

  const currentRoleKeyword = useMemo(() => {
    const opt = TARGET_ROLE_OPTIONS.find((r) => r.id === selectedRoleId);
    return opt ? opt.keyword : '';
  }, [selectedRoleId]);

  const currentUrl = useMemo(() => {
    if (!currentCompany) return '';
    if (destination === 'people') {
      return buildPeopleUrl(currentCompany.slug, currentRoleKeyword);
    }
    if (destination === 'jobs') {
      return buildJobsUrl(currentCompany.slug);
    }
    return currentCompany.careersUrl || buildPeopleUrl(currentCompany.slug);
  }, [currentCompany, destination, currentRoleKeyword]);

  // Generate customized 300-char LinkedIn note
  const connectionNote = useMemo(() => {
    if (!currentCompany) return '';
    const compName = currentCompany.name;
    const sector = currentCompany.category || 'tech';

    if (templateType === 'referral') {
      const msg = `Hi [Name], I came across engineering opportunities at ${compName} and would love to connect! As a ${userRole} passionate about ${sector}, I'm keen to learn more about the team culture and share how I could contribute. Thanks!`;
      return msg.slice(0, 300);
    }

    if (templateType === 'alumni') {
      const msg = `Hi [Name], great to come across your profile at ${compName}! I'm a ${userRole} actively exploring career paths in ${sector}. Would love to connect and follow your journey at ${compName}. Best regards!`;
      return msg.slice(0, 300);
    }

    // Default outreach
    const msg = `Hi [Name], I've been following ${compName}'s remarkable growth in ${sector}. As a ${userRole}, I'd value the chance to connect with your team and keep in touch regarding future engineering & product initiatives!`;
    return msg.slice(0, 300);
  }, [currentCompany, templateType, userRole]);

  // Open / Update companion window
  const openOrUpdateCompanion = useCallback((url: string, notify = true) => {
    if (!url) return;
    const width = 1100;
    const height = 900;
    const left = window.screen.width - width - 40;
    const top = 50;

    window.open(
      url,
      'LinkBuilderCompanion',
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=yes,status=no,resizable=yes,scrollbars=yes`
    );
    if (notify && currentCompany) {
      onNotify(`Navigated companion window to ${currentCompany.name}!`);
    }
  }, [currentCompany, onNotify]);

  // Copy note to clipboard
  const copyNoteToClipboard = useCallback(async (notify = true) => {
    if (!connectionNote) return;
    try {
      await navigator.clipboard.writeText(connectionNote);
      setCopiedNote(true);
      if (notify) {
        onNotify('Copied 300-char note! Ready to paste into LinkedIn.');
      }
      setTimeout(() => setCopiedNote(false), 2000);
    } catch {
      onNotify('Clipboard copy blocked by browser');
    }
  }, [connectionNote, onNotify]);

  // Action: Open company + copy note together
  const handleLaunchAndCopy = useCallback(() => {
    if (!currentUrl) return;
    copyNoteToClipboard(false);
    openOrUpdateCompanion(currentUrl, false);
    onNotify(`🚀 Opened ${currentCompany?.name} & copied customized note!`);
  }, [currentUrl, currentCompany, copyNoteToClipboard, openOrUpdateCompanion, onNotify]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (currentIndex < companies.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      if (autoOpenCompanion) {
        const nextComp = companies[nextIdx];
        const nextUrl = destination === 'people'
          ? buildPeopleUrl(nextComp.slug, currentRoleKeyword)
          : destination === 'jobs'
          ? buildJobsUrl(nextComp.slug)
          : nextComp.careersUrl || buildPeopleUrl(nextComp.slug);
        openOrUpdateCompanion(nextUrl, false);
      }
    } else {
      onNotify('🎉 Speed-run completed for all queued companies!');
    }
  }, [currentIndex, companies, autoOpenCompanion, destination, currentRoleKeyword, openOrUpdateCompanion, onNotify]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      if (autoOpenCompanion) {
        const prevComp = companies[prevIdx];
        const prevUrl = destination === 'people'
          ? buildPeopleUrl(prevComp.slug, currentRoleKeyword)
          : destination === 'jobs'
          ? buildJobsUrl(prevComp.slug)
          : prevComp.careersUrl || buildPeopleUrl(prevComp.slug);
        openOrUpdateCompanion(prevUrl, false);
      }
    }
  }, [currentIndex, companies, autoOpenCompanion, destination, currentRoleKeyword, openOrUpdateCompanion]);

  // Status tagger with auto-advance
  const handleTagStatus = useCallback((status: OutreachStatus) => {
    if (!currentCompany) return;
    const key = currentCompany.slug || currentCompany.name;
    onUpdateStatus(key, status);
    onNotify(`Marked ${currentCompany.name} as ${status.replace('_', ' ')}!`);
    handleNext();
  }, [currentCompany, onUpdateStatus, onNotify, handleNext]);

  // Global Keyboard Shortcuts for Speed-Run
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleLaunchAndCopy();
        return;
      }

      if (e.key.toLowerCase() === 'n' || e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
        return;
      }

      if (e.key.toLowerCase() === 'p' || e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
        return;
      }

      if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        copyNoteToClipboard(true);
        return;
      }

      if (e.key === '1') {
        e.preventDefault();
        handleTagStatus('contacted');
        return;
      }

      if (e.key === '2') {
        e.preventDefault();
        handleTagStatus('applied');
        return;
      }

      if (e.key === '3') {
        e.preventDefault();
        handleTagStatus('connected');
        return;
      }

      if (e.key === '4') {
        e.preventDefault();
        handleTagStatus('to_contact');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleLaunchAndCopy, handleNext, handlePrev, copyNoteToClipboard, handleTagStatus, onClose]);

  if (!isOpen || companies.length === 0 || !currentCompany) return null;

  const currentStatus: OutreachStatus = outreachMap[currentCompany.slug || currentCompany.name] || 'to_contact';
  const progressPct = Math.round(((currentIndex + 1) / companies.length) * 100);

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
        animation: 'fadeIn 0.2s ease',
      }}
      className="modal-overlay-responsive"
      onClick={onClose}
    >
      <div
        className="glass-card modal-dialog-responsive"
        style={{
          width: '100%',
          maxWidth: '860px',
          maxHeight: '92vh',
          backgroundColor: '#090D16',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          borderRadius: 'var(--radius-xl)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 40px rgba(99, 102, 241, 0.2)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Speed-Run Banner & Progress Bar */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'linear-gradient(90deg, rgba(30, 27, 75, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.875rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #eab308 0%, #f59e0b 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000',
                  boxShadow: '0 0 15px rgba(234, 179, 8, 0.4)',
                }}
              >
                <Zap size={20} fill="#000" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                    Turbo Speed-Run Outreach
                  </h2>
                  <span
                    className="badge"
                    style={{
                      background: 'rgba(234, 179, 8, 0.15)',
                      color: '#facc15',
                      border: '1px solid rgba(234, 179, 8, 0.4)',
                      fontSize: '0.725rem',
                      fontWeight: 700,
                    }}
                  >
                    Anti-Block Mode
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Step through targets with auto-copy pitch notes, side-by-side companion window, and zero login blocks.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="btn btn-outline"
              style={{ padding: '0.4rem', borderRadius: '50%', color: 'var(--text-muted)' }}
              title="Close Runner (Esc)"
            >
              <X size={18} />
            </button>
          </div>

          {/* Stepper Progress Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem' }}>
              <span style={{ color: '#a5b4fc', fontWeight: 700 }}>
                Target {currentIndex + 1} of {companies.length} ({progressPct}%)
              </span>
              <span className="mobile-hide" style={{ color: 'var(--text-muted)' }}>
                Hotkeys: <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: '3px' }}>Space</kbd> Open & Copy • <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: '3px' }}>1-3</kbd> Tag Status • <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: '3px' }}>N</kbd> Next
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progressPct}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #6366f1 0%, #38bdf8 50%, #10b981 100%)',
                  transition: 'width 0.25s ease',
                  borderRadius: 'var(--radius-full)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Main Interactive Stage */}
        <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Active Company Hero Card */}
          <div
            className="glass-card"
            style={{
              padding: '1.25rem 1.5rem',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: '#fff',
                  flexShrink: 0,
                  boxShadow: '0 4px 15px rgba(79, 70, 229, 0.35)',
                }}
              >
                {currentCompany.name.charAt(0)}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>
                    {currentCompany.name}
                  </h3>
                  {currentCompany.rank && (
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                      }}
                    >
                      #{currentCompany.rank}
                    </span>
                  )}
                  <span className="badge badge-category" style={{ fontSize: '0.75rem' }}>
                    {currentCompany.category}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '4px' }}>
                  <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.775rem', color: '#38bdf8' }}>
                    linkedin.com/company/{currentCompany.slug}
                  </code>
                  {currentCompany.careersUrl && (
                    <a
                      href={currentCompany.careersUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '3px', textDecoration: 'none' }}
                    >
                      <Globe size={12} /> Careers Site
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Current Outreach Status Badge */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Pipeline Status
              </span>
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  padding: '0.25rem 0.65rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor:
                    currentStatus === 'connected'
                      ? 'rgba(16, 185, 129, 0.2)'
                      : currentStatus === 'applied'
                      ? 'rgba(139, 92, 246, 0.2)'
                      : currentStatus === 'contacted'
                      ? 'rgba(234, 179, 8, 0.2)'
                      : 'rgba(148, 163, 184, 0.15)',
                  color:
                    currentStatus === 'connected'
                      ? '#34d399'
                      : currentStatus === 'applied'
                      ? '#c084fc'
                      : currentStatus === 'contacted'
                      ? '#fde047'
                      : '#cbd5e1',
                  border: '1px solid currentColor',
                }}
              >
                {currentStatus.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>

          {/* Quick Target Configuration (Role + Destination) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: '0.875rem',
            }}
          >
            {/* Target Role Selector */}
            <div
              style={{
                padding: '0.875rem 1rem',
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                🎯 Target Persona
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {TARGET_ROLE_OPTIONS.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRoleId(role.id)}
                    style={{
                      background: selectedRoleId === role.id ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                      color: selectedRoleId === role.id ? '#a5b4fc' : 'var(--text-secondary)',
                      border: selectedRoleId === role.id ? '1px solid #818cf8' : '1px solid transparent',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.25rem 0.6rem',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontWeight: selectedRoleId === role.id ? 700 : 500,
                    }}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Destination Switcher */}
            <div
              style={{
                padding: '0.875rem 1rem',
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                📍 Destination Page
              </span>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  onClick={() => setDestination('people')}
                  style={{
                    flex: 1,
                    background: destination === 'people' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    color: destination === 'people' ? '#7dd3fc' : 'var(--text-secondary)',
                    border: destination === 'people' ? '1px solid #38bdf8' : '1px solid transparent',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.3rem',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <Users size={13} /> People
                </button>
                <button
                  onClick={() => setDestination('jobs')}
                  style={{
                    flex: 1,
                    background: destination === 'jobs' ? 'rgba(52, 211, 153, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    color: destination === 'jobs' ? '#6ee7b7' : 'var(--text-secondary)',
                    border: destination === 'jobs' ? '1px solid #34d399' : '1px solid transparent',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.3rem',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <Briefcase size={13} /> Jobs
                </button>
                {currentCompany.careersUrl && (
                  <button
                    onClick={() => setDestination('careers')}
                    style={{
                      flex: 1,
                      background: destination === 'careers' ? 'rgba(251, 191, 36, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                      color: destination === 'careers' ? '#fde047' : 'var(--text-secondary)',
                      border: destination === 'careers' ? '1px solid #fbbf24' : '1px solid transparent',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.3rem',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                    }}
                  >
                    <Globe size={13} /> ATS
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 300-Char Auto-Copy Connection Note Box */}
          <div
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'rgba(20, 29, 47, 0.7)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={16} color="#38bdf8" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0' }}>
                  Personalized 300-Char LinkedIn Connection Note
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.725rem',
                    color: connectionNote.length <= 300 ? '#34d399' : '#f87171',
                    fontWeight: 700,
                  }}
                >
                  {connectionNote.length}/300 chars
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  onClick={() => setTemplateType(templateType === 'outreach' ? 'referral' : templateType === 'referral' ? 'alumni' : 'outreach')}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.725rem',
                    cursor: 'pointer',
                  }}
                >
                  Template: <strong>{templateType}</strong>
                </button>
                <button
                  onClick={() => copyNoteToClipboard(true)}
                  className={`btn ${copiedNote ? 'btn-success' : 'btn-outline'}`}
                  style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                >
                  {copiedNote ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedNote ? 'Copied!' : 'Copy Note [C]'}</span>
                </button>
              </div>
            </div>

            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(10, 15, 26, 0.95)',
                border: '1px solid var(--border-subtle)',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.825rem',
                color: '#cbd5e1',
                lineHeight: '1.5',
              }}
            >
              {connectionNote}
            </div>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
              ⚡ Hitting <strong>[Space]</strong> or <strong>Open Target</strong> copies this note instantly to your clipboard so you can just paste into LinkedIn.
            </span>
          </div>

          {/* Primary Action Bar: Launch Target + Companion Toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
              padding: '0.5rem 0',
            }}
          >
            {/* Auto-Companion Toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={autoOpenCompanion}
                onChange={(e) => setAutoOpenCompanion(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#6366f1', cursor: 'pointer' }}
              />
              <span>Auto-navigate <strong>Companion Window</strong> on Next/Prev</span>
            </label>

            {/* Launch Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <button
                className="btn btn-secondary"
                onClick={() => openOrUpdateCompanion(currentUrl, true)}
                style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem' }}
                title="Launch anchored side-by-side window"
              >
                <AppWindow size={15} color="#38bdf8" />
                <span>Companion Window</span>
              </button>

              <button
                className="btn btn-primary"
                onClick={handleLaunchAndCopy}
                style={{
                  fontSize: '0.85rem',
                  padding: '0.55rem 1.25rem',
                  background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                  boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
                }}
              >
                <Zap size={16} fill="#fff" />
                <span>Open & Copy Note [Space]</span>
              </button>
            </div>
          </div>

          {/* Rapid Status Tagger Buttons */}
          <div
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(30, 41, 59, 0.4)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.625rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                ⚡ 1-CLICK PIPELINE UPDATE & ADVANCE
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Clicking or pressing [1-3] saves status and moves to next company
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))', gap: '0.5rem' }}>
              <button
                onClick={() => handleTagStatus('contacted')}
                className="btn"
                style={{
                  backgroundColor: 'rgba(234, 179, 8, 0.15)',
                  border: '1px solid rgba(234, 179, 8, 0.4)',
                  color: '#facc15',
                  fontSize: '0.775rem',
                  padding: '0.5rem',
                  justifyContent: 'center',
                }}
              >
                <Send size={13} />
                <span>[1] Contacted</span>
              </button>

              <button
                onClick={() => handleTagStatus('applied')}
                className="btn"
                style={{
                  backgroundColor: 'rgba(168, 85, 247, 0.15)',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  color: '#c084fc',
                  fontSize: '0.775rem',
                  padding: '0.5rem',
                  justifyContent: 'center',
                }}
              >
                <Briefcase size={13} />
                <span>[2] Applied</span>
              </button>

              <button
                onClick={() => handleTagStatus('connected')}
                className="btn"
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  color: '#34d399',
                  fontSize: '0.775rem',
                  padding: '0.5rem',
                  justifyContent: 'center',
                }}
              >
                <ShieldCheck size={13} />
                <span>[3] Connected</span>
              </button>

              <button
                onClick={handleNext}
                className="btn btn-secondary"
                style={{
                  fontSize: '0.775rem',
                  padding: '0.5rem',
                  justifyContent: 'center',
                }}
              >
                <ChevronRight size={14} />
                <span>[N] Skip / Next</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Navigation Bar */}
        <div
          style={{
            padding: '1rem 1.75rem',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="btn btn-secondary"
            style={{
              fontSize: '0.8rem',
              padding: '0.45rem 0.9rem',
              opacity: currentIndex === 0 ? 0.4 : 1,
              cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            <ChevronLeft size={16} />
            <span>Previous [P]</span>
          </button>

          <div className="mobile-hide" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <Keyboard size={14} color="#818cf8" />
            <span>Arrow Keys, Spacebar, & 1-3 keys are active</span>
          </div>

          <button
            onClick={handleNext}
            disabled={currentIndex === companies.length - 1}
            className="btn btn-primary"
            style={{
              fontSize: '0.8rem',
              padding: '0.45rem 1rem',
              opacity: currentIndex === companies.length - 1 ? 0.4 : 1,
              cursor: currentIndex === companies.length - 1 ? 'not-allowed' : 'pointer',
            }}
          >
            <span>Next Target [N]</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
