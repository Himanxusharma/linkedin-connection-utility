'use client';

import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  X,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Bot,
  Zap,
  Globe,
  Building,
  Target,
  Users,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface AIPromptGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify: (msg: string) => void;
  onLoadCsvIntoWorkspace?: (csvText: string) => void;
}

export const AIPromptGeneratorModal: React.FC<AIPromptGeneratorModalProps> = ({
  isOpen,
  onClose,
  onNotify,
  onLoadCsvIntoWorkspace,
}) => {
  // Input fields for user customization
  const [industry, setIndustry] = useState<string>('Fintech & Payments');
  const [customIndustry, setCustomIndustry] = useState<string>('');
  const [location, setLocation] = useState<string>('India (Bengaluru, Mumbai, Delhi NCR)');
  const [customLocation, setCustomLocation] = useState<string>('');
  const [stage, setStage] = useState<string>('High-Growth Startups (Seed to Series B)');
  const [listSizeOption, setListSizeOption] = useState<string>('30');
  const [customListSize, setCustomListSize] = useState<string>('40');
  const [targetRole, setTargetRole] = useState<string>('Software Engineers & Tech Leads');
  const [customTargetRole, setCustomTargetRole] = useState<string>('');
  const [pureProductOnly, setPureProductOnly] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const finalIndustry = industry === 'Custom' ? (customIndustry.trim() || 'Tech Startups') : industry;
  const finalLocation = location === 'Custom' ? (customLocation.trim() || 'Global') : location;
  const finalTargetRole = targetRole === 'Custom' ? (customTargetRole.trim() || 'Software Engineers') : targetRole;

  // Effective company count (custom or preset)
  const effectiveCount = useMemo(() => {
    if (listSizeOption === 'Custom') {
      const parsed = parseInt(customListSize, 10);
      if (isNaN(parsed) || parsed < 1) return 30;
      return Math.min(parsed, 200); // capped at 200 to prevent LLM context overflows
    }
    return parseInt(listSizeOption, 10) || 30;
  }, [listSizeOption, customListSize]);

  // Master Anti-Hallucination & Verified Slug Prompt Generator
  const generatedPrompt = useMemo(() => {
    return `You are a specialized corporate research and talent sourcing AI. Generate a verified, exhaustive list of EXACTLY ${effectiveCount} distinct companies in the "${finalIndustry}" sector based in or hiring across "${finalLocation}".

TARGET PROFILE & PARAMETERS:
- Sector / Domain: ${finalIndustry}
- Geographic Focus: ${finalLocation}
- Growth Stage: ${stage}
- Primary Hiring Persona: ${finalTargetRole}
${pureProductOnly ? '- Company Classification: Pure-play product & technology innovators ONLY (strictly NO IT services, staffing agencies, body shops, or general outsourcing consultancies).' : ''}

OUTPUT SPECIFICATIONS (STRICT & CRITICAL):
1. Raw CSV Only: Output ONLY valid raw CSV formatted inside a single \`\`\`csv code block. Do NOT write any conversational intro, greeting, preambles, or postscript explanations (e.g. do not write "Here is the list...").
2. Exact 5-Column CSV Header Row:
Company,Category,Slug,LinkedIn URL,Careers URL

3. ZERO TRACKING PARAMETERS (STRICT ENFORCEMENT):
- NEVER append tracking queries like "?utm_source=chatgpt.com", "?utm_medium=...", "?trk=...", or query strings to any URL.
- Every URL must be a clean, canonical URL ending with a trailing slash (e.g. "https://www.linkedin.com/company/stripe/").

4. VERIFIED REGISTERED LINKEDIN SLUGS (ZERO HALLUCINATIONS):
You must output the real registered LinkedIn company URL slug, NOT an assumed name or generic abbreviation.
Real-world Slug Accuracy Benchmarks:
• CRED -> Official registered slug is "credapp" (https://www.linkedin.com/company/credapp/) [NOT "cred"]
• OneCard -> Official registered slug is "fpl-technologies" (https://www.linkedin.com/company/fpl-technologies/) [NOT "onecard"]
• PhonePe -> Official registered slug is "phonepe-internet" (https://www.linkedin.com/company/phonepe-internet/) [NOT "phonepe"]
• Zepto -> Official registered slug is "zeptonow" (https://www.linkedin.com/company/zeptonow/) [NOT "zepto"]
• Groww -> Official registered slug is "groww.in" (https://www.linkedin.com/company/groww.in/) [NOT "groww"]
• Swiggy -> Official registered slug is "swiggy-in" (https://www.linkedin.com/company/swiggy-in/) [NOT "swiggy"]
• Postman -> Official registered slug is "postman-platform" (https://www.linkedin.com/company/postman-platform/) [NOT "postman"]
• Razorpay -> Official registered slug is "razorpay" (https://www.linkedin.com/company/razorpay/)
• Zerodha -> Official registered slug is "zerodha" (https://www.linkedin.com/company/zerodha/)
• Stripe -> Official registered slug is "stripe" (https://www.linkedin.com/company/stripe/)
• Datadog -> Official registered slug is "datadog" (https://www.linkedin.com/company/datadog/)
• Snowflake -> Official registered slug is "snowflake-computing" (https://www.linkedin.com/company/snowflake-computing/) [NOT "snowflake"]

5. OFFICIAL CAREERS PORTAL:
Provide the company's official job portal or ATS career page (e.g. "https://careers.company.com/" or Greenhouse / Lever / Ashby / Workday portal). If unverified, leave the field empty. NEVER generate dummy or placeholder URLs (such as "https://careers.example.com") and never write "N/A" or "None".

6. COMPLETENESS & DATA INTEGRITY:
- Provide all ${effectiveCount} rows without stopping halfway or omitting entries.
- If a company name contains a comma, enclose the name in double quotes (e.g., "Example, Inc.").

Example Format:
Stripe,Fintech,stripe,https://www.linkedin.com/company/stripe/,https://stripe.com/jobs
CRED,Fintech,credapp,https://www.linkedin.com/company/credapp/,https://careers.cred.club/

Generate all ${effectiveCount} verified companies now in strict CSV:`;
  }, [effectiveCount, stage, finalIndustry, finalLocation, finalTargetRole, pureProductOnly]);

  if (!isOpen) return null;

  const copyPromptToClipboard = async (notify = true) => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      if (notify) onNotify(`📋 AI Prompt (${effectiveCount} companies) copied! Paste into ChatGPT, Gemini, or Claude.`);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      onNotify('Failed to copy to clipboard');
    }
  };

  // Launch handlers for AI services
  const handleLaunchChatGPT = () => {
    copyPromptToClipboard(false);
    const url = `https://chatgpt.com/?q=${encodeURIComponent(generatedPrompt)}`;
    window.open(url, '_blank');
    onNotify('🚀 Opened ChatGPT with auto-typed prompt! (Also copied to clipboard)');
  };

  const handleLaunchClaude = () => {
    copyPromptToClipboard(false);
    const url = `https://claude.ai/new?q=${encodeURIComponent(generatedPrompt)}`;
    window.open(url, '_blank');
    onNotify('✨ Opened Claude with prompt! (Also copied to clipboard)');
  };

  const handleLaunchGemini = () => {
    copyPromptToClipboard(false);
    window.open('https://gemini.google.com/app', '_blank');
    onNotify('💎 Copied prompt to clipboard! Paste directly into Gemini.');
  };

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
          maxWidth: '820px',
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
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'linear-gradient(90deg, rgba(30, 27, 75, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 0 18px rgba(6, 182, 212, 0.4)',
                flexShrink: 0,
              }}
            >
              <Bot size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                  AI Company List Prompt Builder
                </h2>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                  }}
                >
                  Verified Real Slugs
                </span>
              </div>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Configure parameters to generate a zero-hallucination prompt, then launch directly in ChatGPT, Claude, or Gemini.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-outline"
            style={{ padding: '0.4rem', borderRadius: '50%', color: 'var(--text-muted)' }}
            title="Close (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {/* Main Input Controls Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              padding: '1.25rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {/* 1. Target Industry */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '0.4rem' }}>
                <Building size={13} /> Target Industry / Domain
              </label>
              <select
                className="input-field"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem' }}
              >
                <option value="Fintech & Payments">Fintech & Payments</option>
                <option value="AI & Machine Learning / LLMs">AI & Machine Learning / LLMs</option>
                <option value="Enterprise SaaS & Cloud Infrastructure">Enterprise SaaS & Cloud Infrastructure</option>
                <option value="Banking & Neobanks">Banking & Neobanks</option>
                <option value="Cybersecurity & DevSecOps">Cybersecurity & DevSecOps</option>
                <option value="E-Commerce & Quick Commerce">E-Commerce & Quick Commerce</option>
                <option value="HealthTech & BioTech">HealthTech & BioTech</option>
                <option value="Crypto, Web3 & Blockchain">Crypto, Web3 & Blockchain</option>
                <option value="Custom">Other / Custom...</option>
              </select>
              {industry === 'Custom' && (
                <input
                  type="text"
                  className="input-field"
                  placeholder="Enter specific industry..."
                  value={customIndustry}
                  onChange={(e) => setCustomIndustry(e.target.value)}
                  style={{ marginTop: '0.5rem', fontSize: '0.8rem', padding: '0.35rem 0.6rem' }}
                />
              )}
            </div>

            {/* 2. Geographic Location */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6ee7b7', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '0.4rem' }}>
                <Globe size={13} /> Location / Region
              </label>
              <select
                className="input-field"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem' }}
              >
                <option value="India (Bengaluru, Mumbai, Delhi NCR)">India (Bengaluru, Mumbai, Delhi NCR)</option>
                <option value="United States (SF Bay Area, NYC, Seattle, Austin)">United States (SF Bay Area, NYC, Seattle)</option>
                <option value="Europe & UK (London, Berlin, Amsterdam)">Europe & UK (London, Berlin, Amsterdam)</option>
                <option value="Southeast Asia (Singapore, Jakarta)">Southeast Asia (Singapore, Jakarta)</option>
                <option value="Global / Remote-First">Global / Remote-First</option>
                <option value="Custom">Other / Specific City...</option>
              </select>
              {location === 'Custom' && (
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Toronto, Canada"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  style={{ marginTop: '0.5rem', fontSize: '0.8rem', padding: '0.35rem 0.6rem' }}
                />
              )}
            </div>

            {/* 3. Company Stage & Count */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fde047', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '0.4rem' }}>
                <Layers size={13} /> Company Stage
              </label>
              <select
                className="input-field"
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem' }}
              >
                <option value="High-Growth Startups (Seed to Series B)">High-Growth Startups (Seed to Series B)</option>
                <option value="Late-Stage & Unicorns (Series C+ to Pre-IPO)">Late-Stage & Unicorns (Series C+)</option>
                <option value="Top Enterprise & Public Tech Titans">Top Enterprise & Public Titans</option>
                <option value="All Stages & Market Leaders">All Stages & Market Leaders</option>
              </select>
            </div>

            {/* 4. Number of Companies */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c084fc', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Target size={13} /> List Size: <span style={{ color: '#f8fafc', fontWeight: 800 }}>{effectiveCount} companies</span>
                </label>
              </div>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {['15', '30', '50', '100', 'Custom'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setListSizeOption(opt)}
                    className={`btn ${listSizeOption === opt ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, minWidth: '45px', padding: '0.35rem 0.5rem', fontSize: '0.775rem' }}
                  >
                    {opt === 'Custom' ? 'Custom...' : opt}
                  </button>
                ))}
              </div>
              {listSizeOption === 'Custom' && (
                <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="number"
                    min={5}
                    max={200}
                    className="input-field"
                    placeholder="Enter custom count (e.g. 40, 75)..."
                    value={customListSize}
                    onChange={(e) => setCustomListSize(e.target.value)}
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem', flex: 1 }}
                  />
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    (5 to 200 max)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Target Role & Persona */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                🎯 Target Hiring Persona:
              </span>
              {[
                'Software Engineers & Tech Leads',
                'Product Managers',
                'Data Science & AI/ML',
                'Recruiters & Talent Leads',
                'Founders & Execs',
                'Custom',
              ].map((r) => (
                <button
                  key={r}
                  onClick={() => setTargetRole(r)}
                  style={{
                    background: targetRole === r ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    color: targetRole === r ? '#a5b4fc' : 'var(--text-secondary)',
                    border: targetRole === r ? '1px solid #818cf8' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-full)',
                    padding: '0.25rem 0.65rem',
                    fontSize: '0.725rem',
                    cursor: 'pointer',
                    fontWeight: targetRole === r ? 700 : 500,
                  }}
                >
                  {r === 'Custom' ? '✏️ Custom Persona...' : r}
                </button>
              ))}
            </div>
            {targetRole === 'Custom' && (
              <input
                type="text"
                className="input-field"
                placeholder="Enter specific hiring role (e.g. Founding Full-Stack Engineer, Staff Cloud Architect, Growth Lead)..."
                value={customTargetRole}
                onChange={(e) => setCustomTargetRole(e.target.value)}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
              />
            )}
          </div>

          {/* Pure Product Companies Filter Checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.775rem',
                color: '#cbd5e1',
                cursor: 'pointer',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <input
                type="checkbox"
                checked={pureProductOnly}
                onChange={(e) => setPureProductOnly(e.target.checked)}
                style={{ accentColor: '#6366f1', cursor: 'pointer' }}
              />
              <span>Exclude IT Services & Body Shops (Strictly Pure Product / Tech Innovators)</span>
            </label>
          </div>

          {/* Strict Validation Anti-Tracking Callout */}
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '0.775rem',
              color: '#34d399',
            }}
          >
            <ShieldCheck size={18} style={{ flexShrink: 0 }} />
            <div>
              <strong>Includes Anti-Hallucination Directives:</strong> Explicitly commands LLMs to verify real LinkedIn slugs (e.g. <code>credapp</code> for CRED, <code>fpl-technologies</code> for OneCard) and strictly forbids tracking parameters (<code>?utm_source=chatgpt.com</code>).
            </div>
          </div>

          {/* AI Redirection Bar with Brand Logos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Launch Directly into AI with Prompt Auto-Passed:
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              {/* ChatGPT Button */}
              <button
                onClick={handleLaunchChatGPT}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1rem',
                  backgroundColor: 'rgba(16, 163, 127, 0.15)',
                  border: '1px solid rgba(16, 163, 127, 0.45)',
                  color: '#10a37f',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  boxShadow: '0 4px 15px rgba(16, 163, 127, 0.15)',
                }}
                title="Open in ChatGPT with prompt auto-typed in search bar"
              >
                {/* OpenAI / ChatGPT SVG Sign */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.475 4.475 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.5045 4.5045 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4702 4.4702 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.6669zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.6613zm-12.6413 4.135l-2.02-1.1639a.0804.0804 0 0 1-.038-.052V6.0669a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L6.7037 5.452a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.6069 1.4997-2.602-1.4997z"/>
                </svg>
                <span>ChatGPT (Auto-Typed)</span>
                <ExternalLink size={13} />
              </button>

              {/* Claude Button */}
              <button
                onClick={handleLaunchClaude}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1rem',
                  backgroundColor: 'rgba(217, 119, 6, 0.15)',
                  border: '1px solid rgba(217, 119, 6, 0.45)',
                  color: '#fbbf24',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  boxShadow: '0 4px 15px rgba(217, 119, 6, 0.15)',
                }}
                title="Open in Claude with prompt"
              >
                <Bot size={18} color="#fbbf24" />
                <span>Claude</span>
                <ExternalLink size={13} />
              </button>

              {/* Gemini Button */}
              <button
                onClick={handleLaunchGemini}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1rem',
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.45)',
                  color: '#38bdf8',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  boxShadow: '0 4px 15px rgba(56, 189, 248, 0.15)',
                }}
                title="Copy prompt & open Google Gemini"
              >
                <Sparkles size={18} color="#38bdf8" />
                <span>Gemini</span>
                <ExternalLink size={13} />
              </button>
            </div>
          </div>

          {/* Generated Prompt Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Prompt Preview:
              </span>
              <button
                onClick={() => copyPromptToClipboard(true)}
                className={`btn ${copied ? 'btn-success' : 'btn-secondary'}`}
                style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                <span>{copied ? 'Copied Prompt!' : 'Copy Prompt'}</span>
              </button>
            </div>

            <textarea
              readOnly
              className="input-field"
              rows={7}
              value={generatedPrompt}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.775rem',
                lineHeight: '1.55',
                backgroundColor: 'rgba(10, 15, 26, 0.95)',
                borderColor: 'rgba(99, 102, 241, 0.3)',
                color: '#cbd5e1',
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
            💡 Once AI gives you the CSV, simply copy and paste it into the Workspace box above.
          </span>
          <button
            className="btn btn-secondary"
            onClick={onClose}
            style={{ fontSize: '0.8rem', padding: '0.45rem 1rem' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
