'use client';

import React from 'react';
import {
  CheckCircle2,
  Copy,
  Star,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';

export type ToastType = 'success' | 'info' | 'warning' | 'error' | 'star' | 'copy';

export interface ToastItem {
  id: string;
  message: string;
  type?: ToastType;
}

interface ToastNotificationProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  toasts,
  onDismiss,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="toast-container"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.625rem',
        pointerEvents: 'none',
        maxWidth: '420px',
      }}
    >
      {toasts.map((toast) => {
        const type = toast.type || 'info';

        let borderColor = 'rgba(99, 102, 241, 0.4)';
        let shadowColor = 'rgba(99, 102, 241, 0.2)';
        let progressBarColor = '#818cf8';
        let icon = <Info size={16} color="#818cf8" style={{ flexShrink: 0 }} />;

        if (type === 'success') {
          borderColor = 'rgba(52, 211, 153, 0.45)';
          shadowColor = 'rgba(52, 211, 153, 0.25)';
          progressBarColor = '#34d399';
          icon = <CheckCircle2 size={16} color="#34d399" style={{ flexShrink: 0 }} />;
        } else if (type === 'star') {
          borderColor = 'rgba(250, 204, 21, 0.5)';
          shadowColor = 'rgba(250, 204, 21, 0.3)';
          progressBarColor = '#facc15';
          icon = <Star size={16} color="#facc15" fill="#facc15" style={{ flexShrink: 0 }} />;
        } else if (type === 'copy') {
          borderColor = 'rgba(56, 189, 248, 0.45)';
          shadowColor = 'rgba(56, 189, 248, 0.25)';
          progressBarColor = '#38bdf8';
          icon = <Copy size={16} color="#38bdf8" style={{ flexShrink: 0 }} />;
        } else if (type === 'warning') {
          borderColor = 'rgba(251, 191, 36, 0.5)';
          shadowColor = 'rgba(251, 191, 36, 0.25)';
          progressBarColor = '#fbbf24';
          icon = <AlertTriangle size={16} color="#fbbf24" style={{ flexShrink: 0 }} />;
        } else if (type === 'error') {
          borderColor = 'rgba(244, 63, 94, 0.5)';
          shadowColor = 'rgba(244, 63, 94, 0.25)';
          progressBarColor = '#f43f5e';
          icon = <AlertCircle size={16} color="#f43f5e" style={{ flexShrink: 0 }} />;
        }

        return (
          <div
            key={toast.id}
            className="toast"
            onClick={() => onDismiss(toast.id)}
            style={{
              pointerEvents: 'auto',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              background: 'rgba(10, 15, 29, 0.94)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: `1px solid ${borderColor}`,
              boxShadow: `0 10px 30px rgba(0, 0, 0, 0.6), 0 0 15px ${shadowColor}`,
              borderRadius: 'var(--radius-lg)',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              color: '#f8fafc',
              fontSize: '0.84rem',
              fontWeight: 600,
              minWidth: '260px',
              animation: 'toastSlideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              transition: 'all 0.15s ease',
            }}
            title="Click to dismiss"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1 }}>
              {icon}
              <span style={{ lineHeight: 1.4, wordBreak: 'break-word' }}>
                {toast.message}
              </span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(toast.id);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                flexShrink: 0,
                opacity: 0.7,
                transition: 'opacity 0.15s ease',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.7')}
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>

            {/* Time Remaining Animated Progress Bar */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: '2.5px',
                backgroundColor: progressBarColor,
                opacity: 0.85,
                animation: 'toastProgress 3.2s linear forwards',
              }}
            />
          </div>
        );
      })}
    </div>
  );
};
