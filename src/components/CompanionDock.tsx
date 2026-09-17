'use client';

import React, { useEffect, useState } from 'react';
import {
  AppWindow,
  Users,
  Briefcase,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Copy,
  Check,
  X,
  Sparkles,
  Maximize2,
  Minimize2,
  Smartphone,
} from 'lucide-react';
import { CompanyRecord, OutreachStatus } from '../types/company';
import { buildPeopleUrl, buildJobsUrl } from '../lib/slug-heuristics';
import { openOutreachUrl, LinkOpenMode, isMobileDevice } from '../lib/navigation';

interface CompanionDockProps {
  activeCompany: CompanyRecord | null;
  allCompanies: CompanyRecord[];
  onSelectCompany: (company: CompanyRecord) => void;
  outreachStatus: OutreachStatus;
  onUpdateStatus: (status: OutreachStatus) => void;
  onOpenMessageModal: (company: CompanyRecord) => void;
  targetRoleKeyword?: string;
  onNotify: (msg: string) => void;
  linkOpenMode: LinkOpenMode;
  onCloseDock: () => void;
}

export const CompanionDock: React.FC<CompanionDockProps> = ({
  activeCompany,
  allCompanies,
  onSelectCompany,
  outreachStatus,
  onUpdateStatus,
  onOpenMessageModal,
  targetRoleKeyword,
  onNotify,
  linkOpenMode,
  onCloseDock,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [copiedNote, setCopiedNote] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  // Global hotkeys for J (Next) and K (Prev)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;

      if (!activeCompany) return;

      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCompany, allCompanies]);

  if (!activeCompany) return null;

  const currentIndex = allCompanies.findIndex(
    (c) => (c.slug || c.name) === (activeCompany.slug || activeCompany.name)
  );

  const handleNext = () => {
    if (allCompanies.length === 0) return;
    const nextIdx = (currentIndex + 1) % allCompanies.length;
    const nextComp = allCompanies[nextIdx];
    onSelectCompany(nextComp);
    const peopleUrl = buildPeopleUrl(nextComp.slug, targetRoleKeyword);
    openOutreachUrl(peopleUrl, { mode: linkOpenMode, companyName: nextComp.name });
    onNotify(`Steered Companion to #${nextIdx + 1}: ${nextComp.name}`);
  };

  const handlePrev = () => {
    if (allCompanies.length === 0) return;
    const prevIdx = (currentIndex - 1 + allCompanies.length) % allCompanies.length;
    const prevComp = allCompanies[prevIdx];
    onSelectCompany(prevComp);
    const peopleUrl = buildPeopleUrl(prevComp.slug, targetRoleKeyword);
    openOutreachUrl(peopleUrl, { mode: linkOpenMode, companyName: prevComp.name });
    onNotify(`Steered Companion to #${prevIdx + 1}: ${prevComp.name}`);
  };

  const handleOpenLink = (type: 'people' | 'jobs' | 'careers') => {
    let url = '';
    if (type === 'people') {
      url = buildPeopleUrl(activeCompany.slug, targetRoleKeyword);
    } else if (type === 'jobs') {
      url = buildJobsUrl(activeCompany.slug);
    } else {
      url = activeCompany.careersUrl || buildJobsUrl(activeCompany.slug);
    }

    openOutreachUrl(url, { mode: linkOpenMode, companyName: activeCompany.name });
    onNotify(`Loaded ${activeCompany.name} ${type} in Companion!`);
  };

  const handleQuickCopyNote = async () => {
    const defaultRole = typeof window !== 'undefined' ? localStorage.getItem('linkbuilder_user_role') || 'Software Engineer' : 'Software Engineer';
    const note = `Hi [Name], loved following ${activeCompany.name}'s work in ${activeCompany.category.split('/')[0].trim()}. As a ${defaultRole} following your team's journey, I'd love to connect and keep in touch regarding open opportunities!`;
    try {
      await navigator.clipboard.writeText(note);
      setCopiedNote(true);
      onNotify('Note copied to clipboard!');
      setTimeout(() => setCopiedNote(false), 1600);
    } catch {
      onNotify('Failed to copy note');
    }
  };

  return (
    <div className="companion-dock-container">
      <div
        className="glass-card companion-dock-card"
        style={{
          backgroundColor: '#090d16',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(56, 189, 248, 0.15)',
          padding: isMinimized ? '0.65rem 1.25rem' : '0.85rem 1.25rem',
          transition: 'all 0.2s ease',
        }}
      >
        <div className="companion-dock-inner">
          {/* Active Company Badge & Mobile Header Controls */}
          <div className="companion-dock-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AppWindow size={18} color="#fff" />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Companion Active
                  </span>
                  {currentIndex >= 0 && (
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      S.No #{activeCompany.rank || (currentIndex + 1)} • {currentIndex + 1} of {allCompanies.length}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
                    {activeCompany.name}
                  </span>
                  <code style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                    {activeCompany.slug}
                  </code>
                </div>
              </div>
            </div>

            {/* Dock Controls */}
            <div className="companion-dock-controls" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                className="btn btn-outline"
                onClick={() => setIsMinimized(!isMinimized)}
                style={{ padding: '0.35rem', border: 'none', background: 'transparent' }}
                title={isMinimized ? 'Expand Dock' : 'Minimize Dock'}
              >
                {isMinimized ? <Maximize2 size={15} /> : <Minimize2 size={15} />}
              </button>
              <button
                className="btn btn-outline"
                onClick={onCloseDock}
                style={{ padding: '0.35rem', border: 'none', background: 'transparent' }}
                title="Close Companion Dock"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <div className="companion-dock-actions">
              {/* Steer Links */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'nowrap' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleOpenLink('people')}
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.76rem' }}
                  title="Load People page into companion window"
                >
                  <Users size={13} color="#38bdf8" /> People
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleOpenLink('jobs')}
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.76rem' }}
                  title="Load Jobs page into companion window"
                >
                  <Briefcase size={13} color="#a855f7" /> Jobs
                </button>
                {activeCompany.careersUrl && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleOpenLink('careers')}
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.76rem' }}
                    title="Load Official Careers page"
                  >
                    <ExternalLink size={13} color="#10b981" /> Careers
                  </button>
                )}
                {isMobile && (
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      const url = buildPeopleUrl(activeCompany.slug, targetRoleKeyword);
                      openOutreachUrl(url, { mode: linkOpenMode, companyName: activeCompany.name });
                      onNotify(`📱 Opening ${activeCompany.name} in LinkedIn App!`);
                    }}
                    style={{
                      padding: '0.35rem 0.65rem',
                      fontSize: '0.76rem',
                      background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                    }}
                    title="Launch directly into native LinkedIn Mobile App"
                  >
                    <Smartphone size={13} /> App
                  </button>
                )}
              </div>

              {/* Note Generator */}
              <button
                className={`btn ${copiedNote ? 'btn-success' : 'btn-outline'}`}
                onClick={handleQuickCopyNote}
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.76rem' }}
                title="Copy connection note with 1 click"
              >
                {copiedNote ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedNote ? 'Copied!' : 'Copy Note'}</span>
              </button>

              <button
                className="btn btn-outline"
                onClick={() => onOpenMessageModal(activeCompany)}
                style={{ padding: '0.35rem 0.55rem', fontSize: '0.76rem' }}
                title="Customize note template"
              >
                <Sparkles size={13} color="#facc15" />
              </button>

              {/* Pipeline Status Dropdown */}
              <select
                value={outreachStatus}
                onChange={(e) => onUpdateStatus(e.target.value as OutreachStatus)}
                className="select-field"
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  borderColor: 'var(--border-medium)',
                  color:
                    outreachStatus === 'connected'
                      ? '#34d399'
                      : outreachStatus === 'applied'
                      ? '#38bdf8'
                      : outreachStatus === 'contacted'
                      ? '#fbbf24'
                      : outreachStatus === 'reviewed'
                      ? '#a855f7'
                      : 'var(--text-muted)',
                  cursor: 'pointer',
                }}
                aria-label="Update pipeline status"
              >
                <option value="to_contact" style={{ backgroundColor: '#0f172a', color: '#94a3b8' }}>⚪ To Contact</option>
                <option value="reviewed" style={{ backgroundColor: '#0f172a', color: '#c084fc' }}>🟣 Reviewed</option>
                <option value="contacted" style={{ backgroundColor: '#0f172a', color: '#fde047' }}>🟡 Contacted</option>
                <option value="applied" style={{ backgroundColor: '#0f172a', color: '#38bdf8' }}>🔵 Applied</option>
                <option value="connected" style={{ backgroundColor: '#0f172a', color: '#34d399' }}>🟢 Connected</option>
              </select>

              {/* Prev / Next Steer Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={handlePrev}
                  style={{ padding: '0.35rem 0.55rem', fontSize: '0.76rem' }}
                  title="Previous Company [K]"
                  aria-label="Previous company"
                >
                  <ChevronLeft size={14} /> <span style={{ fontSize: '0.68rem', opacity: 0.7 }}>K</span>
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleNext}
                  style={{ padding: '0.35rem 0.55rem', fontSize: '0.76rem' }}
                  title="Next Company [J]"
                  aria-label="Next company"
                >
                  <span style={{ fontSize: '0.68rem', opacity: 0.7 }}>J</span> <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
