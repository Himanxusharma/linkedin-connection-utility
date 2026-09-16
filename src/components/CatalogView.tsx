'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Users,
  Briefcase,
  ExternalLink,
  Copy,
  Download,
  Check,
  Building,
  Filter,
  Globe,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Sparkles,
  CheckCircle2,
  AppWindow,
  MessageSquare,
  UserCheck,
  BriefcaseBusiness,
  Layers,
  FileSpreadsheet,
  FileCode,
  Layers3,
  Zap,
  Star,
  FileText,
  Plus,
  Target,
} from 'lucide-react';
import Papa from 'papaparse';
import { CompanyRecord, OutreachStatus } from '../types/company';
import {
  buildPeopleUrl,
  buildJobsUrl,
  buildGoogleSearchUrl,
  TARGET_ROLE_OPTIONS,
} from '../lib/slug-heuristics';
import { LinkOpenMode, getLinkTargetAttribute, openOutreachUrl } from '../lib/navigation';
import { OutreachMessageModal } from './OutreachMessageModal';
import { SpeedRunRunnerModal } from './SpeedRunRunnerModal';

interface CatalogViewProps {
  companies: CompanyRecord[];
  onNotify: (msg: string) => void;
  onSendToWorkspace: (companyNames: string[]) => void;
  onExploreCompany?: (company: CompanyRecord) => void;
  starredSet?: Set<string>;
  onToggleStar?: (companyKey: string) => void;
  onBatchToggleStar?: (companyKeys: string[], star: boolean) => void;
  notesMap?: Record<string, string>;
  onUpdateNotes?: (companyKey: string, noteText: string) => void;
  outreachMap?: Record<string, OutreachStatus>;
  onUpdateOutreachStatus?: (companyKey: string, status: OutreachStatus) => void;
  onBatchUpdateOutreachStatus?: (companyKeys: string[], status: OutreachStatus) => void;
  linkOpenMode?: LinkOpenMode;
  onOpenUrl?: (url: string, company?: CompanyRecord) => void;
  activeCompanionSlug?: string;
}

type SortField = 'rank' | 'name' | 'category' | 'status';
type SortOrder = 'asc' | 'desc';

export const CatalogView: React.FC<CatalogViewProps> = ({
  companies,
  onNotify,
  onSendToWorkspace,
  onExploreCompany,
  starredSet,
  onToggleStar,
  onBatchToggleStar,
  notesMap,
  onUpdateNotes,
  outreachMap: propOutreachMap,
  onUpdateOutreachStatus,
  onBatchUpdateOutreachStatus,
  linkOpenMode = 'companion',
  onOpenUrl,
  activeCompanionSlug,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Target role filter state
  const [selectedRoleId, setSelectedRoleId] = useState<string>('all');
  const [customRoleInput, setCustomRoleInput] = useState<string>('');
  const [customRoleOptions, setCustomRoleOptions] = useState<string[]>([]);
  const [isAddingCustomRole, setIsAddingCustomRole] = useState<boolean>(false);

  // Starred filter state
  const [showStarredOnly, setShowStarredOnly] = useState<boolean>(false);

  // Outreach status state (persisted in localStorage)
  const [outreachMap, setOutreachMap] = useState<Record<string, OutreachStatus>>({});
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Message modal state
  const [messageCompany, setMessageCompany] = useState<CompanyRecord | null>(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState<boolean>(false);

  // Speed-Run Runner state
  const [isSpeedRunOpen, setIsSpeedRunOpen] = useState<boolean>(false);
  const [speedRunCompanies, setSpeedRunCompanies] = useState<CompanyRecord[]>([]);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Load outreach statuses & custom roles from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('linkbuilder_outreach_status');
      if (saved) setOutreachMap(JSON.parse(saved));

      const savedRoles = localStorage.getItem('linkbuilder_custom_roles');
      if (savedRoles) setCustomRoleOptions(JSON.parse(savedRoles));
    } catch {
      // ignore
    }
  }, []);

  const handleAddCustomRole = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customRoleInput.trim();
    if (!trimmed) return;
    const nextRoles = Array.from(new Set([...customRoleOptions, trimmed]));
    setCustomRoleOptions(nextRoles);
    try {
      localStorage.setItem('linkbuilder_custom_roles', JSON.stringify(nextRoles));
    } catch {}
    setSelectedRoleId(`custom:${trimmed}`);
    setCustomRoleInput('');
    setIsAddingCustomRole(false);
    onNotify(`Target role set to custom: "${trimmed}"`);
  };

  // Effective active outreach map
  const activeOutreachMap = propOutreachMap || outreachMap;

  // Funnel analytics
  const funnelMetrics = useMemo(() => {
    let toContact = 0;
    let reviewed = 0;
    let contacted = 0;
    let applied = 0;
    let connected = 0;
    companies.forEach((c) => {
      const st = activeOutreachMap[c.slug || c.name] || 'to_contact';
      if (st === 'reviewed') reviewed++;
      else if (st === 'contacted') contacted++;
      else if (st === 'applied') applied++;
      else if (st === 'connected') connected++;
      else toContact++;
    });
    const totalOutreach = contacted + applied + connected;
    return { toContact, reviewed, contacted, applied, connected, totalOutreach };
  }, [companies, activeOutreachMap]);

  const handleUpdateStatus = (companyKey: string, status: OutreachStatus) => {
    if (onUpdateOutreachStatus) {
      onUpdateOutreachStatus(companyKey, status);
    } else {
      const next = { ...activeOutreachMap, [companyKey]: status };
      setOutreachMap(next);
      try {
        localStorage.setItem('linkbuilder_outreach_status', JSON.stringify(next));
      } catch {
        // ignore
      }
      onNotify(`Status updated to ${status.replace('_', ' ')}!`);
    }
  };

  const handleNavigateUrl = (e: React.MouseEvent, url: string, company: CompanyRecord) => {
    if (e) e.preventDefault();
    if (onOpenUrl) {
      onOpenUrl(url, company);
    } else {
      openOutreachUrl(url, { mode: linkOpenMode, companyName: company.name });
    }
  };

  const getSelectedRecords = (): CompanyRecord[] => {
    return companies.filter((c) => selectedIds.has(c.id || c.name));
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    companies.forEach((c) => {
      if (c.category) {
        const primary = c.category.trim();
        map.set(primary, (map.get(primary) || 0) + 1);
      }
    });
    return map;
  }, [companies]);

  const categories = useMemo(() => {
    const priority = [
      'All',
      'Fintech & Payments',
      'Banking & Neobanks',
      'Enterprise SaaS',
      'Big Tech',
      'AI & Semiconductors',
      'Cybersecurity & Infrastructure',
      'E-Commerce & Consumer',
      'Crypto & Web3',
    ];
    const present = Array.from(categoryCounts.keys());
    const sorted = priority.filter((p) => p === 'All' || present.includes(p));
    present.forEach((p) => {
      if (!sorted.includes(p)) sorted.push(p);
    });
    return sorted;
  }, [categoryCounts]);

  // Current role keyword
  const currentRoleKeyword = useMemo(() => {
    if (selectedRoleId.startsWith('custom:')) {
      return selectedRoleId.replace('custom:', '');
    }
    const opt = TARGET_ROLE_OPTIONS.find((r) => r.id === selectedRoleId);
    return opt ? opt.keyword : '';
  }, [selectedRoleId]);

  // Filtering & Sorting
  const filteredCompanies = useMemo(() => {
    const filtered = companies.filter((c) => {
      const compKey = c.slug || c.name;
      if (showStarredOnly && (!starredSet || !starredSet.has(compKey))) {
        return false;
      }

      const matchesCategory =
        selectedCategory === 'All' ||
        c.category.toLowerCase() === selectedCategory.toLowerCase();
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q);

      const status = activeOutreachMap[compKey] || 'to_contact';
      const matchesStatus =
        selectedStatusFilter === 'all' || status === selectedStatusFilter;

      return matchesCategory && matchesSearch && matchesStatus;
    });

    return filtered.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'rank') {
        const rankA = a.rank ?? 9999;
        const rankB = b.rank ?? 9999;
        comparison = rankA - rankB;
      } else if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'category') {
        comparison = a.category.localeCompare(b.category);
      } else if (sortField === 'status') {
        const statA = activeOutreachMap[a.slug || a.name] || 'to_contact';
        const statB = activeOutreachMap[b.slug || b.name] || 'to_contact';
        comparison = statA.localeCompare(statB);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [companies, selectedCategory, searchQuery, selectedStatusFilter, sortField, sortOrder, activeOutreachMap]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredCompanies.map((c) => c.id || c.name));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const startSpeedRun = (subset?: CompanyRecord[]) => {
    const list = subset && subset.length > 0 ? subset : filteredCompanies;
    if (list.length === 0) {
      onNotify('No companies found matching current filters to speed-run!');
      return;
    }
    setSpeedRunCompanies(list);
    setIsSpeedRunOpen(true);
    onNotify(`⚡ Starting Speed-Run for ${list.length} companies!`);
  };

  // Keyboard shortcuts (Cmd+K for search, Shift+S for speed run)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        const selected = companies.filter((c) => selectedIds.has(c.id || c.name));
        startSpeedRun(selected.length > 0 ? selected : filteredCompanies);
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [companies, selectedIds, filteredCompanies]);

  const copyToClipboard = async (text: string, label: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      onNotify(`${label} copied to clipboard!`);
      setTimeout(() => {
        setCopiedKey((curr) => (curr === key ? null : curr));
      }, 1800);
    } catch {
      onNotify(`Failed to copy to clipboard`);
    }
  };

  const exportFilteredCsv = (recordsToExport: CompanyRecord[]) => {
    const rows = recordsToExport.map((c) => {
      const compKey = c.slug || c.name;
      return {
        Rank: c.rank || '',
        Company: c.name,
        Starred: starredSet && starredSet.has(compKey) ? 'Yes' : 'No',
        Category: c.category,
        Slug: c.slug,
        'Outreach Status': (activeOutreachMap[compKey] || 'to_contact').replace('_', ' '),
        'Private Notes': notesMap ? notesMap[compKey] || '' : '',
        'People Link': buildPeopleUrl(c.slug, currentRoleKeyword),
        'Jobs Link': buildJobsUrl(c.slug),
        'Careers Link': c.careersUrl || '',
        'LinkedIn URL': c.linkedInUrl || '',
      };
    });

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `companies-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify(`Exported ${recordsToExport.length} companies to CSV!`);
  };

  const copyAsGoogleSheetsTsv = async (records: CompanyRecord[]) => {
    const headers = ['Rank', 'Company', 'Starred', 'Category', 'Slug', 'Status', 'Notes', 'People Link', 'Jobs Link', 'Careers'];
    const lines = records.map((c) => {
      const compKey = c.slug || c.name;
      return [
        c.rank || '',
        c.name,
        starredSet && starredSet.has(compKey) ? '★' : '',
        c.category,
        c.slug,
        activeOutreachMap[compKey] || 'to_contact',
        notesMap ? notesMap[compKey] || '' : '',
        buildPeopleUrl(c.slug, currentRoleKeyword),
        buildJobsUrl(c.slug),
        c.careersUrl || '',
      ].join('\t');
    });
    const tsv = [headers.join('\t'), ...lines].join('\n');
    await copyToClipboard(tsv, `${records.length} rows for Google Sheets (TSV)`, 'tsv-export');
  };

  const copyAsMarkdownTable = async (records: CompanyRecord[]) => {
    const header = '| Rank | Company | Category | People Link | Jobs Link |\n|---|---|---|---|---|';
    const lines = records.map((c) => {
      const pUrl = buildPeopleUrl(c.slug, currentRoleKeyword);
      const jUrl = buildJobsUrl(c.slug);
      return `| ${c.rank || '—'} | **${c.name}** | ${c.category} | [People](${pUrl}) | [Jobs](${jUrl}) |`;
    });
    const md = [header, ...lines].join('\n');
    await copyToClipboard(md, `${records.length} rows as Markdown table`, 'md-export');
  };

  const openBatchInTabs = (records: CompanyRecord[]) => {
    const batch = records.slice(0, 5);
    if (batch.length === 0) return;

    if (linkOpenMode === 'companion') {
      const first = batch[0];
      const url = buildPeopleUrl(first.slug, currentRoleKeyword);
      handleNavigateUrl(null as unknown as React.MouseEvent, url, first);
      onNotify(`Loaded ${first.name} into Companion Window!`);
    } else {
      batch.forEach((c) => {
        const url = buildPeopleUrl(c.slug, currentRoleKeyword);
        openOutreachUrl(url, { mode: linkOpenMode, companyName: c.name });
      });
      onNotify(`Opened ${batch.length} companies!`);
    }
  };

  const handleSendSelectedToWorkspace = () => {
    const selected = getSelectedRecords();
    if (selected.length === 0) return;
    onSendToWorkspace(selected.map((c) => c.name));
    onNotify(`Loaded ${selected.length} companies into Workspace!`);
  };

  const getStatusBadgeStyle = (status: OutreachStatus) => {
    switch (status) {
      case 'contacted':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.35)' };
      case 'applied':
        return { bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.35)' };
      case 'connected':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.35)' };
      case 'reviewed':
        return { bg: 'rgba(59, 130, 246, 0.15)', text: '#93c5fd', border: 'rgba(59, 130, 246, 0.35)' };
      default:
        return { bg: 'rgba(148, 163, 184, 0.1)', text: '#94a3b8', border: 'rgba(148, 163, 184, 0.25)' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Visual Outreach Pipeline Funnel & Weekly Goals */}
      <div
        className="glass-card"
        style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 27, 75, 0.65) 100%)',
          borderColor: 'rgba(99, 102, 241, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', flex: '1 1 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Target size={16} color="#38bdf8" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Pipeline Funnel:
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8' }}>
              <span>⚪ To Contact:</span>
              <strong style={{ color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>{funnelMetrics.toContact}</strong>
            </div>
            <span style={{ color: 'var(--border-subtle)' }}>→</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#93c5fd' }}>
              <span>🔵 Reviewed:</span>
              <strong style={{ color: '#bfdbfe', fontFamily: 'var(--font-mono)' }}>{funnelMetrics.reviewed}</strong>
            </div>
            <span style={{ color: 'var(--border-subtle)' }}>→</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#facc15' }}>
              <span>🟡 Contacted:</span>
              <strong style={{ color: '#fef08a', fontFamily: 'var(--font-mono)' }}>{funnelMetrics.contacted}</strong>
            </div>
            <span style={{ color: 'var(--border-subtle)' }}>→</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#c084fc' }}>
              <span>🟣 Applied:</span>
              <strong style={{ color: '#e9d5ff', fontFamily: 'var(--font-mono)' }}>{funnelMetrics.applied}</strong>
            </div>
            <span style={{ color: 'var(--border-subtle)' }}>→</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#34d399' }}>
              <span>🟢 Connected:</span>
              <strong style={{ color: '#a7f3d0', fontFamily: 'var(--font-mono)' }}>{funnelMetrics.connected}</strong>
            </div>
          </div>
        </div>

        {/* Weekly Target Progress Gauge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f8fafc' }}>
              {funnelMetrics.totalOutreach} Reached • Goal 30
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {Math.min(100, Math.round((funnelMetrics.totalOutreach / 30) * 100))}% Completed
            </div>
          </div>
          <div
            style={{
              width: '70px',
              height: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.min(100, Math.round((funnelMetrics.totalOutreach / 30) * 100))}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #6366f1 0%, #10b981 100%)',
                borderRadius: 'var(--radius-full)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Target Role Selector Banner */}
      <div
        className="glass-card"
        style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
          borderColor: 'rgba(99, 102, 241, 0.35)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '240px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              flexShrink: 0,
            }}
          >
            <BriefcaseBusiness size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>
              Target Role Filter for People Links
            </div>
            <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
              Automatically tailors every LinkedIn People URL to your target job title
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          {TARGET_ROLE_OPTIONS.map((role) => {
            const active = selectedRoleId === role.id;
            return (
              <button
                key={role.id}
                onClick={() => {
                  setSelectedRoleId(role.id);
                  onNotify(`Target role set to: ${role.label}`);
                }}
                className={`btn ${active ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.775rem',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                {role.label}
              </button>
            );
          })}

          {/* User Custom Roles */}
          {customRoleOptions.map((cRole) => {
            const active = selectedRoleId === `custom:${cRole}`;
            return (
              <button
                key={cRole}
                onClick={() => {
                  setSelectedRoleId(`custom:${cRole}`);
                  onNotify(`Target role set to: ${cRole}`);
                }}
                className={`btn ${active ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.775rem',
                  borderRadius: 'var(--radius-full)',
                  borderColor: active ? 'var(--accent-cyan)' : 'rgba(6, 182, 212, 0.3)',
                  color: active ? '#fff' : '#67e8f9',
                }}
              >
                {cRole}
              </button>
            );
          })}

          {/* Inline + Custom Role Form */}
          {isAddingCustomRole ? (
            <form onSubmit={handleAddCustomRole} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Data Scientist, UX..."
                value={customRoleInput}
                onChange={(e) => setCustomRoleInput(e.target.value)}
                autoFocus
                style={{ width: '170px', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                Add
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setIsAddingCustomRole(false)}
                style={{ padding: '0.25rem 0.4rem', fontSize: '0.75rem' }}
              >
                <X size={12} />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsAddingCustomRole(true)}
              className="btn btn-outline"
              style={{
                padding: '0.35rem 0.65rem',
                fontSize: '0.75rem',
                borderRadius: 'var(--radius-full)',
                borderStyle: 'dashed',
              }}
              title="Add a custom target title or specialty"
            >
              <Plus size={12} /> Add Role
            </button>
          )}
        </div>
      </div>

      {/* Search & Category Filter Card */}
      <div
        className="glass-card"
        style={{
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          {/* Search Input with Clear Button and ⌘K Hint */}
          <div className="mobile-full-width" style={{ position: 'relative', flex: '1 1 320px', maxWidth: '480px' }}>
            <Search
              size={18}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              ref={searchInputRef}
              type="text"
              className="input-field"
              placeholder="Search companies by name, category, or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.5rem', paddingRight: searchQuery ? '2.5rem' : '3.5rem' }}
            />
            {!searchQuery && (
              <span
                style={{
                  position: 'absolute',
                  right: '0.875rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  padding: '1px 5px',
                  fontFamily: 'var(--font-mono)',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              >
                ⌘K
              </span>
            )}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.06)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '22px',
                  height: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Outreach Status Filter Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status:</span>
            <select
              className="input-field"
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              style={{
                width: 'auto',
                fontSize: '0.8rem',
                padding: '0.45rem 0.75rem',
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Outreach Statuses</option>
              <option value="to_contact">⚪ To Contact</option>
              <option value="reviewed">🔵 Reviewed</option>
              <option value="contacted">🟡 Message Sent</option>
              <option value="applied">🟣 Applied</option>
              <option value="connected">🟢 Connected</option>
            </select>
          </div>

          {/* Export & Batch Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* Turbo Speed-Run Primary Button */}
            <button
              className="btn"
              onClick={() => startSpeedRun(selectedIds.size > 0 ? getSelectedRecords() : filteredCompanies)}
              title="Launch high-speed outreach runner with companion sync and auto-copied connection notes (Shift+S)"
              style={{
                fontSize: '0.8rem',
                padding: '0.45rem 1rem',
                background: 'linear-gradient(135deg, #eab308 0%, #f59e0b 100%)',
                color: '#000',
                fontWeight: 800,
                border: 'none',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 14px rgba(234, 179, 8, 0.45)',
                cursor: 'pointer',
              }}
            >
              <Zap size={15} fill="#000" />
              <span>⚡ Speed-Run ({selectedIds.size > 0 ? `${selectedIds.size} Selected` : `${filteredCompanies.length}`})</span>
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => copyAsGoogleSheetsTsv(filteredCompanies)}
              title="Copy all filtered rows to paste into Google Sheets"
              style={{ fontSize: '0.775rem', padding: '0.45rem 0.75rem' }}
            >
              <FileSpreadsheet size={14} color="#34d399" />
              <span>Copy for Sheets</span>
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => copyAsMarkdownTable(filteredCompanies)}
              title="Copy as Markdown table for Notion or GitHub"
              style={{ fontSize: '0.775rem', padding: '0.45rem 0.75rem' }}
            >
              <FileCode size={14} color="#a5b4fc" />
              <span>Copy Markdown</span>
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => exportFilteredCsv(filteredCompanies)}
              title="Export all currently filtered companies to CSV"
              style={{ fontSize: '0.775rem', padding: '0.45rem 0.75rem' }}
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Category Filter Pills with Item Count Badges */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '6px',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
          }}
        >
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
            <Filter size={14} color="#818cf8" /> Categories:
          </span>

          {/* ⭐ Starred Filter Pill */}
          <button
            onClick={() => setShowStarredOnly(!showStarredOnly)}
            style={{
              background: showStarredOnly ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'rgba(30, 41, 59, 0.7)',
              color: showStarredOnly ? '#000000' : (starredSet && starredSet.size > 0 ? '#fbbf24' : 'var(--text-secondary)'),
              border: showStarredOnly ? '1px solid #facc15' : '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: 'var(--radius-full)',
              padding: '0.35rem 0.8rem',
              fontSize: '0.775rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.18s ease',
              boxShadow: showStarredOnly ? '0 2px 10px rgba(245, 158, 11, 0.4)' : 'none',
              flexShrink: 0,
            }}
            title="Filter by your starred / bookmarked companies"
            aria-pressed={showStarredOnly}
          >
            <Star size={13} fill={showStarredOnly || (starredSet && starredSet.size > 0) ? '#facc15' : 'transparent'} />
            <span>Starred</span>
            <span
              style={{
                fontSize: '0.7rem',
                background: showStarredOnly ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                color: showStarredOnly ? '#000' : 'var(--text-muted)',
                padding: '0.1rem 0.4rem',
                borderRadius: 'var(--radius-full)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {starredSet ? starredSet.size : 0}
            </span>
          </button>
          {categories.map((cat) => {
            const count = cat === 'All' ? companies.length : categoryCounts.get(cat) || 0;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  background: isSelected ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'rgba(30, 41, 59, 0.7)',
                  color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  border: isSelected ? '1px solid #818cf8' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-full)',
                  padding: '0.35rem 0.8rem',
                  fontSize: '0.775rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.18s ease',
                  boxShadow: isSelected ? '0 2px 10px rgba(99, 102, 241, 0.35)' : 'none',
                }}
              >
                <span>{cat}</span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    background: isSelected ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.08)',
                    color: isSelected ? '#ffffff' : 'var(--text-muted)',
                    padding: '0.1rem 0.4rem',
                    borderRadius: 'var(--radius-full)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating Selection Banner with Batch Actions */}
      {selectedIds.size > 0 && (
        <div
          className="glass-card"
          style={{
            padding: '0.875rem 1.25rem',
            backgroundColor: 'rgba(24, 28, 62, 0.95)',
            borderColor: 'rgba(99, 102, 241, 0.45)',
            boxShadow: '0 8px 30px rgba(99, 102, 241, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              style={{
                backgroundColor: '#6366f1',
                color: '#fff',
                fontSize: '0.8rem',
                fontWeight: 700,
                padding: '0.2rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {selectedIds.size}
            </span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>companies selected</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            {/* Batch Status Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <select
                onChange={(e) => {
                  const val = e.target.value as OutreachStatus | '';
                  if (!val) return;
                  const records = getSelectedRecords();
                  const keys = records.map((r) => r.slug || r.name);
                  if (onBatchUpdateOutreachStatus) {
                    onBatchUpdateOutreachStatus(keys, val);
                  } else {
                    const next = { ...activeOutreachMap };
                    keys.forEach((k) => (next[k] = val));
                    setOutreachMap(next);
                    try {
                      localStorage.setItem('linkbuilder_outreach_status', JSON.stringify(next));
                    } catch {}
                    onNotify(`Updated ${keys.length} companies to ${val.replace('_', ' ')}!`);
                  }
                  e.target.value = '';
                }}
                defaultValue=""
                className="select-field"
                style={{
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  color: '#38bdf8',
                  cursor: 'pointer',
                }}
                aria-label="Batch update status for selected companies"
              >
                <option value="" disabled>Set Status...</option>
                <option value="to_contact">⚪ Mark as To Contact</option>
                <option value="reviewed">🟣 Mark as Reviewed</option>
                <option value="contacted">🟡 Mark as Contacted</option>
                <option value="applied">🔵 Mark as Applied</option>
                <option value="connected">🟢 Mark as Connected</option>
              </select>
            </div>

            {/* Batch Star Button */}
            {onBatchToggleStar && (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  const records = getSelectedRecords();
                  const keys = records.map((r) => r.slug || r.name);
                  const allStarred = keys.every((k) => starredSet && starredSet.has(k));
                  onBatchToggleStar(keys, !allStarred);
                }}
                style={{ fontSize: '0.8rem' }}
                title="Toggle Star for all selected companies"
              >
                <Star size={14} fill="#facc15" color="#facc15" />
                <span>Star Selected ({selectedIds.size})</span>
              </button>
            )}

            <button
              className="btn"
              onClick={() => startSpeedRun(getSelectedRecords())}
              style={{
                fontSize: '0.8rem',
                padding: '0.45rem 0.9rem',
                background: 'linear-gradient(135deg, #eab308 0%, #f59e0b 100%)',
                color: '#000',
                fontWeight: 800,
                border: 'none',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 14px rgba(234, 179, 8, 0.45)',
                cursor: 'pointer',
              }}
            >
              <Zap size={14} fill="#000" />
              <span>Speed-Run Selected ({selectedIds.size})</span>
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => openBatchInTabs(getSelectedRecords())}
              style={{ fontSize: '0.8rem' }}
              title="Open the first 5 selected People links in background tabs"
            >
              <ExternalLink size={14} color="#38bdf8" /> Open Batch in Tabs (max 5)
            </button>
            <button className="btn btn-primary" onClick={handleSendSelectedToWorkspace}>
              <Sparkles size={15} /> Load into Workspace
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => exportFilteredCsv(getSelectedRecords())}
            >
              <Download size={15} /> Export Selected ({selectedIds.size})
            </button>
            <button
              className="btn btn-outline"
              onClick={() => setSelectedIds(new Set())}
              style={{ fontSize: '0.8rem' }}
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Mobile Swipe Hint Banner */}
      <div className="table-mobile-hint">
        <span>👈 Swipe horizontally to view all columns & links 👉</span>
      </div>

      {/* Main Companies Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col" style={{ width: '42px', minWidth: '42px', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  aria-label="Select all visible companies"
                  checked={
                    filteredCompanies.length > 0 &&
                    filteredCompanies.every((c) => selectedIds.has(c.id || c.name))
                  }
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
              </th>
              <th scope="col" style={{ width: '36px', minWidth: '36px', textAlign: 'center' }} title="Favorites / Starred">
                <Star size={13} color="#facc15" />
              </th>
              <th
                scope="col"
                style={{ width: '75px', minWidth: '75px', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort('rank')}
                title="Sort by Rank"
                aria-sort={sortField === 'rank' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Rank
                  {sortField === 'rank' ? (
                    sortOrder === 'asc' ? <ArrowUp size={12} color="#818cf8" /> : <ArrowDown size={12} color="#818cf8" />
                  ) : (
                    <ArrowUpDown size={12} color="var(--text-muted)" />
                  )}
                </div>
              </th>
              <th
                scope="col"
                style={{ minWidth: '170px', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort('name')}
                title="Sort by Company Name"
                aria-sort={sortField === 'name' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Company
                  {sortField === 'name' ? (
                    sortOrder === 'asc' ? <ArrowUp size={12} color="#818cf8" /> : <ArrowDown size={12} color="#818cf8" />
                  ) : (
                    <ArrowUpDown size={12} color="var(--text-muted)" />
                  )}
                </div>
              </th>
              <th
                scope="col"
                style={{ minWidth: '150px', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort('category')}
                title="Sort by Category"
                aria-sort={sortField === 'category' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Category
                  {sortField === 'category' ? (
                    sortOrder === 'asc' ? <ArrowUp size={12} color="#818cf8" /> : <ArrowDown size={12} color="#818cf8" />
                  ) : (
                    <ArrowUpDown size={12} color="var(--text-muted)" />
                  )}
                </div>
              </th>
              <th scope="col" style={{ width: '150px', minWidth: '145px' }}>Outreach Tracker</th>
              <th scope="col" style={{ minWidth: '140px' }}>Target People Page</th>
              <th scope="col" style={{ minWidth: '130px' }}>Jobs Page</th>
              <th scope="col" style={{ minWidth: '120px' }}>Careers Portal</th>
            </tr>
          </thead>
          <tbody>
            {filteredCompanies.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                    <Search size={32} color="var(--text-muted)" />
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                      No companies match your query
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '400px' }}>
                      Try searching with a broader keyword, or click below to reset filters.
                    </p>
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('All');
                        setSelectedStatusFilter('all');
                      }}
                    >
                      Reset Search & Filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredCompanies.map((c) => {
                const rowId = c.id || c.name;
                const companyKey = c.slug || c.name;
                const isSelected = selectedIds.has(rowId);
                const currentStatus: OutreachStatus = activeOutreachMap[companyKey] || 'to_contact';
                const statusStyle = getStatusBadgeStyle(currentStatus);

                const peopleUrl = buildPeopleUrl(c.slug, currentRoleKeyword);
                const jobsUrl = buildJobsUrl(c.slug);
                const googleSearch = buildGoogleSearchUrl(c.name);

                const isPeopleCopied = copiedKey === `people-${rowId}`;
                const isJobsCopied = copiedKey === `jobs-${rowId}`;
                const isCareersCopied = copiedKey === `careers-${rowId}`;

                return (
                  <tr
                    key={rowId}
                    style={{
                      backgroundColor: isSelected
                        ? 'rgba(99, 102, 241, 0.08)'
                        : activeCompanionSlug === c.slug
                        ? 'rgba(56, 189, 248, 0.12)'
                        : 'transparent',
                      boxShadow: activeCompanionSlug === c.slug ? 'inset 3px 0 0 #38bdf8' : undefined,
                    }}
                  >
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        aria-label={`Select ${c.name}`}
                        checked={isSelected}
                        onChange={() => handleToggleRow(rowId)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ textAlign: 'center', width: '36px' }}>
                      <button
                        className={`star-btn ${starredSet && starredSet.has(companyKey) ? 'starred' : ''}`}
                        onClick={() => onToggleStar && onToggleStar(companyKey)}
                        aria-label={starredSet && starredSet.has(companyKey) ? `Remove ${c.name} from starred` : `Star ${c.name}`}
                        title={starredSet && starredSet.has(companyKey) ? 'Starred' : 'Add to Starred'}
                      >
                        <Star
                          size={15}
                          fill={starredSet && starredSet.has(companyKey) ? '#facc15' : 'transparent'}
                          color={starredSet && starredSet.has(companyKey) ? '#facc15' : 'var(--text-muted)'}
                        />
                      </button>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                      {c.rank ? `#${c.rank}` : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.925rem' }}>
                            {c.name}
                          </span>
                          {notesMap && notesMap[companyKey] && (
                            <span
                              title={`Private Note: ${notesMap[companyKey]}`}
                              onClick={() => onExploreCompany && onExploreCompany(c)}
                              style={{
                                fontSize: '0.675rem',
                                color: '#fbbf24',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                cursor: 'pointer',
                                background: 'rgba(251, 191, 36, 0.12)',
                                border: '1px solid rgba(251, 191, 36, 0.35)',
                                padding: '1px 5px',
                                borderRadius: '4px',
                              }}
                            >
                              <FileText size={10} /> Note
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '4px' }}>
                          <a
                            href={googleSearch}
                            onClick={(e) => handleNavigateUrl(e, googleSearch, c)}
                            target={getLinkTargetAttribute(linkOpenMode)}
                            rel="noreferrer"
                            className="action-link-search"
                            style={{ fontSize: '0.7rem', padding: '0.12rem 0.4rem' }}
                            title="Verify via Google search"
                          >
                            <Search size={10} /> Check
                          </a>
                          {onExploreCompany && (
                            <button
                              onClick={() => onExploreCompany(c)}
                              className="btn btn-secondary"
                              style={{
                                fontSize: '0.7rem',
                                padding: '0.12rem 0.45rem',
                                background: 'rgba(99, 102, 241, 0.12)',
                                borderColor: 'rgba(99, 102, 241, 0.3)',
                                color: '#a5b4fc',
                              }}
                              title={`Open live preview and companion window for ${c.name}`}
                            >
                              <AppWindow size={10} /> Explore
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setMessageCompany(c);
                              setIsMessageModalOpen(true);
                            }}
                            className="btn btn-secondary"
                            style={{
                              fontSize: '0.7rem',
                              padding: '0.12rem 0.45rem',
                              background: 'rgba(6, 182, 212, 0.12)',
                              borderColor: 'rgba(6, 182, 212, 0.3)',
                              color: '#67e8f9',
                            }}
                            title={`Generate 300-char LinkedIn connection note for ${c.name}`}
                          >
                            <MessageSquare size={10} /> Note
                          </button>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-category">{c.category}</span>
                    </td>
                    <td>
                      {/* Outreach CRM Status Dropdown */}
                      <select
                        value={currentStatus}
                        onChange={(e) => handleUpdateStatus(companyKey, e.target.value as OutreachStatus)}
                        style={{
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.text,
                          border: `1px solid ${statusStyle.border}`,
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.3rem 0.5rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          outline: 'none',
                        }}
                      >
                        <option value="to_contact" style={{ background: '#0F172A', color: '#f8fafc' }}>⚪ To Contact</option>
                        <option value="reviewed" style={{ background: '#0F172A', color: '#f8fafc' }}>🔵 Reviewed</option>
                        <option value="contacted" style={{ background: '#0F172A', color: '#f8fafc' }}>🟡 Message Sent</option>
                        <option value="applied" style={{ background: '#0F172A', color: '#f8fafc' }}>🟣 Applied</option>
                        <option value="connected" style={{ background: '#0F172A', color: '#f8fafc' }}>🟢 Connected</option>
                      </select>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <a
                          href={peopleUrl}
                          onClick={(e) => handleNavigateUrl(e, peopleUrl, c)}
                          target={getLinkTargetAttribute(linkOpenMode)}
                          rel="noreferrer"
                          className="action-link"
                          title={`Open People page on LinkedIn${currentRoleKeyword ? ` (filtered to ${currentRoleKeyword})` : ''}`}
                        >
                          <Users size={14} /> People {currentRoleKeyword && <span style={{ fontSize: '0.7rem', color: '#a5b4fc' }}>({currentRoleKeyword})</span>} <ExternalLink size={11} />
                        </a>
                        <button
                          className={`btn ${isPeopleCopied ? 'btn-success' : 'btn-outline'}`}
                          style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => copyToClipboard(peopleUrl, `${c.name} People link`, `people-${rowId}`)}
                          title="Copy People link"
                        >
                          {isPeopleCopied ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
                        </button>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <a
                          href={jobsUrl}
                          onClick={(e) => handleNavigateUrl(e, jobsUrl, c)}
                          target={getLinkTargetAttribute(linkOpenMode)}
                          rel="noreferrer"
                          className="action-link"
                          title="Open Jobs page on LinkedIn"
                        >
                          <Briefcase size={14} /> Jobs <ExternalLink size={11} />
                        </a>
                        <button
                          className={`btn ${isJobsCopied ? 'btn-success' : 'btn-outline'}`}
                          style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => copyToClipboard(jobsUrl, `${c.name} Jobs link`, `jobs-${rowId}`)}
                          title="Copy Jobs link"
                        >
                          {isJobsCopied ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
                        </button>
                      </div>
                    </td>
                    <td>
                      {c.careersUrl ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <a
                            href={c.careersUrl}
                            onClick={(e) => handleNavigateUrl(e, c.careersUrl!, c)}
                            target={getLinkTargetAttribute(linkOpenMode)}
                            rel="noreferrer"
                            className="action-link action-link-careers"
                            title="Open company careers portal"
                          >
                            <Globe size={14} /> Careers <ExternalLink size={11} />
                          </a>
                          <button
                            className={`btn ${isCareersCopied ? 'btn-success' : 'btn-outline'}`}
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => copyToClipboard(c.careersUrl!, `${c.name} Careers link`, `careers-${rowId}`)}
                            title="Copy Careers link"
                          >
                            {isCareersCopied ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 300-Character LinkedIn Note Generator Modal */}
      <OutreachMessageModal
        company={messageCompany}
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        onNotify={onNotify}
        targetRoleKeyword={currentRoleKeyword}
      />

      {/* Turbo Speed-Run Outreach Runner Modal */}
      <SpeedRunRunnerModal
        isOpen={isSpeedRunOpen}
        onClose={() => setIsSpeedRunOpen(false)}
        companies={speedRunCompanies}
        outreachMap={activeOutreachMap}
        onUpdateStatus={handleUpdateStatus}
        onNotify={onNotify}
        initialRoleId={selectedRoleId}
        linkOpenMode={linkOpenMode}
      />
    </div>
  );
};
