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
  const [userRole, setUserRole] = useState<string>('Software Engineer');
  const [recipientName, setRecipientName] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    try {
      const savedRole = localStorage.getItem('linkbuilder_user_role');
      if (savedRole) {
        setUserRole(savedRole);
      } else if (targetRoleKeyword) {
        setUserRole(targetRoleKeyword);
      }
    } catch {
      // ignore
    }
  }, [targetRoleKeyword]);

  const handleRoleChange = (val: string) => {
    setUserRole(val);
    try {
      localStorage.setItem('linkbuilder_user_role', val);
    } catch {}
  };

  const templates: TemplateOption[] = [
    {
      id: 'referral',
      title: 'Job Referral / Inquiry',
      description: 'Polite note to a team member or lead asking to connect about hiring',
      text: `Hi {Name}, loved following {Company}'s work in {Category}. As a {Role} following your team's journey, I'd love to connect and keep in touch regarding open opportunities!`,
    },
    {
      id: 'recruiter',
      title: 'Recruiter Outreach',
      description: 'Direct, professional intro for talent acquisition leads',
      text: `Hi {Name}, reaching out to connect regarding {Role} opportunities at {Company}. Would love to share my background and see if my skills align with any upcoming priorities on your team!`,
    },
    {
      id: 'alumni',
      title: 'Alumni Network',
      description: 'Warm outreach leveraging shared college or community connection',
      text: `Hi {Name}, noticed we share an alumni connection and that you're at {Company}. As a fellow grad and {Role}, I'd love to connect and learn more about your experience there!`,
    },
    {
      id: 'manager',
      title: 'Hiring Manager Pitch',
      description: 'High-impact value proposition note for team leads and directors',
      text: `Hi {Name}, inspired by {Company}'s growth in {Category}. As a {Role} passionate about this space, I'd love to connect and exchange ideas on building scalable solutions!`,
    },
    {
      id: 'followup',
      title: 'Application Follow-Up',
      description: 'Polite follow-up note after applying to an official job opening',
      text: `Hi {Name}, I recently applied for the {Role} opening at {Company}. Reaching out to express my genuine enthusiasm and connect with the team!`,
    },
    {
      id: 'peer',
      title: 'Peer / Coffee Chat',
      description: 'Low-pressure informational connection note',
      text: `Hi {Name}, really admire your work at {Company}. Would love to connect and follow your journey as a fellow builder in tech!`,
    },
    {
      id: 'custom',
      title: 'Blank Note',
      description: 'Write your own custom note from scratch',
      text: `Hi {Name}, noticed your work at {Company}. Would love to connect and follow your journey!`,
    },
  ];

  // Whenever company, template, userRole, or recipientName changes, generate message
  useEffect(() => {
    if (company) {
      const tmpl = templates.find((t) => t.id === selectedTemplate) || templates[0];
      const nameReplacement = recipientName.trim() || '[Name]';
      const roleReplacement = userRole.trim() || 'software engineer';
      const categoryReplacement = company.category ? company.category.split('/')[0].trim() : 'tech';

      const filled = tmpl.text
        .replace(/\{Name\}/g, nameReplacement)
        .replace(/\{Role\}/g, roleReplacement)
        .replace(/\{Company\}/g, company.name)
        .replace(/\{Category\}/g, categoryReplacement);
      setMessage(filled);
    }
  }, [company, selectedTemplate, userRole, recipientName]);

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

        {/* Dynamic Personalization Inputs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.75rem',
            marginBottom: '1rem',
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <label style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
              My Target Role / Title:
            </label>
            <input
              type="text"
              className="input-field"
              value={userRole}
              onChange={(e) => handleRoleChange(e.target.value)}
              placeholder="e.g. Software Engineer, Product Manager"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
              Recipient Name (Optional):
            </label>
            <input
              type="text"
              className="input-field"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="e.g. Alex (replaces [Name])"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem' }}
            />
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
