import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, ZoomIn, ZoomOut, FileText } from 'lucide-react';
import type { DocumentItem } from '../types';
import { getDocumentPdfUrl } from '../lib/api';

interface PDFViewerPanelProps {
  document: DocumentItem | null;
  currentPage: number;
  onPageChange: (newPage: number) => void;
}

export const PDFViewerPanel: React.FC<PDFViewerPanelProps> = ({
  document,
  currentPage,
  onPageChange,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  if (!document) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-hm-paper-2 border-r border-hm-rule">
        <div className="w-12 h-12 rounded-xs bg-hm-sheet border border-hm-rule flex items-center justify-center text-hm-muted mb-3">
          <FileText className="w-6 h-6 text-hm-muted" />
        </div>
        <h3 className="font-display font-semibold text-hm-ink text-sm">Dokumen Belum Dipilih</h3>
        <p className="text-xs text-hm-muted max-w-xs mt-1 leading-relaxed">
          Pilih salah satu materi di perpustakaan sisi kiri atau unggah berkas PDF baru untuk mulai membaca dan menganalisis.
        </p>
      </div>
    );
  }

  const pdfUrl = getDocumentPdfUrl(document.id);
  const totalPages = document.page_count;

  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val >= 1 && val <= totalPages) {
      onPageChange(val);
    }
  };

  return (
    <div className="h-full flex flex-col bg-hm-paper-3 border-r border-hm-rule overflow-hidden select-none">
      {/* Precision PDF Reader Toolbar */}
      <div className="h-11 bg-hm-sheet border-b border-hm-rule px-3 md:px-4 flex items-center justify-between text-xs shrink-0">
        {/* Filename & Info */}
        <div className="flex items-center gap-2 overflow-hidden mr-2">
          <span className="font-display font-semibold text-hm-ink truncate max-w-[160px] md:max-w-[220px]">
            {document.filename}
          </span>
          <span className="text-[11px] font-mono font-medium px-1.5 py-0.2 rounded-xs bg-hm-paper-2 text-hm-muted border border-hm-rule shrink-0">
            Hal <span className="tabular-nums font-semibold text-hm-ink">{currentPage}</span> / <span className="tabular-nums">{totalPages}</span>
          </span>
        </div>

        {/* Page Nav Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className="p-1 rounded-xs border border-hm-rule hover:bg-hm-paper-2 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
            title="Halaman Sebelumnya"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-hm-ink" />
          </button>

          <div className="flex items-center gap-1 font-mono text-xs">
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={handlePageInput}
              className="w-11 text-center py-0.5 border border-hm-rule rounded-xs text-xs font-semibold bg-hm-sheet focus:border-hm-accent outline-none tabular-nums"
            />
            <span className="text-hm-subtle">/</span>
            <span className="text-hm-muted tabular-nums pr-1">{totalPages}</span>
          </div>

          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            className="p-1 rounded-xs border border-hm-rule hover:bg-hm-paper-2 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
            title="Halaman Berikutnya"
          >
            <ChevronRight className="w-3.5 h-3.5 text-hm-ink" />
          </button>
        </div>

        {/* Zoom & External Tab */}
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={() => setZoomLevel((z) => Math.max(50, z - 15))}
            className="p-1 rounded-xs hover:bg-hm-paper-2 text-hm-muted hover:text-hm-ink cursor-pointer transition-colors"
            title="Perkecil"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-hm-muted w-8 text-center tabular-nums">
            {zoomLevel}%
          </span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(200, z + 15))}
            className="p-1 rounded-xs hover:bg-hm-paper-2 text-hm-muted hover:text-hm-ink cursor-pointer transition-colors"
            title="Perbesar"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded-xs hover:bg-hm-paper-2 text-hm-muted hover:text-hm-accent cursor-pointer transition-colors"
            title="Buka Berkas PDF Utuh di Tab Baru"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Frame Tampilan Dokumen PDF Asli */}
      <div className="flex-1 w-full h-full bg-hm-paper-2 overflow-hidden relative">
        <iframe
          key={`${document.id}-page-${currentPage}-${zoomLevel}`}
          src={`${pdfUrl}#page=${currentPage}&zoom=${zoomLevel}`}
          className="w-full h-full border-none"
          title="Pratinjau PDF Asli"
        />
      </div>
    </div>
  );
};
