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
} from 'lucide-react';
import Papa from 'papaparse';
import { CompanyRecord, OutreachStatus } from '../types/company';
import {
  buildPeopleUrl,
  buildJobsUrl,
  buildGoogleSearchUrl,
  TARGET_ROLE_OPTIONS,
} from '../lib/slug-heuristics';
import { OutreachMessageModal } from './OutreachMessageModal';

interface CatalogViewProps {
  companies: CompanyRecord[];
  onNotify: (msg: string) => void;
  onSendToWorkspace: (companyNames: string[]) => void;
  onExploreCompany?: (company: CompanyRecord) => void;
}

type SortField = 'rank' | 'name' | 'category' | 'status';
type SortOrder = 'asc' | 'desc';

export const CatalogView: React.FC<CatalogViewProps> = ({
  companies,
  onNotify,
  onSendToWorkspace,
  onExploreCompany,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Target role filter state
  const [selectedRoleId, setSelectedRoleId] = useState<string>('all');

  // Outreach status state (persisted in localStorage)
  const [outreachMap, setOutreachMap] = useState<Record<string, OutreachStatus>>({});
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Message modal state
  const [messageCompany, setMessageCompany] = useState<CompanyRecord | null>(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState<boolean>(false);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Load outreach statuses from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('linkbuilder_outreach_status');
      if (saved) {
        setOutreachMap(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleUpdateStatus = (companyKey: string, status: OutreachStatus) => {
    const next = { ...outreachMap, [companyKey]: status };
    setOutreachMap(next);
    try {
      localStorage.setItem('linkbuilder_outreach_status', JSON.stringify(next));
    } catch {
      // ignore
    }
    onNotify(`Status updated to ${status.replace('_', ' ')}!`);
  };

  // Keyboard shortcut Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Category counts
  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    companies.forEach((c) => {
      if (c.category) {
        const primary = c.category.split('/')[0].trim();
        map.set(primary, (map.get(primary) || 0) + 1);
      }
    });
    return map;
  }, [companies]);

  const categories = useMemo(() => {
    return ['All', ...Array.from(categoryCounts.keys()).sort()];
  }, [categoryCounts]);

  // Current role keyword
  const currentRoleKeyword = useMemo(() => {
    const opt = TARGET_ROLE_OPTIONS.find((r) => r.id === selectedRoleId);
    return opt ? opt.keyword : '';
  }, [selectedRoleId]);

  // Filtering & Sorting
  const filteredCompanies = useMemo(() => {
    const filtered = companies.filter((c) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        c.category.toLowerCase().includes(selectedCategory.toLowerCase());
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q);

      const status = outreachMap[c.slug || c.name] || 'to_contact';
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
        const statA = outreachMap[a.slug || a.name] || 'to_contact';
        const statB = outreachMap[b.slug || b.name] || 'to_contact';
        comparison = statA.localeCompare(statB);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [companies, selectedCategory, searchQuery, selectedStatusFilter, sortField, sortOrder, outreachMap]);

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
    const rows = recordsToExport.map((c) => ({
      Rank: c.rank || '',
      Company: c.name,
      Category: c.category,
      Slug: c.slug,
      'Outreach Status': (outreachMap[c.slug || c.name] || 'to_contact').replace('_', ' '),
      'People Link': buildPeopleUrl(c.slug, currentRoleKeyword),
      'Jobs Link': buildJobsUrl(c.slug),
      'Careers Link': c.careersUrl || '',
      'LinkedIn URL': c.linkedInUrl || '',
    }));

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
    const headers = ['Rank', 'Company', 'Category', 'Slug', 'Status', 'People Link', 'Jobs Link', 'Careers'];
    const lines = records.map((c) => [
      c.rank || '',
      c.name,
      c.category,
      c.slug,
      outreachMap[c.slug || c.name] || 'to_contact',
      buildPeopleUrl(c.slug, currentRoleKeyword),
      buildJobsUrl(c.slug),
      c.careersUrl || '',
    ].join('\t'));
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
    batch.forEach((c) => {
      const url = buildPeopleUrl(c.slug, currentRoleKeyword);
      window.open(url, '_blank');
    });
    onNotify(`Opened ${batch.length} company People tabs!`);
  };

  const getSelectedRecords = (): CompanyRecord[] => {
    return companies.filter((c) => selectedIds.has(c.id || c.name));
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
      {/* Target Role Selector Banner */}
      <div
        className="glass-card"
        style={{
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
          borderColor: 'rgba(99, 102, 241, 0.35)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
          <div style={{ position: 'relative', flex: '1 1 320px', maxWidth: '480px' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflowX: 'auto', paddingBottom: '6px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
            <Filter size={14} color="#818cf8" /> Categories:
          </span>
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

      {/* Main Companies Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '42px', textAlign: 'center' }}>
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
              <th
                style={{ width: '75px', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort('rank')}
                title="Sort by Rank"
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
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort('name')}
                title="Sort by Company Name"
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
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort('category')}
                title="Sort by Category"
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
              <th style={{ width: '150px' }}>Outreach Tracker</th>
              <th>Target People Page</th>
              <th>Jobs Page</th>
              <th>Careers Portal</th>
            </tr>
          </thead>
          <tbody>
            {filteredCompanies.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '4rem 1rem' }}>
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
                const currentStatus: OutreachStatus = outreachMap[companyKey] || 'to_contact';
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
                      backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
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
                    <td style={{ fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                      {c.rank ? `#${c.rank}` : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.925rem' }}>
                          {c.name}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '4px' }}>
                          <a
                            href={googleSearch}
                            target="_blank"
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
                          target="_blank"
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
                          target="_blank"
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
                            target="_blank"
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
    </div>
  );
};
