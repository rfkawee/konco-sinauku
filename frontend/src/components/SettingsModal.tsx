import React from 'react';
import { 
  X, Settings, Cpu, HardDrive, ShieldCheck, 
  Trash2, CheckCircle2 
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string | null;
  memberId: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  memberId,
}) => {
  const [clearedNotice, setClearedNotice] = React.useState(false);

  if (!isOpen) return null;

  const handleClearCache = () => {
    if (window.confirm('Bersihkan cache preferensi lokal? (Sesi login Anda tidak akan terhapus)')) {
      const savedEmail = localStorage.getItem('konco_user_email');
      const savedMember = localStorage.getItem('konco_member_id');
      localStorage.clear();
      if (savedEmail) localStorage.setItem('konco_user_email', savedEmail);
      if (savedMember) localStorage.setItem('konco_member_id', savedMember);
      setClearedNotice(true);
      setTimeout(() => setClearedNotice(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col font-sans">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-linear-to-r from-slate-50 via-white to-blue-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center shadow-md">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Pengaturan Sistem & AI</h2>
              <p className="text-xs text-slate-500">Konfigurasi arsitektur & parameter akun pelajar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Konten Pengaturan */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {clearedNotice && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Cache preferensi lokal berhasil dibersihkan.</span>
            </div>
          )}

          {/* Bagian 1: Akun & Keanggotaan */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Informasi Keanggotaan</span>
            </h4>
            <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Email Akun:</span>
              <span className="font-semibold text-slate-800">{userEmail || 'Tamu'}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Member ID:</span>
              <span className="font-mono font-bold text-blue-700">{memberId}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500">Isolasi Data:</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                Aktif (Strict per-member)
              </span>
            </div>
          </div>

          {/* Bagian 2: Mesin AI Google Gemini */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-indigo-600" />
              <span>Mesin AI & LLM Engine</span>
            </h4>
            <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Model Generasi:</span>
              <span className="font-mono font-semibold text-indigo-700">OpenRouter (Free) / Gemini 3.8</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Model Embedding:</span>
              <span className="font-mono text-slate-700">text-embedding-004 (768 Dimensi)</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500">Streaming Response:</span>
              <span className="font-semibold text-slate-800">Server-Sent Events (SSE)</span>
            </div>
          </div>

          {/* Bagian 3: Batasan Dokumen */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-slate-600" />
              <span>Spesifikasi & Limit Berkas</span>
            </h4>
            <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Format Didukung:</span>
              <span className="font-semibold text-slate-800">Portable Document Format (.pdf)</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Maksimum Ukuran File:</span>
              <span className="font-semibold text-slate-800">20 MB</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500">Maksimum Halaman:</span>
              <span className="font-semibold text-slate-800">50 Halaman per berkas</span>
            </div>
          </div>

          {/* Pembersihan Cache */}
          <div className="pt-2 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-800">Bersihkan Cache Lokal</p>
              <p className="text-[11px] text-slate-500">Hapus cache preferensi tampilan browser</p>
            </div>
            <button
              onClick={handleClearCache}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 hover:border-rose-400 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-semibold transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bersihkan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
