import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, LayoutDashboard, Settings, LogOut, 
  BookOpen, ChevronRight, ShieldCheck, FileText, Compass
} from 'lucide-react';

interface ProfileDropdownProps {
  userEmail: string;
  memberId: string;
  documentsCount: number;
  onOpenDashboard: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  onNavigateHome?: () => void;
  onOpenWorkspace?: () => void;
  isWorkspace?: boolean;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  userEmail,
  memberId,
  documentsCount,
  onOpenDashboard,
  onOpenSettings,
  onLogout,
  onNavigateHome,
  onOpenWorkspace,
  isWorkspace = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 bg-hm-sheet hover:bg-hm-paper-2 border border-hm-rule px-2.5 py-1.5 rounded-sm transition-colors cursor-pointer select-none group"
        title="Menu Profil & Navigasi"
      >
        <div className="w-7 h-7 rounded-xs bg-hm-ink text-hm-paper flex items-center justify-center font-mono font-bold text-xs">
          {userEmail.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col text-left hidden sm:flex">
          <span className="text-hm-ink font-display font-medium text-xs leading-none group-hover:text-hm-accent transition-colors truncate max-w-[130px]">
            {userEmail}
          </span>
          <span className="text-[10px] text-hm-muted font-mono mt-0.5">
            {memberId}
          </span>
        </div>
        <Menu className="w-3.5 h-3.5 text-hm-muted group-hover:text-hm-ink transition-colors ml-0.5" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-72 bg-hm-sheet rounded-sm shadow-lg border border-hm-rule-2 overflow-hidden z-50">
          {/* Header Profil */}
          <div className="p-3.5 bg-hm-paper-2 border-b border-hm-rule">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xs bg-hm-ink text-hm-paper flex items-center justify-center font-mono font-bold text-xs">
                {userEmail.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-display font-semibold text-hm-ink truncate">{userEmail}</p>
                <div className="inline-flex items-center gap-1 font-mono text-[10px] text-hm-accent mt-0.5">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{memberId}</span>
                </div>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-hm-rule flex items-center justify-between text-[11px] text-hm-muted">
              <span className="flex items-center gap-1 font-sans">
                <FileText className="w-3.5 h-3.5 text-hm-accent" />
                <span>Dokumen Tersimpan:</span>
              </span>
              <span className="font-mono font-semibold text-hm-ink tabular-nums">{documentsCount}</span>
            </div>
          </div>

          {/* Navigasi Utama */}
          <div className="p-1.5 space-y-0.5 text-xs font-display">
            {isWorkspace && onNavigateHome && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onNavigateHome();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xs hover:bg-hm-paper-2 text-hm-ink transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-hm-muted" />
                  <span>Halaman Depan</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-hm-subtle" />
              </button>
            )}

            {!isWorkspace && onOpenWorkspace && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenWorkspace();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xs bg-hm-accent-soft hover:bg-hm-accent hover:text-hm-paper text-hm-accent font-semibold transition-colors cursor-pointer text-left group"
              >
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-hm-accent group-hover:text-hm-paper" />
                  <span>Buka Ruang Belajar</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-hm-accent group-hover:text-hm-paper" />
              </button>
            )}

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenDashboard();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xs hover:bg-hm-paper-2 text-hm-ink transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4 text-hm-muted" />
                <span>Dashboard Belajar</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-hm-subtle" />
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenSettings();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xs hover:bg-hm-paper-2 text-hm-ink transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-hm-muted" />
                <span>Pengaturan Sistem</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-hm-subtle" />
            </button>
          </div>

          {/* Tombol Logout */}
          <div className="p-1.5 border-t border-hm-rule bg-hm-paper-2">
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xs text-xs font-display font-medium text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer text-left"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar dari Sesi</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
