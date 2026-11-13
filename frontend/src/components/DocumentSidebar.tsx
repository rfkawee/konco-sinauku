import React, { useRef, useState } from 'react';
import { Upload, FileText, Trash2, Check, AlertCircle, Loader2 } from 'lucide-react';
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
      setUploadError('Hanya format .pdf yang diperbolehkan.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setUploadError('Ukuran berkas melebihi batas 20 MB.');
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
    <aside className="w-76 border-r border-hm-rule bg-hm-sheet flex flex-col h-full shrink-0 select-none">
      {/* Top Header */}
      <div className="p-3.5 border-b border-hm-rule">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-display font-bold text-hm-ink uppercase tracking-wider">
            Perpustakaan Materi
          </h2>
          <span className="text-[11px] font-mono text-hm-muted tabular-nums">
            {documents.length} Dokumen
          </span>
        </div>

        {/* Upload Button */}
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
          className="mt-2.5 w-full py-2 px-3 rounded-xs border border-hm-rule bg-hm-paper-2 hover:bg-hm-paper-3 text-hm-ink font-display font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-hm-accent" />
              <span>Mengindeks PDF...</span>
            </>
          ) : (
            <>
              <Upload className="w-3.5 h-3.5 text-hm-accent" />
              <span>Unggah Modul Baru</span>
            </>
          )}
        </button>

        {uploadError && (
          <div className="mt-2 p-2 rounded-xs bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-start gap-1.5 font-sans">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {documents.length === 0 ? (
          <div className="text-center py-10 px-4 text-hm-muted">
            <FileText className="w-7 h-7 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-display font-medium text-hm-ink">Belum Ada Materi</p>
            <p className="text-[11px] mt-1 leading-relaxed">
              Unggah file PDF materi untuk memulai sesi belajar.
            </p>
          </div>
        ) : (
          documents.map((doc) => {
            const isActive = activeDoc?.id === doc.id;
            return (
              <div
                key={doc.id}
                onClick={() => onSelectDoc(doc)}
                className={`p-2.5 rounded-xs border transition-colors cursor-pointer flex items-start justify-between group ${
                  isActive
                    ? 'bg-hm-accent-soft/40 border-hm-accent border-l-2'
                    : 'bg-hm-sheet border-hm-rule hover:border-hm-rule-2 hover:bg-hm-paper-2'
                }`}
              >
                <div className="flex items-start gap-2 overflow-hidden">
                  <FileText className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isActive ? 'text-hm-accent' : 'text-hm-muted'}`} />
                  <div className="overflow-hidden">
                    <p
                      className={`text-xs font-display font-medium truncate ${
                        isActive ? 'text-hm-ink font-semibold' : 'text-hm-ink-2'
                      }`}
                      title={doc.filename}
                    >
                      {doc.filename}
                    </p>
                    <p className="text-[10px] font-mono text-hm-muted mt-0.5 tabular-nums">
                      {doc.page_count} Hal · {(doc.file_size_bytes / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-1">
                  {isActive && <Check className="w-3.5 h-3.5 text-hm-accent" />}
                  <button
                    onClick={(e) => handleDelete(doc.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-hm-muted hover:text-rose-700 transition-opacity cursor-pointer"
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
