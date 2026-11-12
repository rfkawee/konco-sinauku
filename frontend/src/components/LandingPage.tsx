import React, { useRef, useState } from 'react';
import { 
  BookOpen, Upload, LogIn, FileText, Sparkles, MessageSquare, 
  Award, ChevronRight, Loader2, AlertCircle, ArrowRight
} from 'lucide-react';
import type { DocumentItem } from '../types';
import { uploadDocument } from '../lib/api';

interface LandingPageProps {
  userEmail: string | null;
  documents: DocumentItem[];
  onOpenAuth: (customMessage?: string) => void;
  onLogout: () => void;
  onUploadSuccess: (newDoc: DocumentItem) => void;
  onOpenWorkspace: (doc?: DocumentItem) => void;
  onFileSelectedPreAuth: (file: File) => void;
  isAutoUploading?: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  userEmail,
  documents,
  onOpenAuth,
  onLogout,
  onUploadSuccess,
  onOpenWorkspace,
  onFileSelectedPreAuth,
  isAutoUploading = false,
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

    // Jika user belum login, simpan file sebagai pending upload dan arahkan ke login modal
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
      const msg = err instanceof Error ? err.message : 'Gagal mengunggah file PDF.';
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
    // Reset nilai agar input change tetap terpicu jika file yang sama dipilih kembali
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
    <div className="min-h-screen bg-linear-to-b from-slate-50 via-white to-blue-50/30 flex flex-col font-sans">
      {/* Navbar Khusus Landing Page */}
      <header className="h-18 border-b border-slate-200/80 bg-white/80 backdrop-blur-md px-6 md:px-12 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-slate-800 text-lg tracking-tight">Konco-Sinauku</h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                AI Study Buddy
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">Platform Belajar Cerdas dengan RAG & Dokumen Asli</p>
          </div>
        </div>

        {/* Tombol Login / Info Akun di Landing Page */}
        <div className="flex items-center gap-3">
          {userEmail ? (
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-2xs">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                {userEmail.charAt(0).toUpperCase()}
              </div>
              <span className="text-slate-700 font-semibold text-xs hidden md:inline">{userEmail}</span>
              {documents.length > 0 && (
                <button
                  onClick={() => onOpenWorkspace()}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer"
                >
                  <span>Buka Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={onLogout}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium ml-1 cursor-pointer"
              >
                Keluar
              </button>
            </div>
          ) : (
            <button
              onClick={() => onOpenAuth()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition cursor-pointer shadow-md shadow-blue-500/20"
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk / Daftar Akun</span>
            </button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-12 md:py-16 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Didukung Google Gemini & Retrieval-Augmented Generation</span>
        </div>

        <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight max-w-3xl">
          Belajar Lebih Efektif dengan <span className="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Asisten AI</span> Berbasis Dokumen Asli Anda
        </h2>

        <p className="mt-4 text-sm md:text-base text-slate-600 max-w-2xl leading-relaxed">
          Unggah modul buku, jurnal, atau materi perkuliahan dalam format PDF. Dapatkan jawaban faktual bersitasi halaman, ringkasan materi instan, dan kuis latihan interaktif.
        </p>

        {/* BOX UPLOAD UTAMA DENGAN PROTEKSI LOGIN */}
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
            className={`border-2 border-dashed rounded-3xl p-8 md:p-10 transition cursor-pointer flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden group ${
              isDragging
                ? 'border-blue-600 bg-blue-50/90 scale-[1.01]'
                : 'border-blue-300 bg-white hover:border-blue-500 hover:bg-blue-50/30'
            }`}
          >
            {isUploading || isAutoUploading ? (
              <div className="py-6 flex flex-col items-center">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <h4 className="font-bold text-slate-800 text-base">Memproses & Mengindeks Dokumen...</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Mengekstrak teks halaman, menghasilkan embedding semantik, dan menyiapkan modul belajar.
                </p>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-blue-50 group-hover:bg-blue-100 text-blue-600 flex items-center justify-center mb-4 transition shadow-xs">
                  <Upload className="w-8 h-8" />
                </div>

                <h3 className="font-bold text-slate-800 text-lg group-hover:text-blue-700 transition">
                  Klik atau Tarik File PDF Anda ke Sini
                </h3>

                <p className="text-xs text-slate-500 mt-1.5 max-w-sm">
                  Mendukung file materi belajar format PDF hingga 20 MB dan maksimal 50 halaman.
                </p>

                <div className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 group-hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition">
                  <Upload className="w-4 h-4" />
                  <span>Pilih File PDF</span>
                </div>
              </>
            )}
          </div>

          {uploadError && (
            <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>

        {/* Daftar Materi yang Sudah Ada (Jika User Memiliki Dokumen) */}
        {userEmail && documents.length > 0 && (
          <div className="w-full max-w-xl mt-8 text-left bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3 px-1">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Materi Belajar Tersimpan ({documents.length})
              </h4>
              <button
                onClick={() => onOpenWorkspace()}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Buka Semua</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {documents.slice(0, 3).map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => onOpenWorkspace(doc)}
                  className="p-3 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/50 transition cursor-pointer flex items-center justify-between group"
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

                  <span className="text-xs text-blue-600 font-semibold flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
                    <span>Pelajari</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3 Fitur Unggulan Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mt-16 text-left">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm mb-1.5">Tanya Jawab Bersitasi</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tanyakan apa saja seputar isi modul. Asisten menjawab faktual dengan sitasi [Halaman X] yang otomatis menggerakkan viewer PDF.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm mb-1.5">Ringkasan & Glosarium</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Ringkasan eksekutif padat, butir pokok bahasan ujian, serta daftar istilah teknis penting untuk mempercepat review materi.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <Award className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm mb-1.5">Kuis Berbasis Bab</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Latihan soal pilihan ganda sesuai topik bab pilihan dengan sistem submit serentak, skor akhir, dan pembahasan mendalam.
            </p>
          </div>
        </div>
      </main>

      {/* Footer Sederhana */}
      <footer className="py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-400">
        Konco-Sinauku © 2026 • AI Study Buddy Pelajar Indonesia
      </footer>
    </div>
  );
};
