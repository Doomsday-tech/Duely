import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, LogOut, X, Menu, Calendar, FileText, Layers, LayoutDashboard, Settings } from 'lucide-react';

export type NavTab = 'overview' | 'things' | 'documents' | 'calendar' | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenAdd: () => void;
  onOpenSearch: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenAdd,
  onOpenSearch,
  mobileOpen,
  setMobileOpen,
}) => {
  const { user, logout } = useAuth();

  const navItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'things', label: 'Things', icon: Layers },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'calendar', label: 'Timeline', icon: Calendar },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between bg-[#EFECE6] text-[#2C2C2C]">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="px-6 pt-7 pb-4 border-b border-[#E2E0D9]">
          <button
            onClick={() => {
              onSelectTab('overview');
              setMobileOpen(false);
            }}
            className="text-left w-full group"
          >
            <div className="font-serif text-2xl font-semibold tracking-tight text-[#1C1C1E]">
              Duely
            </div>
            <div className="text-xs text-[#78716C] mt-0.5">
              Personal life notebook
            </div>
          </button>
        </div>

        {/* Action Controls */}
        <div className="px-5 space-y-2">
          <button
            onClick={() => {
              onOpenAdd();
              setMobileOpen(false);
            }}
            className="w-full bg-[#2C2C2C] text-[#F7F6F3] hover:bg-[#1C1C1E] text-[13px] font-medium py-2 px-3 rounded-[5px] flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#E2E0D9]" />
            <span>Add new entry</span>
          </button>

          <button
            onClick={() => {
              onOpenSearch();
              setMobileOpen(false);
            }}
            className="w-full bg-transparent hover:bg-black/5 text-[#57534E] hover:text-[#1C1C1E] text-[13px] py-1.5 px-3 rounded-[5px] flex items-center justify-between border border-[#E2E0D9] transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-[#78716C]" />
              <span>Search</span>
            </span>
            <span className="text-[11px] text-[#A8A29E]">⌘K</span>
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="px-4 space-y-1">
          <div className="px-2 pb-1.5 text-[11px] font-medium tracking-wide text-[#8C827A] uppercase">
            Notebook
          </div>
          {navItems.map((item) => {
            const active = currentTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full text-left text-sm py-2 px-3 rounded-[5px] flex items-center gap-2.5 transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#E5E1D8] text-[#1C1C1E] font-medium'
                    : 'text-[#57534E] hover:text-[#1C1C1E] hover:bg-black/[0.03]'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-[#1C1C1E]' : 'text-[#78716C]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Operator Account at Bottom */}
      <div className="p-5 border-t border-[#E2E0D9] space-y-3 text-xs">
        {user && (
          <div className="space-y-0.5">
            <div className="font-medium text-[#1C1C1E] truncate">{user.name}</div>
            <div className="text-[#78716C] truncate">{user.email}</div>
          </div>
        )}

        <button
          onClick={logout}
          className="w-full text-left flex items-center justify-between text-xs text-[#78716C] hover:text-[#A8382B] py-1.5 transition-colors cursor-pointer"
        >
          <span>Sign out</span>
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Left-Hand Sidebar */}
      <aside className="hidden md:flex w-60 flex-col fixed inset-y-0 left-0 border-r border-[#E2E0D9] z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Top Bar */}
      <header className="md:hidden sticky top-0 z-40 bg-[#EFECE6] border-b border-[#E2E0D9] flex items-center justify-between px-4 h-13">
        <button
          onClick={() => onSelectTab('overview')}
          className="font-serif text-lg font-semibold text-[#1C1C1E]"
        >
          Duely
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAdd}
            className="bg-[#2C2C2C] text-[#F7F6F3] text-xs font-medium px-2.5 py-1 rounded-[5px]"
          >
            + Add
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 text-[#2C2C2C]"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-[1px]"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 max-w-xs h-full border-r border-[#E2E0D9] z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
