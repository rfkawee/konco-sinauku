import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, LayoutDashboard, Settings, LogOut, 
  BookOpen, Sparkles, ChevronRight, ShieldCheck, FileText
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

  // Tutup dropdown saat pengguna klik di luar elemen
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
      {/* Burger & Profile Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-blue-300 px-3 py-1.5 rounded-xl transition cursor-pointer shadow-2xs group"
        title="Menu Profil & Navigasi"
      >
        <div className="w-8 h-8 rounded-full bg-linear-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
          {userEmail.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col text-left hidden sm:flex">
          <span className="text-slate-800 font-bold text-xs leading-none group-hover:text-blue-600 transition truncate max-w-[140px]">
            {userEmail}
          </span>
          <span className="text-[10px] text-blue-700 font-mono font-bold mt-0.5">
            {memberId}
          </span>
        </div>
        <Menu className="w-4 h-4 text-slate-500 group-hover:text-slate-800 transition ml-0.5" />
      </button>

      {/* Dropdown Menu Modal/Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header Profil Singkat */}
          <div className="p-4 bg-linear-to-b from-blue-50/50 to-white border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                {userEmail.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-900 truncate">{userEmail}</p>
                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-mono font-bold mt-0.5">
                  <ShieldCheck className="w-3 h-3 text-blue-600" />
                  <span>{memberId}</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100/80 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1 font-medium">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Materi Belajar:</span>
              </span>
              <span className="font-bold text-slate-800">{documentsCount} Dokumen</span>
            </div>
          </div>

          {/* Navigasi Utama */}
          <div className="p-2 space-y-1 text-xs">
            {/* Navigasi Workspace / Beranda */}
            {isWorkspace && onNavigateHome && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onNavigateHome();
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>Halaman Beranda</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}

            {!isWorkspace && onOpenWorkspace && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenWorkspace();
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-blue-50/50 hover:bg-blue-100/60 text-blue-700 font-semibold transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Buka Ruang Belajar</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-blue-500" />
              </button>
            )}

            {/* Tombol Dashboard */}
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenDashboard();
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4 text-indigo-600" />
                <span>Dashboard Belajar</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Tombol Settings */}
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenSettings();
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4 text-slate-600" />
                <span>Pengaturan & AI</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          {/* Tombol Logout */}
          <div className="p-2 border-t border-slate-100 bg-slate-50/50">
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar dari Akun</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
