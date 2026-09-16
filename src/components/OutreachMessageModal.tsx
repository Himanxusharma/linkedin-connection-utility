'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Sparkles,
  MessageSquare,
  Users,
  ExternalLink,
  AlertCircle,
  Briefcase,
  UserCheck,
  Send,
} from 'lucide-react';
import { CompanyRecord } from '../types/company';
import { buildPeopleUrl } from '../lib/slug-heuristics';

interface OutreachMessageModalProps {
  company: CompanyRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onNotify: (msg: string) => void;
  targetRoleKeyword?: string;
}

interface TemplateOption {
  id: string;
  title: string;
  description: string;
  text: string;
}

export const OutreachMessageModal: React.FC<OutreachMessageModalProps> = ({
  company,
  isOpen,
  onClose,
  onNotify,
  targetRoleKeyword,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('referral');
  const [message, setMessage] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const templates: TemplateOption[] = [
    {
      id: 'referral',
      title: 'Job Referral / Inquiry',
      description: 'Polite note to an engineer or lead asking to connect about hiring',
      text: `Hi [Name], loved following {Company}'s work in {Category}. As a software engineer following your team's engineering journey, I'd love to connect and keep in touch regarding open opportunities!`,
    },
    {
      id: 'recruiter',
      title: 'Recruiter Outreach',
      description: 'Direct, professional intro for talent acquisition leads',
      text: `Hi [Name], reaching out to connect regarding engineering roles at {Company}. Would love to share my background and see if my skills align with any upcoming priorities on your team!`,
    },
    {
      id: 'partnership',
      title: 'Founder / Peer Connect',
      description: 'High-level networking note for leaders and founders',
      text: `Hi [Name], inspired by {Company}'s innovation in {Category}. Always looking to connect with builders and exchange ideas around scaling high-impact technology products!`,
    },
    {
      id: 'custom',
      title: 'Blank Note',
      description: 'Write your own custom note from scratch',
      text: `Hi [Name], noticed your work at {Company}. Would love to connect and follow your journey!`,
    },
  ];

  // Whenever company or template changes, generate message
  useEffect(() => {
    if (company) {
      const tmpl = templates.find((t) => t.id === selectedTemplate) || templates[0];
      const filled = tmpl.text
        .replace(/\{Company\}/g, company.name)
        .replace(/\{Category\}/g, company.category.split('/')[0].trim());
      setMessage(filled);
    }
  }, [company, selectedTemplate]);

  if (!isOpen || !company) return null;

  const charCount = message.length;
  const isOverLimit = charCount > 300;
  const peopleUrl = buildPeopleUrl(company.slug, targetRoleKeyword);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      onNotify('Connection note copied to clipboard!');
      setTimeout(() => setCopied(false), 1800);
    } catch {
      onNotify('Failed to copy note');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.8)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 1100,
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
          width: '100%',
          maxWidth: '640px',
          padding: '2rem',
          position: 'relative',
          backgroundColor: '#0A0F1D',
          borderColor: 'rgba(99, 102, 241, 0.4)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(99, 102, 241, 0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close dialog"
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
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
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <MessageSquare size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>
              LinkedIn Connection Note Generator
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              Outreach template tailored for <strong>{company.name}</strong>
            </p>
          </div>
        </div>

        {/* Template Selector Chips */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
            Select Message Goal:
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {templates.map((t) => {
              const active = selectedTemplate === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t.id)}
                  style={{
                    background: active ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'rgba(30, 41, 59, 0.6)',
                    color: active ? '#ffffff' : 'var(--text-secondary)',
                    border: active ? '1px solid #818cf8' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.4rem 0.75rem',
                    fontSize: '0.775rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {t.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* Textarea */}
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <textarea
            className="input-field"
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{
              fontFamily: 'inherit',
              fontSize: '0.9rem',
              lineHeight: '1.5',
              paddingBottom: '2.25rem',
              borderColor: isOverLimit ? '#ef4444' : undefined,
            }}
          />

          {/* Character counter (LinkedIn 300 char rule) */}
          <div
            style={{
              position: 'absolute',
              bottom: '0.75rem',
              right: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              color: isOverLimit ? '#ef4444' : charCount > 270 ? '#fbbf24' : '#34d399',
              fontWeight: 600,
            }}
          >
            {isOverLimit && <AlertCircle size={13} />}
            <span>
              {charCount} / 300 chars
            </span>
          </div>
        </div>

        {isOverLimit && (
          <div
            style={{
              fontSize: '0.775rem',
              color: '#f87171',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <AlertCircle size={14} /> Note exceeds LinkedIn&apos;s 300-character invitation limit by {charCount - 300} characters.
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <a
            href={peopleUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
            style={{ fontSize: '0.825rem' }}
            title="Open LinkedIn People page to send invitation"
          >
            <Users size={14} color="#38bdf8" />
            <span>Open {company.name} People Page</span>
            <ExternalLink size={12} />
          </a>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={handleCopy}
              className={`btn ${copied ? 'btn-success' : 'btn-primary'}`}
              style={{ minWidth: '130px' }}
            >
              {copied ? (
                <>
                  <Check size={14} /> Copied Note!
                </>
              ) : (
                <>
                  <Copy size={14} /> Copy 300-Char Note
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
