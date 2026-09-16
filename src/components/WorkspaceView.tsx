'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  UploadCloud,
  FileText,
  Copy,
  ExternalLink,
  Users,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  Download,
  Trash2,
  Save,
  Check,
  Search,
  Sparkles,
  HelpCircle,
  FileUp,
  AppWindow,
  MessageSquare,
  FileSpreadsheet,
  FileCode,
  BriefcaseBusiness,
  Zap,
  Bot,
} from 'lucide-react';
import Papa from 'papaparse';
import { CompanyRecord, WorkspaceRow, VerificationStatus, OutreachStatus } from '../types/company';
import {
  generateSlug,
  extractSlugFromLinkedInUrl,
  buildCleanCompanyUrl,
  buildPeopleUrl,
  buildJobsUrl,
  buildGoogleSearchUrl,
  TARGET_ROLE_OPTIONS,
  KNOWN_COMPANY_SLUGS,
} from '../lib/slug-heuristics';
import { saveCompany } from '../lib/firebase';
import { OutreachMessageModal } from './OutreachMessageModal';
import { SpeedRunRunnerModal } from './SpeedRunRunnerModal';
import { AIPromptGeneratorModal } from './AIPromptGeneratorModal';

interface WorkspaceViewProps {
  companiesDb: CompanyRecord[];
  onNotify: (msg: string) => void;
  preloadedNames?: string[];
  onCompanyAddedToDb: (company: CompanyRecord) => void;
  onExploreCompany?: (company: CompanyRecord) => void;
  starredSet?: Set<string>;
  onToggleStar?: (companyKey: string) => void;
  notesMap?: Record<string, string>;
  onUpdateNotes?: (companyKey: string, noteText: string) => void;
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  companiesDb,
  onNotify,
  preloadedNames,
  onCompanyAddedToDb,
  onExploreCompany,
  starredSet,
  onToggleStar,
  notesMap,
  onUpdateNotes,
}) => {
  const [inputText, setInputText] = useState<string>('');
  const [rows, setRows] = useState<WorkspaceRow[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Target role filter state
  const [selectedRoleId, setSelectedRoleId] = useState<string>('all');

  // Message modal state
  const [messageCompany, setMessageCompany] = useState<CompanyRecord | null>(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState<boolean>(false);

  // Speed-Run Runner state
  const [isSpeedRunOpen, setIsSpeedRunOpen] = useState<boolean>(false);
  const [isAiPromptModalOpen, setIsAiPromptModalOpen] = useState<boolean>(false);
  const [outreachMap, setOutreachMap] = useState<Record<string, OutreachStatus>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem('linkbuilder_outreach_status');
      if (saved) setOutreachMap(JSON.parse(saved));
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

  const currentRoleKeyword = useMemo(() => {
    const opt = TARGET_ROLE_OPTIONS.find((r) => r.id === selectedRoleId);
    return opt ? opt.keyword : '';
  }, [selectedRoleId]);

  // Map of known database companies for quick case-insensitive lookup
  const dbLookup = useMemo(() => {
    const map = new Map<string, CompanyRecord>();
    companiesDb.forEach((c) => {
      map.set(c.name.trim().toLowerCase(), c);
      if (c.slug) {
        map.set(c.slug.trim().toLowerCase(), c);
      }
    });
    return map;
  }, [companiesDb]);

  interface ParsedCompanyItem {
    name: string;
    rawSlug?: string;
    category?: string;
    careersUrl?: string;
    linkedInUrl?: string;
  }

  const processCompanyItems = (items: ParsedCompanyItem[], roleKeyword: string = currentRoleKeyword): WorkspaceRow[] => {
    return items
      .map((item) => {
        let name = item.name ? item.name.trim() : '';
        let extractedSlug: string | null = null;

        // If a direct slug was provided in CSV
        if (item.rawSlug && item.rawSlug.trim()) {
          extractedSlug = extractSlugFromLinkedInUrl(item.rawSlug) || item.rawSlug.trim().toLowerCase();
        }

        // If a full LinkedIn URL was provided (e.g. from ChatGPT or CSV)
        if (!extractedSlug && item.linkedInUrl && item.linkedInUrl.trim()) {
          extractedSlug = extractSlugFromLinkedInUrl(item.linkedInUrl);
        }

        // If the company name itself is a LinkedIn URL
        if (!extractedSlug && name.includes('linkedin.com/company/')) {
          extractedSlug = extractSlugFromLinkedInUrl(name);
        }

        // Check if name is a known alias in KNOWN_COMPANY_SLUGS (e.g. "CRED" -> "credapp")
        if (!extractedSlug) {
          extractedSlug = generateSlug(name);
        }

        // Lookup in verified database by lower name, raw slug, or extracted slug
        const lowerName = name.toLowerCase();
        const matched = dbLookup.get(lowerName) || (extractedSlug ? dbLookup.get(extractedSlug) : undefined);

        const finalSlug = extractedSlug || (matched ? matched.slug : generateSlug(name));

        // Clean display name
        let finalName = matched ? matched.name : name;
        if (!finalName || finalName.startsWith('http')) {
          finalName = matched
            ? matched.name
            : finalSlug
                .split('-')
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');
        }

        const isKnownSlug = Boolean(matched || KNOWN_COMPANY_SLUGS[lowerName] || KNOWN_COMPANY_SLUGS[finalSlug]);
        const status: VerificationStatus =
          isKnownSlug || Boolean(item.rawSlug || item.linkedInUrl) ? 'verified' : 'guess';
        const category = item.category || (matched ? matched.category : undefined);
        const careersLink = item.careersUrl || (matched ? matched.careersUrl : undefined);

        return {
          id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 5)}-${finalSlug}`,
          companyName: finalName,
          slug: finalSlug,
          status,
          category,
          peopleLink: buildPeopleUrl(finalSlug, roleKeyword),
          jobsLink: buildJobsUrl(finalSlug),
          careersLink,
          searchUrl: buildGoogleSearchUrl(finalName),
          isCustomSlug: Boolean(item.rawSlug),
          outreachStatus: 'to_contact' as OutreachStatus,
        };
      })
      .filter((r) => r.slug.length > 0);
  };

  // If preloaded names are provided (e.g. from Catalog view), parse them
  useEffect(() => {
    if (preloadedNames && preloadedNames.length > 0) {
      setInputText(preloadedNames.join('\n'));
      parseInput(preloadedNames.join('\n'));
    }
  }, [preloadedNames]);

  // When role changes, re-link people links
  useEffect(() => {
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        peopleLink: buildPeopleUrl(r.slug, currentRoleKeyword),
      }))
    );
  }, [currentRoleKeyword]);

  const parseInput = (raw: string) => {
    if (!raw.trim()) {
      setRows([]);
      return;
    }

    const firstLine = raw.trim().split('\n')[0];
    const isCsv = firstLine.includes(',') || firstLine.includes('\t');

    if (isCsv) {
      const parsed = Papa.parse<Record<string, string>>(raw, {
        header: true,
        skipEmptyLines: true,
      });

      if (parsed.data.length > 0 && parsed.meta.fields) {
        const fieldNames = parsed.meta.fields;
        const findField = (aliases: string[]) =>
          fieldNames.find((f) => aliases.includes(f.trim().toLowerCase()));

        const companyField =
          findField(['company', 'company name', 'name', 'organization', 'title']) || fieldNames[0];
        const slugField = findField(['slug', 'company slug', 'linkedin slug', 'identifier']);
        const urlField = findField(['linkedin url', 'linkedin', 'url', 'link', 'profile', 'linkedin page']);
        const categoryField = findField(['category', 'industry', 'sector', 'subcategory']);
        const careersField = findField(['careers url', 'careers', 'career url', 'careers link', 'jobs url', 'portal']);

        const items: ParsedCompanyItem[] = parsed.data
          .filter((r) => Boolean(r[companyField] || (urlField && r[urlField]) || (slugField && r[slugField])))
          .map((r) => ({
            name: (r[companyField] || '').trim(),
            rawSlug: slugField ? (r[slugField] || '').trim() : undefined,
            linkedInUrl: urlField ? (r[urlField] || '').trim() : undefined,
            category: categoryField ? (r[categoryField] || '').trim() : undefined,
            careersUrl: careersField ? (r[careersField] || '').trim() : undefined,
          }));

        setRows(processCompanyItems(items));
        return;
      }
    }

    // Line-by-line fallback
    const lines = raw.split('\n');
    const items: ParsedCompanyItem[] = lines
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .map((line) => {
        // Check if line is CSV-like without header: e.g. "CRED, https://www.linkedin.com/company/credapp/"
        if (line.includes(',') || line.includes('\t')) {
          const parts = line.split(/[,\t]+/).map((p) => p.trim());
          const nameCandidate = parts[0];
          const secondCandidate = parts[1] || '';
          const isSecondUrl = secondCandidate.includes('linkedin.com/company/');
          return {
            name: nameCandidate,
            linkedInUrl: isSecondUrl ? secondCandidate : undefined,
            rawSlug: !isSecondUrl && secondCandidate.length > 0 ? secondCandidate : undefined,
            category: parts[2],
          };
        }

        // Single value (name or URL)
        return {
          name: line,
        };
      });

    setRows(processCompanyItems(items));
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setInputText(content);
        parseInput(content);
        onNotify(`Loaded ${file.name} successfully!`);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
      handleFileUpload(file);
    } else {
      onNotify('Please upload a valid .csv file');
    }
  };

  const handleSlugChange = (rowId: string, newSlug: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const clean = newSlug.trim().toLowerCase();
        return {
          ...r,
          slug: clean,
          status: 'verified',
          peopleLink: buildPeopleUrl(clean, currentRoleKeyword),
          jobsLink: buildJobsUrl(clean),
          isCustomSlug: true,
        };
      })
    );
  };

  const handleToggleStatus = (rowId: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const nextStatus: VerificationStatus = r.status === 'verified' ? 'guess' : 'verified';
        return { ...r, status: nextStatus };
      })
    );
  };

  const handleDeleteRow = (rowId: string) => {
    setRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  const handleClearAll = () => {
    setRows([]);
    setInputText('');
  };

  const handleSaveToDatabase = async (row: WorkspaceRow) => {
    if (!row.slug) {
      onNotify('Cannot save empty slug to database');
      return;
    }
    setSavingId(row.id);
    const newRecord: CompanyRecord = {
      id: row.slug,
      name: row.companyName,
      slug: row.slug,
      category: row.category || 'Custom Outreach',
      linkedInUrl: `https://www.linkedin.com/company/${row.slug}/`,
      careersUrl: row.careersLink,
      verified: true,
      source: 'User Workspace Contribution',
      updatedAt: new Date().toISOString(),
    };

    const res = await saveCompany(newRecord);
    setSavingId(null);
    if (res.success) {
      onCompanyAddedToDb(newRecord);
      onNotify(
        res.cloudSaved
          ? `Saved ${row.companyName} to Cloud Firestore!`
          : `Saved ${row.companyName} to Local Library!`
      );
    } else {
      onNotify(`Failed to save ${row.companyName}`);
    }
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
      onNotify('Failed to copy to clipboard');
    }
  };

  const copyAllLinks = async (type: 'people' | 'jobs') => {
    const validRows = rows.filter((r) => Boolean(r.slug));
    if (validRows.length === 0) return;
    const links = validRows.map((r) => (type === 'people' ? r.peopleLink : r.jobsLink)).join('\n');
    await copyToClipboard(links, `All ${validRows.length} ${type === 'people' ? 'People' : 'Jobs'} links`, `all-${type}`);
  };

  const handleExportCsv = () => {
    if (rows.length === 0) return;

    const exportData = rows.map((r) => ({
      Company: r.companyName,
      Slug: r.slug,
      Status: r.status,
      Category: r.category || 'Outreach',
      'People Link': r.peopleLink,
      'Jobs Link': r.jobsLink,
      'Careers Link': r.careersLink || '',
    }));

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `linkedin-links-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify(`Exported ${rows.length} rows to CSV!`);
  };

  const copyAsGoogleSheetsTsv = async () => {
    const headers = ['Company', 'Slug', 'Status', 'Category', 'People Link', 'Jobs Link', 'Careers'];
    const lines = rows.map((r) => [
      r.companyName,
      r.slug,
      r.status,
      r.category || 'Outreach',
      r.peopleLink,
      r.jobsLink,
      r.careersLink || '',
    ].join('\t'));
    const tsv = [headers.join('\t'), ...lines].join('\n');
    await copyToClipboard(tsv, `${rows.length} workspace rows for Google Sheets (TSV)`, 'tsv-ws');
  };

  const copyAsMarkdownTable = async () => {
    const header = '| Company | Slug | Status | People Link | Jobs Link |\n|---|---|---|---|---|';
    const lines = rows.map((r) => {
      return `| **${r.companyName}** | \`${r.slug}\` | ${r.status} | [People](${r.peopleLink}) | [Jobs](${r.jobsLink}) |`;
    });
    const md = [header, ...lines].join('\n');
    await copyToClipboard(md, `${rows.length} rows as Markdown table`, 'md-ws');
  };

  const verifiedCount = rows.filter((r) => r.status === 'verified').length;
  const guessCount = rows.filter((r) => r.status === 'guess').length;
  const verifiedPercentage = rows.length > 0 ? Math.round((verifiedCount / rows.length) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
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
              Sets search query keywords on all generated People links
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

      {/* Input Section: Paste & Drag-and-drop CSV upload */}
      <div
        className={`glass-card ${isDragging ? 'dropzone-active' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        style={{
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          transition: 'all 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="#06b6d4" /> Build Custom Company Links
            </h2>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
              Paste company names or drop a CSV. Known database entries auto-resolve; unlisted names receive stripped heuristic guesses.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
            {/* AI Prompt Generator Button */}
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsAiPromptModalOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                color: '#fff',
                fontWeight: 700,
                border: 'none',
                boxShadow: '0 2px 14px rgba(6, 182, 212, 0.35)',
              }}
              title="Build an anti-hallucination prompt for ChatGPT, Claude, or Gemini to get custom company lists"
            >
              <Bot size={16} />
              <span>Ask AI (ChatGPT / Claude / Gemini)</span>
            </button>

            {/* CSV File Upload button */}
            <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
              <FileUp size={16} color="#38bdf8" />
              <span>Upload CSV File</span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                  e.target.value = '';
                }}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>

        {/* AI Prompt Callout Banner */}
        <div
          style={{
            padding: '0.75rem 1.15rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(6, 182, 212, 0.08)',
            border: '1px dashed rgba(6, 182, 212, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#67e8f9' }}>
            <Bot size={16} color="#38bdf8" style={{ flexShrink: 0 }} />
            <span>
              <strong>Need target companies?</strong> Generate an anti-hallucination prompt with verified slugs (e.g. CRED=credapp, zero <code>?utm_source</code> params) for ChatGPT, Claude, or Gemini.
            </span>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsAiPromptModalOpen(true)}
            style={{
              fontSize: '0.75rem',
              padding: '0.35rem 0.8rem',
              borderColor: 'rgba(6, 182, 212, 0.4)',
              color: '#38bdf8',
            }}
          >
            ✨ Generate Prompt with 1-Click Launch
          </button>
        </div>

        {/* Textarea */}
        <textarea
          className="input-field"
          rows={4}
          placeholder="Paste company names (one per line) or raw CSV text here...&#10;e.g.&#10;Stripe&#10;CRED&#10;PhonePe&#10;Razorpay&#10;Acme Technologies Ltd"
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            parseInput(e.target.value);
          }}
          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', lineHeight: '1.5' }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
            Automatic database lookup active &bull; Legal suffixes automatically stripped
          </div>

          {rows.length > 0 && (
            <button className="btn btn-outline" onClick={handleClearAll} style={{ fontSize: '0.8rem' }}>
              <Trash2 size={14} /> Clear Workspace
            </button>
          )}
        </div>
      </div>

      {/* Summary Bar with Progress Gauge & Batch Actions */}
      {rows.length > 0 && (
        <div
          className="glass-card"
          style={{
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {rows.length} Companies
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-verified">
                  <CheckCircle2 size={13} /> {verifiedCount} Verified ({verifiedPercentage}%)
                </span>
                <span className="badge badge-guess">
                  <AlertTriangle size={13} /> {guessCount} Guesses
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {/* Speed-Run Button for Workspace List */}
              <button
                className="btn"
                onClick={() => setIsSpeedRunOpen(true)}
                title="Launch high-speed outreach runner for workspace companies"
                style={{
                  fontSize: '0.775rem',
                  padding: '0.45rem 0.95rem',
                  background: 'linear-gradient(135deg, #eab308 0%, #f59e0b 100%)',
                  color: '#000',
                  fontWeight: 800,
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: '0 2px 12px rgba(234, 179, 8, 0.4)',
                  cursor: 'pointer',
                }}
              >
                <Zap size={14} fill="#000" />
                <span>⚡ Speed-Run ({rows.length})</span>
              </button>

              <button
                className="btn btn-secondary"
                onClick={copyAsGoogleSheetsTsv}
                style={{ fontSize: '0.775rem', padding: '0.45rem 0.75rem' }}
                title="Copy all workspace rows to paste into Google Sheets"
              >
                <FileSpreadsheet size={14} color="#34d399" />
                <span>Copy for Sheets</span>
              </button>

              <button
                className="btn btn-secondary"
                onClick={copyAsMarkdownTable}
                style={{ fontSize: '0.775rem', padding: '0.45rem 0.75rem' }}
                title="Copy as Markdown table"
              >
                <FileCode size={14} color="#a5b4fc" />
                <span>Copy Markdown</span>
              </button>

              <button
                className={`btn ${copiedKey === 'all-people' ? 'btn-success' : 'btn-secondary'}`}
                onClick={() => copyAllLinks('people')}
                style={{ fontSize: '0.775rem', padding: '0.45rem 0.75rem' }}
                title="Copy all generated People URLs"
              >
                {copiedKey === 'all-people' ? <Check size={14} /> : <Copy size={14} />}
                <span>Copy All People</span>
              </button>

              <button
                className={`btn ${copiedKey === 'all-jobs' ? 'btn-success' : 'btn-secondary'}`}
                onClick={() => copyAllLinks('jobs')}
                style={{ fontSize: '0.775rem', padding: '0.45rem 0.75rem' }}
                title="Copy all generated Jobs URLs"
              >
                {copiedKey === 'all-jobs' ? <Check size={14} /> : <Copy size={14} />}
                <span>Copy All Jobs</span>
              </button>

              <button className="btn btn-primary" onClick={handleExportCsv} style={{ fontSize: '0.775rem' }}>
                <Download size={14} /> Export CSV
              </button>
            </div>
          </div>

          {/* Verification Progress Bar */}
          <div>
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{ width: `${verifiedPercentage}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Swipe Hint Banner */}
      <div className="table-mobile-hint">
        <span>👈 Swipe horizontally to view all columns & links 👉</span>
      </div>

      {/* Results Table */}
      {rows.length > 0 && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '50px', minWidth: '50px', textAlign: 'center' }}>Verify</th>
                <th style={{ minWidth: '160px' }}>Company</th>
                <th style={{ width: '220px', minWidth: '180px' }}>Slug (Editable)</th>
                <th style={{ minWidth: '110px' }}>Status</th>
                <th style={{ minWidth: '140px' }}>People Link</th>
                <th style={{ minWidth: '130px' }}>Jobs Link</th>
                <th style={{ width: '150px', minWidth: '130px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isPeopleCopied = copiedKey === `ws-people-${row.id}`;
                const isJobsCopied = copiedKey === `ws-jobs-${row.id}`;

                return (
                  <tr key={row.id}>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={row.status === 'verified'}
                        onChange={() => handleToggleStatus(row.id)}
                        aria-label={`Toggle verified state for ${row.companyName}`}
                        title="Mark as Verified / Unverified"
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.925rem' }}>
                          {row.companyName}
                        </span>
                        {row.category && (
                          <span style={{ fontSize: '0.75rem', color: '#a5b4fc', marginTop: '2px' }}>
                            {row.category}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="text"
                          className="input-field"
                          value={row.slug}
                          onChange={(e) => handleSlugChange(row.id, e.target.value)}
                          placeholder="company-slug"
                          aria-label={`LinkedIn slug for ${row.companyName}`}
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.825rem',
                            padding: '0.4rem 0.6rem',
                          }}
                        />
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${row.status === 'verified' ? 'badge-verified' : 'badge-guess'}`}>
                        {row.status === 'verified' ? (
                          <>
                            <CheckCircle2 size={12} /> Verified
                          </>
                        ) : (
                          <>
                            <HelpCircle size={12} /> Guess
                          </>
                        )}
                      </span>
                    </td>
                    <td>
                      {row.slug ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <a
                            href={row.peopleLink}
                            target="_blank"
                            rel="noreferrer"
                            className="action-link"
                            title={`Open People page on LinkedIn${currentRoleKeyword ? ` (${currentRoleKeyword})` : ''}`}
                          >
                            <Users size={14} /> People <ExternalLink size={11} />
                          </a>
                          <button
                            className={`btn ${isPeopleCopied ? 'btn-success' : 'btn-outline'}`}
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => copyToClipboard(row.peopleLink, `${row.companyName} People link`, `ws-people-${row.id}`)}
                            title="Copy People link"
                          >
                            {isPeopleCopied ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td>
                      {row.slug ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <a
                            href={row.jobsLink}
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
                            onClick={() => copyToClipboard(row.jobsLink, `${row.companyName} Jobs link`, `ws-jobs-${row.id}`)}
                            title="Copy Jobs link"
                          >
                            {isJobsCopied ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <a
                          href={row.searchUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="action-link action-link-search"
                          style={{ padding: '0.3rem 0.45rem' }}
                          title="Search Google for true LinkedIn slug"
                        >
                          <Search size={11} />
                        </a>
                        <button
                          className="btn btn-outline"
                          style={{ padding: '0.3rem 0.45rem', color: '#67e8f9', borderColor: 'rgba(6, 182, 212, 0.3)' }}
                          onClick={() => {
                            setMessageCompany({
                              id: row.slug || row.id,
                              name: row.companyName,
                              slug: row.slug,
                              category: row.category || 'Outreach',
                              careersUrl: row.careersLink,
                              verified: row.status === 'verified',
                            });
                            setIsMessageModalOpen(true);
                          }}
                          title="Generate 300-char LinkedIn invitation note"
                        >
                          <MessageSquare size={12} />
                        </button>
                        {onExploreCompany && (
                          <button
                            className="btn btn-outline"
                            style={{ padding: '0.3rem 0.45rem', color: '#a5b4fc', borderColor: 'rgba(99, 102, 241, 0.3)' }}
                            onClick={() =>
                              onExploreCompany({
                                id: row.slug || row.id,
                                name: row.companyName,
                                slug: row.slug,
                                category: row.category || 'Workspace',
                                careersUrl: row.careersLink,
                                verified: row.status === 'verified',
                              })
                            }
                            title="Open live preview and companion window"
                          >
                            <AppWindow size={12} />
                          </button>
                        )}
                        <button
                          className="btn btn-outline"
                          style={{ padding: '0.3rem 0.45rem', color: '#10b981' }}
                          onClick={() => handleSaveToDatabase(row)}
                          title="Save verified company to database"
                          disabled={savingId === row.id}
                        >
                          <Save size={12} />
                        </button>
                        <button
                          className="btn btn-outline"
                          style={{ padding: '0.3rem 0.45rem', color: 'var(--text-muted)' }}
                          onClick={() => handleDeleteRow(row.id)}
                          title="Remove row"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State Prompt */}
      {rows.length === 0 && (
        <div
          className="glass-card"
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FileText size={28} color="#6366f1" />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>No companies loaded yet</h3>
          <p style={{ maxWidth: '520px', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Paste a list of company names above, drag & drop a CSV file, or switch to the <strong>Pre-Verified Catalog</strong> tab to pick from top companies.
          </p>
          <button
            className="btn btn-secondary"
            onClick={() => {
              const sample = 'Microsoft\nGoogle\nNVIDIA\nStripe\nCRED\nPhonePe';
              setInputText(sample);
              parseInput(sample);
            }}
          >
            <Sparkles size={15} color="#38bdf8" /> Try Sample List (6 Companies)
          </button>
        </div>
      )}

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
        companies={rows.map((r, idx) => ({
          id: r.id,
          rank: idx + 1,
          name: r.companyName,
          slug: r.slug,
          category: r.category || 'General',
          careersUrl: r.careersLink,
          verified: r.status === 'verified',
        }))}
        outreachMap={outreachMap}
        onUpdateStatus={handleUpdateStatus}
        onNotify={onNotify}
        initialRoleId={selectedRoleId}
      />

      {/* AI Company List Prompt Generator Modal */}
      <AIPromptGeneratorModal
        isOpen={isAiPromptModalOpen}
        onClose={() => setIsAiPromptModalOpen(false)}
        onNotify={onNotify}
        onLoadCsvIntoWorkspace={(csvText) => {
          setInputText(csvText);
          parseInput(csvText);
          setIsAiPromptModalOpen(false);
        }}
      />
    </div>
  );
};
