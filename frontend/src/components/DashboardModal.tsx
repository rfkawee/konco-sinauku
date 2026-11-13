import React from 'react';
import { 
  X, LayoutDashboard, FileText, BookOpen, 
  ShieldCheck, ArrowRight, Sparkles, Copy, Check
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
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col font-sans">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-linear-to-r from-blue-50/40 via-white to-indigo-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Dashboard Belajar</h2>
              <p className="text-xs text-slate-500">Ringkasan aktivitas materi & status keanggotaan Anda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Konten Dashboard */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Kartu Profil Member */}
          <div className="bg-linear-to-r from-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-md relative overflow-hidden">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-semibold tracking-wider text-blue-300 uppercase">
                  Akun Pelajar Terverifikasi
                </span>
                <h3 className="text-lg font-extrabold mt-0.5">{userEmail || 'Siswa Konco-Sinauku'}</h3>
                <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-mono font-bold tracking-wide">{memberId}</span>
                  <button
                    onClick={handleCopyId}
                    className="ml-1 text-slate-300 hover:text-white transition cursor-pointer"
                    title="Salin Member ID"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                  Status: Aktif RAG
                </span>
              </div>
            </div>
          </div>

          {/* 3 Kartu Statistik */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-2">
                <FileText className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-slate-800">{documents.length}</p>
              <p className="text-xs text-slate-500 font-medium">Dokumen Tersimpan</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center mb-2">
                <BookOpen className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-slate-800">{totalPages}</p>
              <p className="text-xs text-slate-500 font-medium">Total Halaman Terindeks</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
                <Sparkles className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-slate-800">{totalSizeMB} MB</p>
              <p className="text-xs text-slate-500 font-medium">Kapasitas Dokumen</p>
            </div>
          </div>

          {/* Daftar Dokumen Belajar */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Materi Belajar Anda ({documents.length})
              </h4>
            </div>

            {documents.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">Belum ada materi belajar yang diunggah.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Unggah modul PDF di beranda untuk memulai.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => {
                      onSelectDocAndOpenWorkspace(doc);
                      onClose();
                    }}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-700 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-800 truncate group-hover:text-blue-700 transition">
                          {doc.filename}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {doc.page_count} Halaman • {(doc.file_size_bytes / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-blue-600 font-semibold shrink-0 group-hover:translate-x-0.5 transition">
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
