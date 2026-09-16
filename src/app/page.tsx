'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from '../components/Header';
import { CatalogView } from '../components/CatalogView';
import { WorkspaceView } from '../components/WorkspaceView';
import { FirebaseModal } from '../components/FirebaseModal';
import { CompanyExplorerDrawer } from '../components/CompanyExplorerDrawer';
import { CompanyRecord } from '../types/company';
import { getCompanies } from '../lib/firebase';
import { CheckCircle, ShieldAlert } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'workspace'>('catalog');
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState<boolean>(false);
  const [preloadedNames, setPreloadedNames] = useState<string[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Explorer drawer state
  const [selectedCompanyForExplorer, setSelectedCompanyForExplorer] = useState<CompanyRecord | null>(null);
  const [isExplorerOpen, setIsExplorerOpen] = useState<boolean>(false);

  // Load companies on mount (from Cloud Firestore if configured, otherwise seed)
  useEffect(() => {
    async function loadData() {
      const res = await getCompanies();
      setCompanies(res.companies);
    }
    loadData();
  }, []);

  const showToast = (message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
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
      />

      {/* Main Content Area */}
      <div className="container">
        {activeTab === 'catalog' ? (
          <CatalogView
            companies={companies}
            onNotify={showToast}
            onSendToWorkspace={handleSendToWorkspace}
            onExploreCompany={handleOpenExplorer}
          />
        ) : (
          <WorkspaceView
            companiesDb={companies}
            onNotify={showToast}
            preloadedNames={preloadedNames}
            onCompanyAddedToDb={handleCompanyAddedToDb}
            onExploreCompany={handleOpenExplorer}
          />
        )}
      </div>

      {/* Side-by-Side Company Explorer Drawer */}
      <CompanyExplorerDrawer
        company={selectedCompanyForExplorer}
        isOpen={isExplorerOpen}
        onClose={() => setIsExplorerOpen(false)}
        onNotify={showToast}
      />

      {/* Firebase Info Modal */}
      <FirebaseModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
        companiesCount={companies.length}
      />

      {/* Floating Toast Notifications */}
      <div className="toast-container">
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
