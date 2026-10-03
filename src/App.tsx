import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { ThingsPage } from './pages/ThingsPage';
import { ThingDetailPage } from './pages/ThingDetailPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { CalendarPage } from './pages/CalendarPage';
import { SettingsPage } from './pages/SettingsPage';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { SearchModal } from './components/SearchModal';
import { AddThingModal } from './components/AddThingModal';
import { RenewModal } from './components/RenewModal';
import { UploadDocModal } from './components/UploadDocModal';
import { Thing } from './api/types';

function MainApp() {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [selectedThingId, setSelectedThingId] = useState<string | null>(null);

  const [authView, setAuthView] = useState<'landing' | 'auth'>('landing');

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [renewingThing, setRenewingThing] = useState<Thing | null>(null);
  const [uploadDocTarget, setUploadDocTarget] = useState<{ thingId?: string; thingName?: string } | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Global keyboard shortcut for search (⌘K or Ctrl+K or /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center text-sm text-[#78716C]">
        Loading your notebook...
      </div>
    );
  }

  if (!user) {
    if (authView === 'landing') {
      return (
        <LandingPage
          onGetStarted={() => setAuthView('auth')}
          onSignIn={() => setAuthView('auth')}
          onTryDemo={() => setAuthView('auth')}
        />
      );
    }
    return <AuthPage onBack={() => setAuthView('landing')} />;
  }

  const handleSelectThing = (id: string) => {
    setSelectedThingId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackFromDetail = () => {
    setSelectedThingId(null);
  };

  const handleOpenUploadDoc = (thingId?: string, thingName?: string) => {
    setUploadDocTarget({ thingId, thingName });
  };

  return (
    <div className="min-h-screen bg-[#F7F6F3] text-[#2C2C2C] flex flex-col font-sans">
      {/* Warm Left-Hand Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setSelectedThingId(null);
        }}
        onOpenAdd={() => setIsAddOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Main Content Area (Offset by left sidebar on desktop) */}
      <div className="md:pl-60 flex-1 flex flex-col bg-[#F7F6F3]">
        <main className="flex-1 w-full pb-20">
          {selectedThingId ? (
            <ThingDetailPage
              thingId={selectedThingId}
              onBack={handleBackFromDetail}
              onOpenRenew={(t) => setRenewingThing(t)}
              onOpenUploadDoc={(tid, tname) => handleOpenUploadDoc(tid, tname)}
              onThingDeleted={() => setSelectedThingId(null)}
            />
          ) : (
            <>
              {currentTab === 'overview' && (
                <DashboardPage
                  onSelectThing={handleSelectThing}
                  onOpenAdd={() => setIsAddOpen(true)}
                  onOpenRenew={(t) => setRenewingThing(t)}
                />
              )}
              {currentTab === 'things' && (
                <ThingsPage
                  onSelectThing={handleSelectThing}
                  onOpenAdd={() => setIsAddOpen(true)}
                  onOpenRenew={(t) => setRenewingThing(t)}
                />
              )}
              {currentTab === 'documents' && (
                <DocumentsPage
                  onSelectThing={handleSelectThing}
                  onOpenUpload={() => handleOpenUploadDoc()}
                />
              )}
              {currentTab === 'calendar' && (
                <CalendarPage onSelectThing={handleSelectThing} />
              )}
              {currentTab === 'settings' && <SettingsPage />}
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectThing={handleSelectThing}
      />

      <AddThingModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onThingCreated={(newThing) => {
          setSelectedThingId(newThing.id);
        }}
      />

      <RenewModal
        isOpen={!!renewingThing}
        thing={renewingThing}
        onClose={() => setRenewingThing(null)}
        onRenewed={(updated) => {
          if (selectedThingId === updated.id) {
            setSelectedThingId(updated.id);
          }
        }}
      />

      <UploadDocModal
        isOpen={!!uploadDocTarget}
        thingId={uploadDocTarget?.thingId}
        thingName={uploadDocTarget?.thingName}
        onClose={() => setUploadDocTarget(null)}
        onUploaded={() => {
          // Handled in detail views
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
