import React, { useState, useEffect } from 'react';
import { FileText, Copy, Check, Sparkles, Loader2, BookOpen } from 'lucide-react';
import type { DocumentItem, SummaryData } from '../types';
import { fetchSummary } from '../lib/api';

interface SummaryModuleProps {
  document: DocumentItem | null;
}

export const SummaryModule: React.FC<SummaryModuleProps> = ({ document }) => {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadSummary = async () => {
    if (!document) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchSummary(document.id);
      setSummaryData(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal membuat ringkasan.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (document) {
      setSummaryData(null);
      loadSummary();
    }
  }, [document?.id]);

  const handleCopy = () => {
    if (!summaryData) return;
    const text = `RINGKASAN EKSEKUTIF:\n${summaryData.executive_summary}\n\nPOIN-POIN KUNCI:\n${summaryData.key_points.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\nGLOSARIUM:\n${Object.entries(summaryData.glossary).map(([k, v]) => `• ${k}: ${v}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!document) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center text-slate-400 text-xs">
        Pilih materi terlebih dahulu untuk melihat ringkasan dokumen.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-y-auto p-4 space-y-4">
      {/* Header Ringkasan */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Intisari Materi Belajar</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Analisis terstruktur berdasarkan {document.page_count} halaman modul.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {summaryData && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin' : 'Salin Catatan'}</span>
            </button>
          )}

          <button
            onClick={loadSummary}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Menganalisis...' : 'Perbarui'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="py-16 text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Sedang menyusun ringkasan eksekutif & glosarium...</p>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {errorMsg}
        </div>
      )}

      {summaryData && !loading && (
        <>
          {/* Ringkasan Eksekutif */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Ringkasan Eksekutif</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed text-justify">
              {summaryData.executive_summary}
            </p>
          </div>

          {/* Poin-Poin Kunci */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Poin-Poin Inti Materi</span>
            </h3>
            <ul className="space-y-2">
              {summaryData.key_points.map((pt, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 leading-normal">
                  <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                    {idx + 1}
                  </span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Glosarium Istilah */}
          {Object.keys(summaryData.glossary).length > 0 && (
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span>Glosarium Istilah Teknis</span>
              </h3>
              <div className="grid grid-cols-1 gap-2.5">
                {Object.entries(summaryData.glossary).map(([term, def], idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                    <span className="font-bold text-xs text-blue-900 block">{term}</span>
                    <span className="text-[11px] text-slate-600 leading-snug mt-0.5 block">{def}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
