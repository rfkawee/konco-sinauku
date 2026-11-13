import React from 'react';
import { 
  X, LayoutDashboard, FileText, 
  ShieldCheck, ArrowRight, Copy, Check
} from 'lucide-react';
import type { DocumentItem } from '../types';

interface DashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string | null;
  memberId: string;
  documents: DocumentItem[];
  onSelectDocAndOpenWorkspace: (doc: DocumentItem) => void;
}

export const DashboardModal: React.FC<DashboardModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  memberId,
  documents,
  onSelectDocAndOpenWorkspace,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const totalPages = documents.reduce((acc, d) => acc + (d.page_count || 0), 0);
  const totalSizeMB = (documents.reduce((acc, d) => acc + (d.file_size_bytes || 0), 0) / (1024 * 1024)).toFixed(1);

  const handleCopyId = () => {
    navigator.clipboard.writeText(memberId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-hm-sheet rounded-sm max-w-2xl w-full shadow-xl border border-hm-rule-2 overflow-hidden max-h-[90vh] flex flex-col font-sans select-none">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hm-rule bg-hm-paper-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xs bg-hm-ink text-hm-paper flex items-center justify-center font-mono font-bold text-xs">
              <LayoutDashboard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-display font-bold text-hm-ink">Dashboard Belajar Pelajar</h2>
              <p className="text-xs text-hm-muted">Ringkasan aktivitas materi & status keanggotaan terindeks</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xs text-hm-muted hover:text-hm-ink hover:bg-hm-paper-3 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Konten Dashboard */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Kartu Profil Member */}
          <div className="bg-hm-paper-2 p-4 rounded-xs border border-hm-rule text-hm-ink">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-hm-muted">
                  Akun Pelajar Terdaftar
                </span>
                <h3 className="text-base font-display font-bold text-hm-ink mt-0.5">
                  {userEmail || 'Siswa Konco-Sinauku'}
                </h3>
                <div className="inline-flex items-center gap-2 mt-2 px-2.5 py-1 rounded-xs bg-hm-sheet border border-hm-rule font-mono text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-hm-accent" />
                  <span className="font-semibold text-hm-ink">{memberId}</span>
                  <button
                    onClick={handleCopyId}
                    className="ml-1 text-hm-muted hover:text-hm-ink transition-colors cursor-pointer"
                    title="Salin Member ID"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div className="self-start sm:self-center">
                <span className="px-2.5 py-1 rounded-xs bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-mono font-semibold">
                  Status: Terverifikasi RAG
                </span>
              </div>
            </div>
          </div>

          {/* 3 Metrik Statistik Tabular */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-hm-paper p-4 rounded-xs border border-hm-rule">
              <span className="text-xs font-display font-medium text-hm-muted block mb-1">Materi Tersimpan</span>
              <p className="text-2xl font-mono font-bold text-hm-ink tabular-nums">{documents.length}</p>
              <span className="text-[10px] text-hm-subtle font-mono">Dokumen Aktif</span>
            </div>

            <div className="bg-hm-paper p-4 rounded-xs border border-hm-rule">
              <span className="text-xs font-display font-medium text-hm-muted block mb-1">Total Halaman</span>
              <p className="text-2xl font-mono font-bold text-hm-ink tabular-nums">{totalPages}</p>
              <span className="text-[10px] text-hm-subtle font-mono">Halaman Terindeks</span>
            </div>

            <div className="bg-hm-paper p-4 rounded-xs border border-hm-rule">
              <span className="text-xs font-display font-medium text-hm-muted block mb-1">Kapasitas Berkas</span>
              <p className="text-2xl font-mono font-bold text-hm-ink tabular-nums">{totalSizeMB} <span className="text-sm font-sans font-normal text-hm-muted">MB</span></p>
              <span className="text-[10px] text-hm-subtle font-mono">PostgreSQL Vector</span>
            </div>
          </div>

          {/* Daftar Dokumen Belajar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-display font-bold text-hm-ink uppercase tracking-wider">
                Koleksi Modul ({documents.length})
              </h4>
            </div>

            {documents.length === 0 ? (
              <div className="text-center py-8 bg-hm-paper rounded-xs border border-hm-rule">
                <FileText className="w-6 h-6 text-hm-subtle mx-auto mb-2 opacity-50" />
                <p className="text-xs font-display font-medium text-hm-ink">Belum Ada Materi Belajar</p>
                <p className="text-[11px] text-hm-muted mt-0.5">Unggah berkas PDF di beranda untuk memulai.</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => {
                      onSelectDocAndOpenWorkspace(doc);
                      onClose();
                    }}
                    className="p-3 rounded-xs border border-hm-rule bg-hm-sheet hover:border-hm-rule-2 hover:bg-hm-paper-2 transition-colors cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <FileText className="w-4 h-4 text-hm-accent shrink-0" />
                      <div className="overflow-hidden">
                        <p className="text-xs font-display font-medium text-hm-ink truncate group-hover:text-hm-accent transition-colors">
                          {doc.filename}
                        </p>
                        <p className="text-[11px] font-mono text-hm-muted tabular-nums">
                          {doc.page_count} Hal · {(doc.file_size_bytes / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-display font-semibold text-hm-accent shrink-0">
                      <span>Buka</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
