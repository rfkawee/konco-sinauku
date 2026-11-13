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
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-hm-sheet rounded-sm max-w-lg w-full shadow-xl border border-hm-rule-2 overflow-hidden max-h-[90vh] flex flex-col font-sans select-none">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hm-rule bg-hm-paper-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xs bg-hm-ink text-hm-paper flex items-center justify-center font-mono font-bold text-xs">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-display font-bold text-hm-ink">Pengaturan Sistem & AI</h2>
              <p className="text-xs text-hm-muted">Konfigurasi arsitektur & parameter akun pelajar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xs text-hm-muted hover:text-hm-ink hover:bg-hm-paper-3 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Konten Pengaturan */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-hm-ink">
          {clearedNotice && (
            <div className="p-3 rounded-xs bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center gap-2 font-sans">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Cache preferensi lokal berhasil dibersihkan.</span>
            </div>
          )}

          {/* Bagian 1: Akun & Keanggotaan */}
          <div className="bg-hm-paper p-4 rounded-xs border border-hm-rule space-y-2">
            <h4 className="font-display font-bold text-hm-ink uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-hm-accent" />
              <span>Identitas Pelajar</span>
            </h4>
            <div className="flex items-center justify-between py-1 border-b border-hm-rule font-sans">
              <span className="text-hm-muted">Email Pengguna:</span>
              <span className="font-medium text-hm-ink">{userEmail || 'Tamu'}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-hm-rule font-mono">
              <span className="text-hm-muted font-sans">Member ID:</span>
              <span className="font-bold text-hm-accent">{memberId}</span>
            </div>
            <div className="flex items-center justify-between py-1 font-sans">
              <span className="text-hm-muted">Isolasi Basis Data:</span>
              <span className="px-1.5 py-0.2 rounded-xs bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[10px]">
                Active (Row-Level Security)
              </span>
            </div>
          </div>

          {/* Bagian 2: Mesin AI Google Gemini */}
          <div className="bg-hm-paper p-4 rounded-xs border border-hm-rule space-y-2">
            <h4 className="font-display font-bold text-hm-ink uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-hm-accent" />
              <span>Arsitektur Multi-Agent & RAG</span>
            </h4>
            <div className="flex items-center justify-between py-1 border-b border-hm-rule">
              <span className="text-hm-muted">Model Tutor & Summary:</span>
              <span className="font-mono text-hm-ink font-medium">Gemini 3.8 Flash</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-hm-rule">
              <span className="text-hm-muted">Model Embedding:</span>
              <span className="font-mono text-hm-ink font-medium">text-embedding-004 (768 Dimensi)</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-hm-muted">Vector Database:</span>
              <span className="font-mono text-hm-ink font-medium">PostgreSQL + pgvector (Supabase)</span>
            </div>
          </div>

          {/* Bagian 3: Pemeliharaan Cache */}
          <div className="bg-hm-paper p-4 rounded-xs border border-hm-rule space-y-2">
            <h4 className="font-display font-bold text-hm-ink uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-hm-muted" />
              <span>Penyimpanan Lokal Browser</span>
            </h4>
            <p className="text-xs text-hm-muted font-sans leading-relaxed">
              Jika mengalami kendala tampilan atau sesi yang tidak sinkron, Anda dapat membersihkan cache browser lokal.
            </p>
            <div className="pt-1">
              <button
                onClick={handleClearCache}
                className="hm-btn-secondary text-xs py-1.5 px-3 text-rose-700 hover:text-rose-800 border-rose-200"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Bersihkan Cache Lokal</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
