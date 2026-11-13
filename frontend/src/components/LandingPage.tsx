import React, { useRef, useState } from 'react';
import { 
  Upload, LogIn, FileText, ArrowRight, 
  AlertCircle, Loader2, Compass
} from 'lucide-react';
import type { DocumentItem } from '../types';
import { uploadDocument } from '../lib/api';
import { ProfileDropdown } from './ProfileDropdown';

interface LandingPageProps {
  userEmail: string | null;
  memberId?: string;
  documents: DocumentItem[];
  onOpenAuth: (customMessage?: string) => void;
  onLogout: () => void;
  onUploadSuccess: (newDoc: DocumentItem) => void;
  onOpenWorkspace: (doc?: DocumentItem) => void;
  onFileSelectedPreAuth: (file: File) => void;
  isAutoUploading?: boolean;
  onOpenDashboard?: () => void;
  onOpenSettings?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  userEmail,
  memberId,
  documents,
  onOpenAuth,
  onLogout,
  onUploadSuccess,
  onOpenWorkspace,
  onFileSelectedPreAuth,
  isAutoUploading = false,
  onOpenDashboard,
  onOpenSettings,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBoxClick = () => {
    fileInputRef.current?.click();
  };

  const processFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Hanya format file .pdf yang didukung.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setUploadError('Ukuran file melebihi batas 20 MB.');
      return;
    }

    if (!userEmail) {
      setUploadError(null);
      onFileSelectedPreAuth(file);
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const newDoc = await uploadDocument(file);
      onUploadSuccess(newDoc);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memproses berkas PDF.';
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="min-h-screen bg-hm-paper flex flex-col font-sans text-hm-ink selection:bg-hm-accent-soft selection:text-hm-accent">
      {/* Top Masthead */}
      <header className="h-15 border-b border-hm-rule bg-hm-sheet px-6 md:px-12 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xs bg-hm-ink text-hm-paper flex items-center justify-center font-mono font-bold text-xs tracking-tighter">
            KS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-hm-ink text-base tracking-tight">Konco-Sinauku</h1>
              <span className="text-[11px] font-mono text-hm-muted px-1.5 py-0.2 rounded-xs bg-hm-paper-2 border border-hm-rule">
                v2.0
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {userEmail ? (
            <div className="flex items-center gap-2">
              {documents.length > 0 && (
                <button
                  onClick={() => onOpenWorkspace()}
                  className="hm-btn-primary text-xs"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Buka Workspace</span>
                </button>
              )}
              <ProfileDropdown
                userEmail={userEmail}
                memberId={memberId || 'MBR-GUEST'}
                documentsCount={documents.length}
                onOpenDashboard={onOpenDashboard || (() => {})}
                onOpenSettings={onOpenSettings || (() => {})}
                onLogout={onLogout}
                onOpenWorkspace={() => onOpenWorkspace()}
                isWorkspace={false}
              />
            </div>
          ) : (
            <button
              onClick={() => onOpenAuth()}
              className="hm-btn-primary text-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk atau Daftar Akun</span>
            </button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 md:py-16 flex flex-col items-center">
        {/* Editorial Heading: No gradient text, no eyebrow pills */}
        <div className="text-center max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-display font-bold text-hm-ink tracking-tight leading-[1.08]">
            Belajar Efektif dari Dokumen Asli Anda
          </h2>
          <p className="mt-4 text-base md:text-lg text-hm-muted max-w-2xl mx-auto leading-relaxed text-balance">
            Unggah modul kuliah, buku referensi, atau jurnal ilmiah dalam format PDF. Dapatkan jawaban faktual dengan sitasi nomor halaman instan, ringkasan terstruktur, dan evaluasi kuis otomatis.
          </p>
        </div>

        {/* Hallmark Signature: Document Intake Bench */}
        <div className="w-full max-w-xl mt-10">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf"
            className="hidden"
          />

          <div
            onClick={handleBoxClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border border-hm-rule bg-hm-sheet rounded-md p-8 md:p-10 transition-colors cursor-pointer flex flex-col items-center justify-center text-center shadow-xs relative ${
              isDragging
                ? 'border-hm-accent bg-hm-accent-soft'
                : 'hover:border-hm-rule-2'
            }`}
          >
            {isUploading || isAutoUploading ? (
              <div className="flex flex-col items-center py-4">
                <Loader2 className="w-8 h-8 text-hm-accent animate-spin mb-3" />
                <h3 className="font-display font-semibold text-sm text-hm-ink">Mengindeks & Mengekstrak Dokumen</h3>
                <p className="text-xs text-hm-muted mt-1 max-w-xs">
                  Memproses teks per halaman, menyiapkan outline bab, dan membuat embedding semantik Gemini...
                </p>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-sm bg-hm-paper-2 border border-hm-rule flex items-center justify-center text-hm-ink mb-4">
                  <Upload className="w-5 h-5 text-hm-accent" />
                </div>

                <h3 className="font-display font-semibold text-sm md:text-base text-hm-ink">
                  Tarik berkas PDF ke sini atau klik untuk memilih
                </h3>

                <p className="text-xs text-hm-muted mt-1.5 font-sans">
                  Maksimum <span className="font-mono font-medium text-hm-ink">20 MB</span> dan <span className="font-mono font-medium text-hm-ink">50 halaman</span> per dokumen
                </p>

                <div className="mt-6 flex items-center gap-2">
                  <span className="hm-btn-secondary text-xs">
                    Pilih File PDF
                  </span>
                  {!userEmail && (
                    <span className="text-[11px] text-hm-muted font-mono">
                      (Sesi tamu akan meminta login)
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {uploadError && (
            <div className="mt-3 p-3 rounded-xs bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>

        {/* Shelf Dokumen Tersimpan (Jika User Memiliki Dokumen) */}
        {documents.length > 0 && (
          <div className="w-full max-w-xl mt-8 pt-8 border-t border-hm-rule">
            <div className="flex items-center justify-between mb-3">
              <span className="font-display font-semibold text-xs text-hm-muted uppercase tracking-wider">
                Dokumen Tersimpan ({documents.length})
              </span>
              <button
                onClick={() => onOpenWorkspace()}
                className="text-xs font-display font-semibold text-hm-accent hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Buka Dokumen Aktif</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2">
              {documents.slice(0, 3).map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => onOpenWorkspace(doc)}
                  className="flex items-center justify-between p-3 rounded-sm bg-hm-sheet border border-hm-rule hover:border-hm-rule-2 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileText className="w-4 h-4 text-hm-accent shrink-0" />
                    <span className="font-display font-medium text-xs text-hm-ink truncate group-hover:text-hm-accent">
                      {doc.filename}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-[11px] font-mono text-hm-muted">
                    <span>{doc.page_count} Hal</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-hm-accent" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tiga Pilar Kemampuan (Three Concrete Capabilities) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl mt-14 pt-10 border-t border-hm-rule">
          <div className="p-5 rounded-sm bg-hm-sheet border border-hm-rule">
            <div className="w-7 h-7 rounded-xs bg-hm-paper-2 border border-hm-rule flex items-center justify-center font-mono text-xs font-semibold text-hm-accent mb-3">
              01
            </div>
            <h3 className="font-display font-semibold text-sm text-hm-ink">
              Tanya Jawab Bersitasi
            </h3>
            <p className="mt-1.5 text-xs text-hm-muted leading-relaxed">
              Setiap klaim jawaban AI dilengkapi tautan tag <span className="font-mono text-hm-accent font-semibold">[Halaman X]</span> yang menggerakkan viewer PDF secara instan.
            </p>
          </div>

          <div className="p-5 rounded-sm bg-hm-sheet border border-hm-rule">
            <div className="w-7 h-7 rounded-xs bg-hm-paper-2 border border-hm-rule flex items-center justify-center font-mono text-xs font-semibold text-hm-accent mb-3">
              02
            </div>
            <h3 className="font-display font-semibold text-sm text-hm-ink">
              Intisari & Glosarium
            </h3>
            <p className="mt-1.5 text-xs text-hm-muted leading-relaxed">
              Ekstraksi ringkasan eksekutif padat, poin-poin kunci krusial, dan kamus istilah teknis dari seluruh halaman dokumen modul.
            </p>
          </div>

          <div className="p-5 rounded-sm bg-hm-sheet border border-hm-rule">
            <div className="w-7 h-7 rounded-xs bg-hm-paper-2 border border-hm-rule flex items-center justify-center font-mono text-xs font-semibold text-hm-accent mb-3">
              03
            </div>
            <h3 className="font-display font-semibold text-sm text-hm-ink">
              Kuis Evaluasi Terstruktur
            </h3>
            <p className="mt-1.5 text-xs text-hm-muted leading-relaxed">
              Kuis pilihan ganda yang disesuaikan dengan bab dokumen asli menggunakan Gemini Structured Outputs lengkap dengan ulasan akademis.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-hm-rule bg-hm-sheet py-6 px-6 md:px-12 text-center text-xs text-hm-muted font-sans flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-hm-ink">Konco-Sinauku</span>
          <span className="text-hm-subtle">·</span>
          <span>True RAG AI Study Buddy</span>
        </div>
        <div className="font-mono text-[11px] text-hm-subtle">
          Built with Gemini text-embedding-004 & PostgreSQL pgvector
        </div>
      </footer>
    </div>
  );
};
