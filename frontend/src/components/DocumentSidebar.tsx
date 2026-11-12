import React, { useRef, useState } from 'react';
import { Upload, FileText, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import type { DocumentItem } from '../types';
import { uploadDocument, deleteDocument } from '../lib/api';

interface DocumentSidebarProps {
  documents: DocumentItem[];
  activeDoc: DocumentItem | null;
  onSelectDoc: (doc: DocumentItem) => void;
  onRefreshDocs: () => void;
}

export const DocumentSidebar: React.FC<DocumentSidebarProps> = ({
  documents,
  activeDoc,
  onSelectDoc,
  onRefreshDocs,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Hanya file PDF yang diperbolehkan.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setUploadError('Ukuran file melebihi batas 20 MB.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const newDoc = await uploadDocument(file);
      onRefreshDocs();
      onSelectDoc(newDoc);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunggah dokumen.';
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Apakah Anda yakin ingin menghapus materi ini?')) return;
    try {
      await deleteDocument(docId);
      onRefreshDocs();
    } catch (err) {
      alert('Gagal menghapus dokumen.');
    }
  };

  return (
    <aside className="w-80 border-r border-slate-200 bg-white flex flex-col h-[calc(100vh-4rem)] shrink-0">
      <div className="p-4 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-800 flex items-center justify-between">
          <span>Perpustakaan Materi</span>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
            {documents.length} Dokumen
          </span>
        </h2>

        {/* Tombol Upload */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf"
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="mt-3 w-full py-2.5 px-4 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-50 text-blue-600 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>Memproses & Mengindeks...</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span>Upload PDF (Maks 20MB, 50 Hal)</span>
            </>
          )}
        </button>

        {uploadError && (
          <div className="mt-2.5 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      {/* Daftar Dokumen */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {documents.length === 0 ? (
          <div className="text-center py-10 px-4">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">Belum ada materi belajar</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Upload modul PDF Anda untuk memulai tanya jawab, ringkasan, dan kuis.
            </p>
          </div>
        ) : (
          documents.map((doc) => {
            const isActive = activeDoc?.id === doc.id;
            return (
              <div
                key={doc.id}
                onClick={() => onSelectDoc(doc)}
                className={`p-3 rounded-xl border transition cursor-pointer flex items-start justify-between group ${
                  isActive
                    ? 'bg-blue-50/80 border-blue-300 shadow-xs ring-1 ring-blue-300'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-2.5 overflow-hidden">
                  <div
                    className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                      isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <p
                      className={`text-xs font-semibold truncate ${
                        isActive ? 'text-blue-900' : 'text-slate-800'
                      }`}
                      title={doc.filename}
                    >
                      {doc.filename}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {doc.page_count} Hal • {(doc.file_size_bytes / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-1">
                  {isActive && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                  <button
                    onClick={(e) => handleDelete(doc.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                    title="Hapus Dokumen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
