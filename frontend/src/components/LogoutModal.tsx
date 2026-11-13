import React from 'react';
import { LogOut, X, AlertTriangle } from 'lucide-react';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userEmail: string | null;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userEmail,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-hm-sheet rounded-sm max-w-sm w-full shadow-xl border border-hm-rule-2 overflow-hidden select-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-hm-rule bg-hm-paper-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xs bg-rose-100 text-rose-800 border border-rose-200 flex items-center justify-center">
              <LogOut className="w-3.5 h-3.5" />
            </div>
            <h3 id="logout-title" className="font-display font-bold text-sm text-hm-ink">
              Konfirmasi Keluar
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xs text-hm-muted hover:text-hm-ink hover:bg-hm-paper-3 transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 font-sans">
          <p className="text-xs text-hm-ink leading-relaxed">
            Apakah Anda yakin ingin keluar dari sesi akun{' '}
            <strong className="font-mono text-hm-accent font-semibold">{userEmail || 'Anda'}</strong>?
          </p>

          <div className="mt-3 p-3 rounded-xs bg-hm-paper-2 border border-hm-rule text-[11px] text-hm-muted flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Seluruh berkas dokumen dan riwayat latihan Anda tetap tersimpan dengan aman di basis data dan dapat dibuka kembali saat masuk.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="mt-5 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="hm-btn-secondary text-xs flex-1 py-2 justify-center"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="hm-btn-primary bg-rose-700 hover:bg-rose-800 text-white text-xs flex-1 py-2 justify-center border-rose-700"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Ya, Keluar Akun</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
