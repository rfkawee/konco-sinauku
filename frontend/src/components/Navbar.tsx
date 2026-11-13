import React from 'react';
import { ArrowLeft, Layers } from 'lucide-react';
import type { DocumentItem } from '../types';
import { ProfileDropdown } from './ProfileDropdown';

interface NavbarProps {
  activeDoc: DocumentItem | null;
  userEmail?: string | null;
  memberId?: string;
  documentsCount?: number;
  onLogout?: () => void;
  onBackToLanding?: () => void;
  onOpenDashboard?: () => void;
  onOpenSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeDoc,
  userEmail,
  memberId,
  documentsCount = 0,
  onLogout,
  onBackToLanding,
  onOpenDashboard,
  onOpenSettings,
}) => {
  return (
    <header className="h-15 border-b border-hm-rule bg-hm-sheet px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left Masthead */}
      <div className="flex items-center gap-3">
        {onBackToLanding && (
          <button
            onClick={onBackToLanding}
            className="p-1.5 rounded-sm text-hm-muted hover:text-hm-ink hover:bg-hm-paper-2 transition-colors cursor-pointer border border-transparent hover:border-hm-rule"
            title="Kembali ke Beranda"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}

        <div 
          onClick={onBackToLanding}
          className="flex items-center gap-2.5 cursor-pointer group"
          title="Ke Beranda"
        >
          {/* Hallmark Archival Emblem */}
          <div className="w-8 h-8 rounded-sm bg-hm-ink text-hm-paper flex items-center justify-center font-mono font-bold text-xs tracking-tighter shadow-xs">
            KS
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-hm-ink text-sm tracking-tight group-hover:text-hm-accent transition-colors">
                Konco-Sinauku
              </h1>
              <span className="text-[11px] font-mono px-1.5 py-0.2 rounded-xs bg-hm-paper-2 text-hm-muted border border-hm-rule">
                v2.0 · RAG
              </span>
            </div>
            
            <p className="text-[11px] text-hm-muted hidden sm:flex items-center gap-1 font-sans">
              {activeDoc ? (
                <>
                  <span className="font-medium text-hm-ink truncate max-w-[220px]">{activeDoc.filename}</span>
                  <span className="text-hm-subtle">·</span>
                  <span className="font-mono tabular-nums">{activeDoc.page_count} Hal</span>
                </>
              ) : (
                <span>Ruang Belajar Akademis</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2.5">
        {onBackToLanding && (
          <button
            onClick={onBackToLanding}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-display font-medium text-hm-muted hover:text-hm-ink hover:bg-hm-paper-2 border border-transparent hover:border-hm-rule transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Katalog Materi</span>
          </button>
        )}

        {/* Profile Dropdown */}
        {userEmail && (
          <ProfileDropdown
            userEmail={userEmail}
            memberId={memberId || 'MBR-GUEST'}
            documentsCount={documentsCount}
            onOpenDashboard={onOpenDashboard || (() => {})}
            onOpenSettings={onOpenSettings || (() => {})}
            onLogout={onLogout || (() => {})}
            onNavigateHome={onBackToLanding}
            isWorkspace={true}
          />
        )}
      </div>
    </header>
  );
};
