'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from '../components/Header';
import { CatalogView } from '../components/CatalogView';
import { WorkspaceView } from '../components/WorkspaceView';
import { CompanyExplorerDrawer } from '../components/CompanyExplorerDrawer';
import { FirebaseModal } from '../components/FirebaseModal';
import { KeyboardShortcutsModal } from '../components/KeyboardShortcutsModal';
import { CompanyRecord } from '../types/company';
import seedCompanies from '../data/seed-companies.json';
import { CheckCircle, ShieldAlert } from 'lucide-react';

interface ToastItem {
  id: string;
  message: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'workspace'>('catalog');
  const [companies, setCompanies] = useState<CompanyRecord[]>(seedCompanies as CompanyRecord[]);
  const [preloadedNames, setPreloadedNames] = useState<string[]>([]);
  const [selectedCompanyForExplorer, setSelectedCompanyForExplorer] = useState<CompanyRecord | null>(null);
  const [isExplorerOpen, setIsExplorerOpen] = useState<boolean>(false);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Starred / Bookmarked Companies state
  const [starredSet, setStarredSet] = useState<Set<string>>(new Set());

  // Personal Company Notes state
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});

  // Load Starred and Notes on mount
  useEffect(() => {
    try {
      const savedStarred = localStorage.getItem('linkbuilder_starred');
      if (savedStarred) setStarredSet(new Set(JSON.parse(savedStarred)));

      const savedNotes = localStorage.getItem('linkbuilder_company_notes');
      if (savedNotes) setNotesMap(JSON.parse(savedNotes));
    } catch {
      // ignore
    }
  }, []);

  const handleToggleStar = (companyKey: string) => {
    setStarredSet((prev) => {
      const next = new Set(prev);
      if (next.has(companyKey)) {
        next.delete(companyKey);
        showToast('Removed from Starred');
      } else {
        next.add(companyKey);
        showToast('⭐ Added to Starred Companies!');
      }
      try {
        localStorage.setItem('linkbuilder_starred', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  const handleUpdateNotes = (companyKey: string, noteText: string) => {
    setNotesMap((prev) => {
      const next = { ...prev, [companyKey]: noteText };
      try {
        localStorage.setItem('linkbuilder_company_notes', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Global '?' key listener for Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = (message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  const handleSendToWorkspace = (names: string[]) => {
    setPreloadedNames(names);
    setActiveTab('workspace');
  };

  const handleCompanyAddedToDb = (newComp: CompanyRecord) => {
    setCompanies((prev) => {
      const filtered = prev.filter((c) => c.name.toLowerCase() !== newComp.name.toLowerCase());
      return [newComp, ...filtered];
    });
  };

  const handleOpenExplorer = (company: CompanyRecord) => {
    setSelectedCompanyForExplorer(company);
    setIsExplorerOpen(true);
  };

  const totalCategories = useMemo(() => {
    const set = new Set<string>();
    companies.forEach((c) => {
      if (c.category) {
        const primary = c.category.split('/')[0].trim();
        set.add(primary);
      }
    });
    return set.size;
  }, [companies]);

  return (
    <main style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
      {/* App Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        totalCompanies={companies.length}
        totalCategories={totalCategories}
        onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* Main Content Area */}
      <div className="container" id="main-content">
        {activeTab === 'catalog' ? (
          <CatalogView
            companies={companies}
            onNotify={showToast}
            onSendToWorkspace={handleSendToWorkspace}
            onExploreCompany={handleOpenExplorer}
            starredSet={starredSet}
            onToggleStar={handleToggleStar}
            notesMap={notesMap}
            onUpdateNotes={handleUpdateNotes}
          />
        ) : (
          <WorkspaceView
            companiesDb={companies}
            onNotify={showToast}
            preloadedNames={preloadedNames}
            onCompanyAddedToDb={handleCompanyAddedToDb}
            onExploreCompany={handleOpenExplorer}
            starredSet={starredSet}
            onToggleStar={handleToggleStar}
            notesMap={notesMap}
            onUpdateNotes={handleUpdateNotes}
          />
        )}
      </div>

      {/* Side-by-Side Company Explorer Drawer */}
      <CompanyExplorerDrawer
        company={selectedCompanyForExplorer}
        isOpen={isExplorerOpen}
        onClose={() => setIsExplorerOpen(false)}
        onNotify={showToast}
        isStarred={selectedCompanyForExplorer ? starredSet.has(selectedCompanyForExplorer.slug || selectedCompanyForExplorer.name) : false}
        onToggleStar={() => selectedCompanyForExplorer && handleToggleStar(selectedCompanyForExplorer.slug || selectedCompanyForExplorer.name)}
        notes={selectedCompanyForExplorer ? notesMap[selectedCompanyForExplorer.slug || selectedCompanyForExplorer.name] || '' : ''}
        onSaveNotes={(n) => selectedCompanyForExplorer && handleUpdateNotes(selectedCompanyForExplorer.slug || selectedCompanyForExplorer.name, n)}
      />

      {/* Firebase Info Modal */}
      <FirebaseModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
        companiesCount={companies.length}
      />

      {/* Keyboard Shortcuts Cheat Sheet Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Floating Toast Notifications with ARIA live announcement */}
      <div className="toast-container" role="status" aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            <CheckCircle size={16} color="#34d399" />
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Footer / ToS note */}
      <footer
        style={{
          marginTop: '4rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.8rem',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '2rem',
        }}
      >
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
          <p>
            Link Builder Pro is an outreach & research utility. All outbound links open user-initiated LinkedIn pages in new tabs.
          </p>
          <p style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <ShieldAlert size={14} color="#f59e0b" />
            Zero bots · Zero scraping · Fully compliant with LinkedIn Terms of Service. Ready for 1-click Vercel deployment.
          </p>
        </div>
      </footer>
    </main>
  );
}
