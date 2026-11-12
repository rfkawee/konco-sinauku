import React from 'react';
import { BookOpen, ArrowLeft } from 'lucide-react';
import type { DocumentItem } from '../types';

interface NavbarProps {
  activeDoc: DocumentItem | null;
  userEmail?: string | null;
  onLogout?: () => void;
  onBackToLanding?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeDoc,
  userEmail,
  onLogout,
  onBackToLanding,
}) => {
  return (
    <header className="h-16 border-b border-slate-200 bg-white px-4 md:px-6 flex items-center justify-between shadow-xs sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {onBackToLanding && (
          <button
            onClick={onBackToLanding}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
            title="Kembali ke Beranda"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div 
          onClick={onBackToLanding}
          className="flex items-center gap-3 cursor-pointer group"
          title="Ke Beranda"
        >
          <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md group-hover:opacity-95 transition">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-slate-800 text-lg tracking-tight group-hover:text-blue-600 transition">Konco-Sinauku</h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                Workspace
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              {activeDoc ? `Materi Aktif: ${activeDoc.filename} (${activeDoc.page_count} Hal)` : 'Ruang Belajar Interaktif'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Tombol Navigasi ke Beranda */}
        {onBackToLanding && (
          <button
            onClick={onBackToLanding}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
          >
            <span>Kembali ke Beranda</span>
          </button>
        )}

        {/* Info Akun jika sudah Login (Tombol login telah dihapus dari navbar utama sesuai spesifikasi) */}
        {userEmail && (
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-sm">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <span className="text-slate-700 font-medium text-xs hidden md:inline">{userEmail}</span>
            <button
              onClick={onLogout}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium ml-1 cursor-pointer"
            >
              Keluar
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
