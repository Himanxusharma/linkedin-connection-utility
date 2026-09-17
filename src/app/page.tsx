'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from '../components/Header';
import { CatalogView } from '../components/CatalogView';
import { WorkspaceView } from '../components/WorkspaceView';
import { CompanyExplorerDrawer } from '../components/CompanyExplorerDrawer';
import { FirebaseModal } from '../components/FirebaseModal';
import { KeyboardShortcutsModal } from '../components/KeyboardShortcutsModal';
import { DataBackupModal } from '../components/DataBackupModal';
import { CompanionDock } from '../components/CompanionDock';
import { OutreachMessageModal } from '../components/OutreachMessageModal';
import { SplitScreenGuideModal } from '../components/SplitScreenGuideModal';
import { ToastNotification, ToastItem, ToastType } from '../components/ToastNotification';
import { CompanyRecord, OutreachStatus, UserOutreachData } from '../types/company';
import { LinkOpenMode, getSavedLinkOpenMode, saveLinkOpenMode, openOutreachUrl } from '../lib/navigation';
import { getUserData, saveUserData, isFirebaseConfigured } from '../lib/firebase';
import {
  getStoredStarredSet,
  saveStoredStarredSet,
  getStoredNotesMap,
  saveStoredNotesMap,
  getStoredOutreachMap,
  saveStoredOutreachMap,
  getStoredCustomCompanies,
  saveStoredCustomCompanies,
  createDebouncedSync,
} from '../lib/storage';
import { useUser } from '@clerk/nextjs';
import seedCompanies from '../data/seed-companies.json';
import { ShieldAlert, Heart } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'workspace'>('catalog');
  const [customCompanies, setCustomCompanies] = useState<CompanyRecord[]>([]);
  const [preloadedNames, setPreloadedNames] = useState<string[]>([]);
  const [selectedCompanyForExplorer, setSelectedCompanyForExplorer] = useState<CompanyRecord | null>(null);
  const [isExplorerOpen, setIsExplorerOpen] = useState<boolean>(false);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
  const [isSplitGuideOpen, setIsSplitGuideOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Outreach link open mode (split | companion | reusable-tab | new-tab)
  const [linkOpenMode, setLinkOpenMode] = useState<LinkOpenMode>('split');
  const [activeCompanionCompany, setActiveCompanionCompany] = useState<CompanyRecord | null>(null);

  // Global Outreach Note Modal
  const [messageModalCompany, setMessageModalCompany] = useState<CompanyRecord | null>(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState<boolean>(false);

  // Starred / Bookmarked Companies state
  const [starredSet, setStarredSet] = useState<Set<string>>(new Set());

  // Personal Company Notes state
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});

  // Global Outreach Status map for active syncing
  const [outreachMap, setOutreachMap] = useState<Record<string, OutreachStatus>>({});

  // Clerk User Authentication and Firebase Sync States
  const { user, isLoaded: isUserLoaded, isSignedIn } = useUser();
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastCloudSynced, setLastCloudSynced] = useState<Date | null>(null);
  const [initialCloudLoaded, setInitialCloudLoaded] = useState<boolean>(false);

  // Load Starred, Notes, Custom Companies, Outreach Status, and Link Mode on mount (local cache)
  useEffect(() => {
    try {
      setLinkOpenMode(getSavedLinkOpenMode());
      setStarredSet(getStoredStarredSet());
      setNotesMap(getStoredNotesMap());
      setCustomCompanies(getStoredCustomCompanies());
      setOutreachMap(getStoredOutreachMap());
    } catch {
      // ignore
    }
  }, []);

  // Debounced cloud sync ref to prevent network spam and Firestore rate limits
  const debouncedCloudSync = useMemo(
    () =>
      createDebouncedSync(async (payload: { userId: string; data: Partial<UserOutreachData> }) => {
        setIsSyncing(true);
        try {
          await saveUserData(payload.userId, payload.data);
          setLastCloudSynced(new Date());
        } catch (err) {
          console.warn('Failed auto-syncing to cloud:', err);
        } finally {
          setIsSyncing(false);
        }
      }, 500),
    []
  );

  // When an authenticated Clerk user is detected, fetch and merge cloud Firestore data
  useEffect(() => {
    if (!isUserLoaded || !isSignedIn || !user) return;
    const activeUser = user;

    let isMounted = true;
    async function loadUserCloudData() {
      setIsSyncing(true);
      try {
        const cloudData = await getUserData(activeUser.id);
        if (cloudData && isMounted) {
          if (cloudData.outreachMap) {
            setOutreachMap((prev) => {
              const merged = { ...prev, ...cloudData.outreachMap };
              saveStoredOutreachMap(merged);
              return merged;
            });
          }
          if (cloudData.notesMap) {
            setNotesMap((prev) => {
              const merged = { ...prev, ...cloudData.notesMap };
              saveStoredNotesMap(merged);
              return merged;
            });
          }
          if (cloudData.starredSet && Array.isArray(cloudData.starredSet)) {
            setStarredSet((prev) => {
              const merged = new Set([...Array.from(prev), ...cloudData.starredSet!]);
              saveStoredStarredSet(merged);
              return merged;
            });
          }
          if (cloudData.customCompanies && Array.isArray(cloudData.customCompanies)) {
            setCustomCompanies((prev) => {
              const map = new Map<string, CompanyRecord>();
              prev.forEach((c) => map.set(c.name.toLowerCase(), c));
              cloudData.customCompanies!.forEach((c) => map.set(c.name.toLowerCase(), c));
              const merged = Array.from(map.values());
              saveStoredCustomCompanies(merged);
              return merged;
            });
          }
          setLastCloudSynced(new Date());
          showToast(`☁️ Loaded ${activeUser.firstName || 'user'}'s cloud outreach data!`);
        } else if (isMounted) {
          // If no remote cloud data yet, back up current local session into user's profile
          const currentStarred = getStoredStarredSet();
          const currentNotes = getStoredNotesMap();
          const currentStatus = getStoredOutreachMap();
          const currentCustom = getStoredCustomCompanies();

          await saveUserData(activeUser.id, {
            starredSet: Array.from(currentStarred),
            notesMap: currentNotes,
            outreachMap: currentStatus,
            customCompanies: currentCustom,
            userEmail: activeUser.primaryEmailAddress?.emailAddress,
            userName: activeUser.fullName || activeUser.firstName || undefined,
          });
          setLastCloudSynced(new Date());
        }
      } catch (err) {
        console.warn('Could not sync user cloud profile:', err);
      } finally {
        if (isMounted) {
          setIsSyncing(false);
          setInitialCloudLoaded(true);
        }
      }
    }

    loadUserCloudData();

    return () => {
      isMounted = false;
    };
  }, [isUserLoaded, isSignedIn, user]);

  // Helper to persist updates to Firestore with debouncing if logged in
  const syncToCloud = (partial: Partial<UserOutreachData>) => {
    if (!isSignedIn || !user?.id) return;
    setIsSyncing(true);
    debouncedCloudSync({ userId: user.id, data: partial });
  };

  // Merge seedCompanies with persistent customCompanies and ensure sequential S.No
  const companies = useMemo(() => {
    const map = new Map<string, CompanyRecord>();
    (seedCompanies as CompanyRecord[]).forEach((c) => map.set(c.name.toLowerCase(), c));
    customCompanies.forEach((c) => map.set(c.name.toLowerCase(), c));
    const all = Array.from(map.values());
    return all.map((c, idx) => ({
      ...c,
      rank: c.rank || (idx + 1),
    }));
  }, [customCompanies]);

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
      saveStoredStarredSet(next);
      syncToCloud({ starredSet: Array.from(next) });
      return next;
    });
  };

  const handleBatchToggleStar = (companyKeys: string[], star: boolean) => {
    setStarredSet((prev) => {
      const next = new Set(prev);
      companyKeys.forEach((key) => {
        if (star) next.add(key);
        else next.delete(key);
      });
      saveStoredStarredSet(next);
      syncToCloud({ starredSet: Array.from(next) });
      return next;
    });
    showToast(`${star ? 'Starred' : 'Unstarred'} ${companyKeys.length} companies!`);
  };

  const handleUpdateNotes = (companyKey: string, noteText: string) => {
    setNotesMap((prev) => {
      const next = { ...prev, [companyKey]: noteText };
      saveStoredNotesMap(next);
      syncToCloud({ notesMap: next });
      return next;
    });
  };

  const handleUpdateOutreachStatus = (companyKey: string, status: OutreachStatus) => {
    setOutreachMap((prev) => {
      const next = { ...prev, [companyKey]: status };
      saveStoredOutreachMap(next);
      syncToCloud({ outreachMap: next });
      return next;
    });
    showToast(`Status updated to ${status.replace('_', ' ')}!`);
  };

  const handleBatchUpdateOutreachStatus = (companyKeys: string[], status: OutreachStatus) => {
    setOutreachMap((prev) => {
      const next = { ...prev };
      companyKeys.forEach((key) => {
        next[key] = status;
      });
      saveStoredOutreachMap(next);
      syncToCloud({ outreachMap: next });
      return next;
    });
    showToast(`Updated ${companyKeys.length} companies to "${status.replace('_', ' ')}"!`);
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

  const showToast = (message: string, explicitType?: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    let type: ToastType = explicitType || 'info';

    if (!explicitType) {
      const lower = message.toLowerCase();
      if (lower.includes('⭐') || lower.includes('star') || lower.includes('favorite')) {
        type = 'star';
      } else if (lower.includes('copi') || lower.includes('clipboard') || lower.includes('📋') || lower.includes('note')) {
        type = 'copy';
      } else if (lower.includes('fail') || lower.includes('error') || lower.includes('cannot') || lower.includes('blocked')) {
        type = 'error';
      } else if (lower.includes('warn') || lower.includes('miss') || lower.includes('unverified')) {
        type = 'warning';
      } else if (
        lower.includes('added') ||
        lower.includes('saved') ||
        lower.includes('exported') ||
        lower.includes('updated') ||
        lower.includes('verified') ||
        lower.includes('loaded') ||
        lower.includes('restored') ||
        lower.includes('switched') ||
        lower.includes('launched') ||
        lower.includes('linked') ||
        lower.includes('steered') ||
        lower.includes('selected') ||
        lower.includes('cleared') ||
        lower.includes('reset') ||
        lower.includes('sorted') ||
        lower.includes('opened')
      ) {
        type = 'success';
      }
    }

    setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  const handleSendToWorkspace = (names: string[]) => {
    setPreloadedNames(names);
    setActiveTab('workspace');
  };

  const handleCompanyAddedToDb = (newComp: CompanyRecord) => {
    setCustomCompanies((prev) => {
      const filtered = prev.filter((c) => c.name.toLowerCase() !== newComp.name.toLowerCase());
      const next = [newComp, ...filtered];
      saveStoredCustomCompanies(next);
      syncToCloud({ customCompanies: next });
      return next;
    });
    showToast(`Added ${newComp.name} to persistent catalog!`);
  };

  const handleBatchCompaniesAddedToDb = (newComps: CompanyRecord[]) => {
    setCustomCompanies((prev) => {
      const names = new Set(newComps.map((c) => c.name.toLowerCase()));
      const filtered = prev.filter((c) => !names.has(c.name.toLowerCase()));
      const next = [...newComps, ...filtered];
      saveStoredCustomCompanies(next);
      syncToCloud({ customCompanies: next });
      return next;
    });
    showToast(`Saved ${newComps.length} companies to persistent catalog!`);
  };

  const handleOpenExplorer = (company: CompanyRecord) => {
    setSelectedCompanyForExplorer(company);
    setIsExplorerOpen(true);
  };

  const handleDataRestored = () => {
    try {
      setStarredSet(getStoredStarredSet());
      setNotesMap(getStoredNotesMap());
      setCustomCompanies(getStoredCustomCompanies());
      setOutreachMap(getStoredOutreachMap());
    } catch { }
  };

  const handleChangeLinkOpenMode = (mode: LinkOpenMode) => {
    setLinkOpenMode(mode);
    saveLinkOpenMode(mode);
    showToast(
      mode === 'split'
        ? '🖥️ Switched to Split Screen Mode (Target Tab)'
        : mode === 'companion'
          ? '🪟 Switched to Floating Popup Window'
          : mode === 'reusable-tab'
            ? '📑 Switched to 1 Reusable Tab'
            : '🗂️ Switched to Classic New Tabs'
    );
  };

  const handleOpenOutreachUrl = (url: string, company?: CompanyRecord) => {
    if (company) {
      setActiveCompanionCompany(company);
    }
    openOutreachUrl(url, { mode: linkOpenMode, companyName: company?.name });
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
    <main style={{ minHeight: '100vh', paddingBottom: '5rem' }}>
      {/* App Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        totalCompanies={companies.length}
        totalCategories={totalCategories}
        onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onOpenSplitGuide={() => setIsSplitGuideOpen(true)}
        linkOpenMode={linkOpenMode}
        onChangeLinkOpenMode={handleChangeLinkOpenMode}
        onNotify={showToast}
        isSyncing={isSyncing}
        lastCloudSynced={lastCloudSynced}
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
            onBatchToggleStar={handleBatchToggleStar}
            notesMap={notesMap}
            onUpdateNotes={handleUpdateNotes}
            outreachMap={outreachMap}
            onUpdateOutreachStatus={handleUpdateOutreachStatus}
            onBatchUpdateOutreachStatus={handleBatchUpdateOutreachStatus}
            linkOpenMode={linkOpenMode}
            onOpenUrl={handleOpenOutreachUrl}
            activeCompanionSlug={activeCompanionCompany?.slug}
          />
        ) : (
          <WorkspaceView
            companiesDb={companies}
            onNotify={showToast}
            preloadedNames={preloadedNames}
            onCompanyAddedToDb={handleCompanyAddedToDb}
            onBatchCompaniesAddedToDb={handleBatchCompaniesAddedToDb}
            onExploreCompany={handleOpenExplorer}
            starredSet={starredSet}
            onToggleStar={handleToggleStar}
            notesMap={notesMap}
            onUpdateNotes={handleUpdateNotes}
            outreachMap={outreachMap}
            onUpdateOutreachStatus={handleUpdateOutreachStatus}
            linkOpenMode={linkOpenMode}
            onOpenUrl={handleOpenOutreachUrl}
          />
        )}
      </div>

      {/* Side-by-Side Company Explorer Drawer */}
      <CompanyExplorerDrawer
        company={selectedCompanyForExplorer}
        isOpen={isExplorerOpen}
        onClose={() => setIsExplorerOpen(false)}
        onNotify={showToast}
        isStarred={
          selectedCompanyForExplorer
            ? starredSet.has(selectedCompanyForExplorer.slug || selectedCompanyForExplorer.name)
            : false
        }
        onToggleStar={() =>
          selectedCompanyForExplorer &&
          handleToggleStar(selectedCompanyForExplorer.slug || selectedCompanyForExplorer.name)
        }
        notes={
          selectedCompanyForExplorer
            ? notesMap[selectedCompanyForExplorer.slug || selectedCompanyForExplorer.name] || ''
            : ''
        }
        onSaveNotes={(n) =>
          selectedCompanyForExplorer &&
          handleUpdateNotes(selectedCompanyForExplorer.slug || selectedCompanyForExplorer.name, n)
        }
        outreachStatus={
          selectedCompanyForExplorer
            ? outreachMap[selectedCompanyForExplorer.slug || selectedCompanyForExplorer.name] || 'to_contact'
            : 'to_contact'
        }
        onUpdateOutreachStatus={(status) =>
          selectedCompanyForExplorer &&
          handleUpdateOutreachStatus(
            selectedCompanyForExplorer.slug || selectedCompanyForExplorer.name,
            status
          )
        }
        linkOpenMode={linkOpenMode}
        onOpenUrl={handleOpenOutreachUrl}
      />

      {/* Floating Companion Controller Dock */}
      {activeCompanionCompany && (
        <CompanionDock
          activeCompany={activeCompanionCompany}
          allCompanies={companies}
          onSelectCompany={(comp) => {
            setActiveCompanionCompany(comp);
          }}
          outreachStatus={
            activeCompanionCompany
              ? outreachMap[activeCompanionCompany.slug || activeCompanionCompany.name] || 'to_contact'
              : 'to_contact'
          }
          onUpdateStatus={(st) => {
            if (activeCompanionCompany) {
              handleUpdateOutreachStatus(
                activeCompanionCompany.slug || activeCompanionCompany.name,
                st
              );
            }
          }}
          onOpenMessageModal={(c) => {
            setMessageModalCompany(c);
            setIsMessageModalOpen(true);
          }}
          onOpenSplitGuide={() => setIsSplitGuideOpen(true)}
          onNotify={showToast}
          linkOpenMode={linkOpenMode}
          onCloseDock={() => setActiveCompanionCompany(null)}
        />
      )}

      {/* Shared Connection Note Customizer Modal */}
      <OutreachMessageModal
        company={messageModalCompany}
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        onNotify={showToast}
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

      {/* Split Screen Setup Guide Modal */}
      <SplitScreenGuideModal
        isOpen={isSplitGuideOpen}
        onClose={() => setIsSplitGuideOpen(false)}
        onNotify={showToast}
        onChangeLinkOpenMode={handleChangeLinkOpenMode}
      />

      {/* Data Backup & Restore Modal */}
      <DataBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onNotify={showToast}
        onDataRestored={handleDataRestored}
        metrics={{
          starredCount: starredSet.size,
          notesCount: Object.keys(notesMap).filter((k) => notesMap[k]?.trim()).length,
          statusCount: Object.keys(outreachMap).length,
          customCompaniesCount: customCompanies.length,
        }}
      />

      {/* Floating Interactive Toast Notifications */}
      <ToastNotification
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />

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
            Linkedin Utility is an outreach & research utility. All outbound links open user-initiated LinkedIn pages in new tabs.
          </p>
          <p style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <ShieldAlert size={14} color="#f59e0b" />
            Zero bots · Zero scraping · Fully compliant with LinkedIn Terms of Service. Ready for 1-click Vercel deployment.
          </p>
          <p style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', color: '#cbd5e1', marginTop: '0.35rem' }}>
            <span>Made with</span>
            <Heart size={14} color="#f43f5e" fill="#f43f5e" />
            <span>• Wish you the best on your networking journey! 🚀</span>
          </p>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
            © {new Date().getFullYear()} Linkedin Utility. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
