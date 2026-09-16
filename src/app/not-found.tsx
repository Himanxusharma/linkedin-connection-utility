import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        backgroundColor: '#030712',
        color: '#f8fafc',
      }}
    >
      <div
        className="glass-card"
        style={{
          maxWidth: '480px',
          padding: '2.5rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
        }}
      >
        <span
          style={{
            fontSize: '3.5rem',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.03em',
          }}
        >
          404
        </span>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Page Not Found</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
          The page or resource you are looking for does not exist.
        </p>
        <Link href="/" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
          <Home size={15} /> Back to Link Builder
        </Link>
      </div>
    </div>
  );
}
