'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  Users,
  Briefcase,
  Globe,
  Search,
  Copy,
  Check,
  AppWindow,
  ShieldAlert,
  Sparkles,
  Maximize2,
  RefreshCw,
  Info,
  Star,
  FileText,
} from 'lucide-react';
import { CompanyRecord } from '../types/company';
import { buildPeopleUrl, buildJobsUrl, buildGoogleSearchUrl } from '../lib/slug-heuristics';

interface CompanyExplorerDrawerProps {
  company: CompanyRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onNotify: (msg: string) => void;
  isStarred?: boolean;
  onToggleStar?: () => void;
  notes?: string;
  onSaveNotes?: (notes: string) => void;
}

type TabType = 'people' | 'jobs' | 'careers' | 'iframe';

export const CompanyExplorerDrawer: React.FC<CompanyExplorerDrawerProps> = ({
  company,
  isOpen,
  onClose,
  onNotify,
  isStarred = false,
  onToggleStar,
  notes = '',
  onSaveNotes,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('people');
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [localNotes, setLocalNotes] = useState<string>(notes);

  useEffect(() => {
    if (company) {
      setActiveTab('people');
      setIframeKey((k) => k + 1);
      setLocalNotes(notes || '');
    }
  }, [company, notes]);

  if (!isOpen || !company) return null;

  const peopleUrl = buildPeopleUrl(company.slug);
  const jobsUrl = buildJobsUrl(company.slug);
  const careersUrl = company.careersUrl || '';
  const searchUrl = buildGoogleSearchUrl(company.name);

  const getActiveUrl = (): string => {
    switch (activeTab) {
      case 'people':
        return peopleUrl;
      case 'jobs':
        return jobsUrl;
      case 'careers':
        return careersUrl || peopleUrl;
      case 'iframe':
        return careersUrl || peopleUrl;
    }
  };

  const activeUrl = getActiveUrl();

  /**
   * Opens the targeted URL in a dedicated companion window.
   * Targeting 'LinkBuilderCompanion' ensures subsequent clicks update the same window!
   */
  const openCompanionWindow = (url: string) => {
    const width = 1100;
    const height = 850;
    const left = window.screen.width - width - 50;
    const top = 60;
    window.open(
      url,
      'LinkBuilderCompanion',
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=yes,status=no,resizable=yes,scrollbars=yes`
    );
    onNotify(`Opened ${company.name} in Companion Window!`);
  };

  const copyCurrentUrl = async () => {
    try {
      await navigator.clipboard.writeText(activeUrl);
      setCopiedUrl(true);
      onNotify('URL copied to clipboard!');
      setTimeout(() => setCopiedUrl(false), 1800);
    } catch {
      onNotify('Failed to copy URL');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '780px',
          height: '100%',
          backgroundColor: '#090D16',
          borderLeft: '1px solid rgba(99, 102, 241, 0.3)',
          borderTop: 'none',
          borderBottom: 'none',
          borderRight: 'none',
          borderRadius: 0,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.8)',
          animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.85)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: '1.1rem',
                flexShrink: 0,
              }}
            >
              {company.name.charAt(0)}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                  {company.name}
                </h2>
                {company.rank && (
                  <span
                    style={{
                      fontSize: '0.725rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    #{company.rank}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2px', flexWrap: 'wrap' }}>
                <span className="badge badge-category" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>
                  {company.category}
                </span>
                {company.subCategory && company.subCategory !== company.category && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    ({company.subCategory})
                  </span>
                )}
                <code style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8', fontSize: '0.75rem' }}>
                  {company.slug}
                </code>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {onToggleStar && (
              <button
                className={`star-btn ${isStarred ? 'starred' : ''}`}
                onClick={onToggleStar}
                aria-label={isStarred ? `Unstar ${company.name}` : `Star ${company.name}`}
                title={isStarred ? 'Starred (Click to remove)' : 'Add to Starred'}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: isStarred ? 'rgba(250, 204, 21, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Star size={16} fill={isStarred ? '#facc15' : 'transparent'} color={isStarred ? '#facc15' : 'var(--text-muted)'} />
              </button>
            )}

            <button
              onClick={() => openCompanionWindow(activeUrl)}
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.8rem', fontSize: '0.775rem' }}
              title="Open in dedicated companion popup window"
            >
              <AppWindow size={14} color="#38bdf8" />
              <span>Companion Window</span>
            </button>
            <button
              onClick={onClose}
              style={{
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
              }}
              title="Close drawer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'rgba(11, 17, 32, 0.95)',
            overflowX: 'auto',
          }}
        >
          <button
            onClick={() => setActiveTab('people')}
            className={`btn ${activeTab === 'people' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.775rem' }}
          >
            <Users size={14} /> People Page
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`btn ${activeTab === 'jobs' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.775rem' }}
          >
            <Briefcase size={14} /> Jobs Page
          </button>
          {careersUrl && (
            <button
              onClick={() => setActiveTab('careers')}
              className={`btn ${activeTab === 'careers' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.775rem' }}
            >
              <Globe size={14} /> Official Careers
            </button>
          )}
          <button
            onClick={() => setActiveTab('iframe')}
            className={`btn ${activeTab === 'iframe' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.775rem' }}
          >
            <AppWindow size={14} /> Embedded Frame View
          </button>
        </div>

        {/* URL Bar & Quick Actions */}
        <div
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              overflow: 'hidden',
              flex: 1,
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>Target:</span>
            <code
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: '#93c5fd',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {activeUrl}
            </code>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            <button
              className={`btn ${copiedUrl ? 'btn-success' : 'btn-outline'}`}
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
              onClick={copyCurrentUrl}
              title="Copy URL"
            >
              {copiedUrl ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
              <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
            </button>
            <a
              href={activeUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
            >
              <ExternalLink size={13} /> Open Tab
            </a>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {activeTab === 'iframe' ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
              {/* Informational banner about X-Frame-Options */}
              <div
                style={{
                  padding: '0.75rem 1.25rem',
                  backgroundColor: 'rgba(30, 41, 59, 0.85)',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  fontSize: '0.8rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Info size={15} color="#38bdf8" />
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Enterprise sites like LinkedIn enforce <code>X-Frame-Options: SAMEORIGIN</code>. If blocked by your browser, use Companion Window.
                  </span>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ padding: '0.3rem 0.7rem', fontSize: '0.725rem', whiteSpace: 'nowrap' }}
                  onClick={() => openCompanionWindow(activeUrl)}
                >
                  <AppWindow size={13} /> Launch Companion Window
                </button>
              </div>

              {/* Iframe View */}
              <iframe
                key={iframeKey}
                src={activeUrl}
                title={`${company.name} Live View`}
                style={{
                  width: '100%',
                  flex: 1,
                  border: 'none',
                  backgroundColor: '#ffffff',
                }}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
              />
            </div>
          ) : (
            /* Quick Dossier & Launchpad */
            <div style={{ padding: '2rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Private Notes & Scratchpad */}
              <div
                className="glass-card"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.625rem',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(251, 191, 36, 0.35)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#fde047', fontSize: '0.875rem' }}>
                    <FileText size={15} /> Private Notes & Outreach Context
                  </div>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Auto-saves to browser</span>
                </div>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="Add private notes (e.g. Referred by Sarah; Applied via Workday #8192; Follow-up next Tuesday)..."
                  value={localNotes}
                  onChange={(e) => {
                    setLocalNotes(e.target.value);
                    if (onSaveNotes) onSaveNotes(e.target.value);
                  }}
                  style={{ fontSize: '0.825rem', lineHeight: '1.45', backgroundColor: 'rgba(10, 15, 26, 0.95)' }}
                />
              </div>

              <div
                className="glass-card"
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                  backgroundColor: 'rgba(15, 23, 42, 0.75)',
                }}
              >
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} color="#06b6d4" />
                  Quick Launchpad for {company.name}
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  {/* People Card */}
                  <div
                    style={{
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(30, 41, 59, 0.6)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#93c5fd' }}>
                      <Users size={16} /> LinkedIn People Page
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Search current employees, decision makers, engineering leads, and recruiters at {company.name}.
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                      <button
                        className="btn btn-primary"
                        style={{ flex: 1, fontSize: '0.775rem', padding: '0.45rem' }}
                        onClick={() => openCompanionWindow(peopleUrl)}
                      >
                        <AppWindow size={13} /> Companion View
                      </button>
                      <a
                        href={peopleUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary"
                        style={{ fontSize: '0.775rem', padding: '0.45rem 0.75rem' }}
                      >
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  </div>

                  {/* Jobs Card */}
                  <div
                    style={{
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(30, 41, 59, 0.6)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#6ee7b7' }}>
                      <Briefcase size={16} /> LinkedIn Jobs Page
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Explore active job listings, recent hiring activity, and open roles at {company.name}.
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                      <button
                        className="btn btn-primary"
                        style={{ flex: 1, fontSize: '0.775rem', padding: '0.45rem' }}
                        onClick={() => openCompanionWindow(jobsUrl)}
                      >
                        <AppWindow size={13} /> Companion View
                      </button>
                      <a
                        href={jobsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary"
                        style={{ fontSize: '0.775rem', padding: '0.45rem 0.75rem' }}
                      >
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  </div>

                  {/* Official Careers Portal Card */}
                  {careersUrl && (
                    <div
                      style={{
                        padding: '1.25rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'rgba(30, 41, 59, 0.6)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#fcd34d' }}>
                        <Globe size={16} /> Official Careers Site
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Direct internal ATS/portal without LinkedIn middleman.
                      </p>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                        <button
                          className="btn btn-primary"
                          style={{ flex: 1, fontSize: '0.775rem', padding: '0.45rem' }}
                          onClick={() => {
                            setActiveTab('iframe');
                          }}
                        >
                          <AppWindow size={13} /> Embed in Frame
                        </button>
                        <a
                          href={careersUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary"
                          style={{ fontSize: '0.775rem', padding: '0.45rem 0.75rem' }}
                        >
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Google Search Verification Card */}
                  <div
                    style={{
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(30, 41, 59, 0.6)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#f472b6' }}>
                      <Search size={16} /> Google Slug Verification
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Search <code>site:linkedin.com/company &quot;{company.name}&quot;</code> on Google.
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                      <a
                        href={searchUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary"
                        style={{ flex: 1, fontSize: '0.775rem', padding: '0.45rem' }}
                      >
                        <Search size={13} /> Check on Google
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Side-by-side Companion Workflow Explanation */}
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.875rem',
                }}
              >
                <AppWindow size={20} color="#818cf8" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#a5b4fc' }}>
                    Why Companion Window Mode is Best for LinkedIn
                  </h4>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: '1.5' }}>
                    LinkedIn security headers block cross-origin iframe embedding to protect personal accounts. With the <strong>Companion Window</strong>, you get an anchored floating window next to your workspace that auto-updates whenever you click any company in Link Builder Pro!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
