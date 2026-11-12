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
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50 border-r border-slate-200">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
          <FileText className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-slate-700 text-sm">Dokumen Belum Dipilih</h3>
        <p className="text-xs text-slate-500 max-w-xs mt-1">
          Pilih salah satu materi di perpustakaan sisi kiri atau unggah file PDF modul baru untuk ditampilkan di sini.
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
    <div className="h-full flex flex-col bg-slate-100 border-r border-slate-200 overflow-hidden">
      {/* Toolbar Kontrol PDF */}
      <div className="h-12 bg-white border-b border-slate-200 px-4 flex items-center justify-between text-xs shrink-0 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700 truncate max-w-[180px] md:max-w-[240px]">
            {document.filename}
          </span>
          <span className="text-[11px] text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full font-medium">
            Hal {currentPage} / {totalPages}
          </span>
        </div>

        {/* Navigasi Halaman */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
            title="Halaman Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>

          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={handlePageInput}
              className="w-12 text-center py-1 border border-slate-300 rounded text-xs font-semibold focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-slate-400">/ {totalPages}</span>
          </div>

          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
            title="Halaman Berikutnya"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {/* Zoom & Buka Tab Baru */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoomLevel((z) => Math.max(50, z - 15))}
            className="p-1 rounded hover:bg-slate-100 text-slate-600 cursor-pointer"
            title="Perkecil"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-medium text-slate-500 w-9 text-center">
            {zoomLevel}%
          </span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(200, z + 15))}
            className="p-1 rounded hover:bg-slate-100 text-slate-600 cursor-pointer"
            title="Perbesar"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 ml-1 rounded hover:bg-slate-100 text-slate-500 hover:text-blue-600 cursor-pointer"
            title="Buka PDF di Tab Baru"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Frame Tampilan Dokumen PDF Asli */}
      <div className="flex-1 w-full h-full bg-slate-200 overflow-hidden relative">
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
