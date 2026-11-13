import React, { useState, useEffect } from 'react';
import { Copy, Check, Loader2, RefreshCw } from 'lucide-react';
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
      <div className="h-full flex items-center justify-center p-8 text-center text-hm-muted text-xs">
        Pilih materi terlebih dahulu untuk melihat ringkasan dokumen.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-hm-paper overflow-y-auto p-4 md:p-5 space-y-4">
      {/* Header Intisari */}
      <div className="bg-hm-sheet rounded-sm p-4 border border-hm-rule flex items-center justify-between select-none">
        <div>
          <h2 className="text-sm font-display font-bold text-hm-ink flex items-center gap-2">
            <span>Intisari & Konsep Kunci</span>
          </h2>
          <p className="text-xs text-hm-muted mt-0.5 font-sans">
            Materi: <span className="font-medium text-hm-ink">{document.filename}</span> (<span className="font-mono tabular-nums">{document.page_count}</span> Hal)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {summaryData && (
            <button
              onClick={handleCopy}
              className="hm-btn-secondary text-xs py-1.5 px-2.5"
              title="Salin ke Clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin' : 'Salin Catatan'}</span>
            </button>
          )}

          <button
            onClick={loadSummary}
            disabled={loading}
            className="hm-btn-primary text-xs py-1.5 px-3 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Menganalisis...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Perbarui</span>
              </>
            )}
          </button>
        </div>
      </div>

      {loading && (
        <div className="py-20 text-center select-none">
          <Loader2 className="w-7 h-7 text-hm-accent animate-spin mx-auto mb-2" />
          <p className="text-xs text-hm-muted font-display font-medium">
            Menganalisis dokumen secara semantik & menyusun glosarium...
          </p>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-sm bg-rose-50 border border-rose-200 text-rose-800 text-xs font-sans">
          {errorMsg}
        </div>
      )}

      {summaryData && !loading && (
        <>
          {/* Ringkasan Eksekutif */}
          <div className="bg-hm-sheet rounded-sm p-5 border border-hm-rule">
            <h3 className="text-xs font-display font-bold text-hm-muted uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-hm-accent" />
              <span>Ringkasan Eksekutif</span>
            </h3>
            <p className="font-reading text-[15px] text-hm-ink leading-[1.65] text-justify">
              {summaryData.executive_summary}
            </p>
          </div>

          {/* Poin-Poin Kunci */}
          <div className="bg-hm-sheet rounded-sm p-5 border border-hm-rule">
            <h3 className="text-xs font-display font-bold text-hm-muted uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-hm-accent" />
              <span>Pokok Bahasan Krusial</span>
            </h3>
            <div className="space-y-2.5 divide-y divide-hm-rule">
              {summaryData.key_points.map((pt, idx) => (
                <div key={idx} className="pt-2.5 first:pt-0 flex items-start gap-3 text-xs text-hm-ink">
                  <span className="font-mono font-bold text-[11px] text-hm-accent shrink-0 mt-0.5 tabular-nums">
                    [{String(idx + 1).padStart(2, '0')}]
                  </span>
                  <span className="leading-relaxed font-sans">{pt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Glosarium Istilah */}
          {Object.keys(summaryData.glossary).length > 0 && (
            <div className="bg-hm-sheet rounded-sm p-5 border border-hm-rule">
              <h3 className="text-xs font-display font-bold text-hm-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-hm-accent" />
                <span>Glosarium Istilah Ilmiah</span>
              </h3>
              <div className="border border-hm-rule rounded-xs divide-y divide-hm-rule overflow-hidden">
                {Object.entries(summaryData.glossary).map(([term, def], idx) => (
                  <div key={idx} className="p-3 bg-hm-sheet hover:bg-hm-paper-2 transition-colors flex flex-col md:flex-row md:items-baseline gap-1 md:gap-4">
                    <span className="font-display font-bold text-xs text-hm-ink shrink-0 md:w-44">
                      {term}
                    </span>
                    <span className="text-xs text-hm-muted font-sans leading-relaxed">
                      {def}
                    </span>
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
