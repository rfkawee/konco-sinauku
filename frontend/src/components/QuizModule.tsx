import React, { useState } from 'react';
import { CheckCircle, XCircle, Sparkles, Loader2, RefreshCw, ArrowUpRight } from 'lucide-react';
import type { DocumentItem, QuizQuestion, QuizSubmitResponse } from '../types';
import { fetchQuiz, submitQuizAnswers } from '../lib/api';

interface QuizModuleProps {
  document: DocumentItem | null;
  onJumpToPage: (pageNumber: number) => void;
}

export const QuizModule: React.FC<QuizModuleProps> = ({ document, onJumpToPage }) => {
  const [selectedTopic, setSelectedTopic] = useState<string>('Semua Bagian Dokumen');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [numQuestions, setNumQuestions] = useState<number>(5);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [quizResult, setQuizResult] = useState<QuizSubmitResponse | null>(null);

  const handleGenerateQuiz = async () => {
    if (!document) return;
    setLoading(true);
    setErrorMsg(null);
    setQuizResult(null);
    setUserAnswers({});

    const activeTopic = selectedTopic === 'Kustom' ? customTopic.trim() || 'Topik Pilihan' : selectedTopic;

    try {
      const res = await fetchQuiz(document.id, activeTopic, numQuestions);
      setQuestions(res.questions);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal membuat kuis.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: number, optionLetter: string) => {
    if (quizResult) return;
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionLetter,
    }));
  };

  const handleSubmitAll = async () => {
    if (!document || questions.length === 0) return;

    const unansweredCount = questions.filter((q) => !userAnswers[q.id]).length;
    if (unansweredCount > 0) {
      if (!confirm(`Terdapat ${unansweredCount} soal yang belum dijawab. Apakah Anda yakin ingin submit sekarang?`)) {
        return;
      }
    }

    setSubmitting(true);
    try {
      const payloadAnswers = questions.map((q) => ({
        question_id: q.id,
        user_answer: userAnswers[q.id] || null,
      }));

      const activeTopic = selectedTopic === 'Kustom' ? customTopic || 'Topik Pilihan' : selectedTopic;
      const result = await submitQuizAnswers(document.id, activeTopic, payloadAnswers, questions);
      setQuizResult(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengevaluasi kuis.';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!document) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center text-hm-muted text-xs">
        Pilih materi terlebih dahulu untuk membuka modul kuis evaluasi.
      </div>
    );
  }

  const topicOptions = ['Semua Bagian Dokumen', ...(document.topics || []), 'Kustom'];

  return (
    <div className="h-full flex flex-col bg-hm-paper overflow-y-auto p-4 md:p-5 space-y-4">
      {/* Konfigurasi Kuis */}
      <div className="bg-hm-sheet rounded-sm p-4 border border-hm-rule select-none">
        <h2 className="text-sm font-display font-bold text-hm-ink mb-3 flex items-center gap-2">
          <span>Kuis & Evaluasi Pemahaman</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          {/* Topik Selector */}
          <div>
            <label className="block text-xs font-display font-medium text-hm-muted mb-1">
              Topik / Bab Materi:
            </label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              disabled={loading || submitting}
              className="w-full py-1.5 px-2.5 text-xs border border-hm-rule rounded-xs bg-hm-sheet text-hm-ink focus:border-hm-accent outline-none"
            >
              {topicOptions.map((top, idx) => (
                <option key={idx} value={top}>
                  {top}
                </option>
              ))}
            </select>
          </div>

          {/* Jumlah Soal */}
          <div>
            <label className="block text-xs font-display font-medium text-hm-muted mb-1">
              Jumlah Butir Soal:
            </label>
            <div className="flex items-center gap-1.5 font-mono">
              {[3, 5, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setNumQuestions(num)}
                  className={`px-3 py-1 rounded-xs text-xs font-medium transition-colors cursor-pointer border ${
                    numQuestions === num
                      ? 'bg-hm-ink text-hm-paper border-hm-ink'
                      : 'bg-hm-sheet text-hm-muted border-hm-rule hover:border-hm-rule-2'
                  }`}
                >
                  <span className="tabular-nums">{num}</span> Soal
                </button>
              ))}
            </div>
          </div>
        </div>

        {selectedTopic === 'Kustom' && (
          <div className="mb-3">
            <label className="block text-xs font-display font-medium text-hm-muted mb-1">
              Tulis Topik Kustom:
            </label>
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="Contoh: Mekanisme Difusi dan Osmosis"
              className="w-full py-1.5 px-3 text-xs border border-hm-rule rounded-xs bg-hm-sheet focus:border-hm-accent outline-none font-sans"
            />
          </div>
        )}

        <button
          onClick={handleGenerateQuiz}
          disabled={loading || submitting}
          className="hm-btn-primary w-full text-xs py-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Menyusun Soal via Gemini Structured Output...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>{questions.length > 0 ? 'Buat Ulang Soal Kuis' : 'Generate Soal Kuis Sekarang'}</span>
            </>
          )}
        </button>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-sm bg-rose-50 border border-rose-200 text-rose-800 text-xs font-sans">
          {errorMsg}
        </div>
      )}

      {/* Banner Hasil Kuis Pasca Submit */}
      {quizResult && (
        <div className="bg-hm-sheet border border-emerald-600 rounded-sm p-4 select-none">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-display font-bold text-hm-ink flex items-center gap-2">
                <span>Skor Evaluasi:</span>
                <span className="font-mono text-emerald-700 text-base tabular-nums">
                  {quizResult.percentage}%
                </span>
                <span className="text-xs font-mono text-hm-muted">
                  ({quizResult.correct_count} / {quizResult.total_questions} Benar)
                </span>
              </h3>
              <p className="text-xs text-hm-muted mt-1 font-sans">{quizResult.message}</p>
            </div>
            <button
              onClick={handleGenerateQuiz}
              className="hm-btn-secondary text-xs py-1.5 px-2.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Latihan Lagi</span>
            </button>
          </div>
        </div>
      )}

      {/* Daftar Soal */}
      {questions.length > 0 && (
        <div className="space-y-3">
          {questions.map((q, idx) => {
            const detail = quizResult?.details.find((d) => d.question_id === q.id);
            const userChoice = userAnswers[q.id];

            return (
              <div
                key={q.id}
                className={`p-4 md:p-5 rounded-sm border bg-hm-sheet transition-colors ${
                  detail
                    ? detail.is_correct
                      ? 'border-emerald-500'
                      : 'border-rose-400'
                    : 'border-hm-rule'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h4 className="font-display font-semibold text-xs md:text-sm text-hm-ink leading-snug">
                    <span className="font-mono text-hm-accent font-bold mr-2 tabular-nums">
                      [{String(idx + 1).padStart(2, '0')}]
                    </span>
                    {q.question}
                  </h4>
                  {detail && (
                    <span className="shrink-0">
                      {detail.is_correct ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600" />
                      )}
                    </span>
                  )}
                </div>

                {/* 4 Opsi Jawaban */}
                <div className="space-y-1.5">
                  {q.options.map((opt, oIdx) => {
                    const letter = opt.trim().substring(0, 1).toUpperCase();
                    const isSelected = userChoice === letter;
                    let optionStyle = 'border-hm-rule bg-hm-paper-2 hover:bg-hm-paper-3 text-hm-ink';

                    if (detail) {
                      if (letter === detail.correct_answer) {
                        optionStyle = 'border-emerald-600 bg-emerald-50 text-emerald-950 font-semibold';
                      } else if (isSelected && !detail.is_correct) {
                        optionStyle = 'border-rose-400 bg-rose-50 text-rose-900 line-through';
                      } else {
                        optionStyle = 'border-hm-rule bg-hm-paper-2 opacity-50 text-hm-muted';
                      }
                    } else if (isSelected) {
                      optionStyle = 'border-hm-accent bg-hm-accent-soft text-hm-accent font-semibold';
                    }

                    return (
                      <div
                        key={oIdx}
                        onClick={() => handleSelectOption(q.id, letter)}
                        className={`p-2.5 rounded-xs border text-xs cursor-pointer transition-colors flex items-center justify-between ${optionStyle}`}
                      >
                        <span className="font-sans leading-relaxed">{opt}</span>
                        {isSelected && !detail && (
                          <div className="w-2 h-2 rounded-full bg-hm-accent shrink-0 ml-2" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Analisis Jawaban Pasca Submit */}
                {detail && (
                  <div className="mt-3 pt-3 border-t border-hm-rule bg-hm-paper-2 p-3 rounded-xs text-xs space-y-2">
                    <p className="font-reading text-[14px] text-hm-ink leading-relaxed">
                      <strong className="font-display font-semibold text-hm-ink">Pembahasan: </strong>
                      {detail.explanation}
                    </p>
                    <div className="flex items-center justify-between pt-1 font-sans">
                      <span className="text-[11px] font-mono text-hm-muted">
                        Kunci: <strong className="text-emerald-700">{detail.correct_answer}</strong>
                      </span>
                      <button
                        onClick={() => onJumpToPage(detail.relevant_page)}
                        className="hm-citation-tag"
                      >
                        <ArrowUpRight className="w-2.5 h-2.5" />
                        <span>Verifikasi Hal {detail.relevant_page}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Tombol Submit Semua Jawaban */}
          {!quizResult && (
            <div className="pt-2 sticky bottom-4 z-10">
              <button
                onClick={handleSubmitAll}
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-hm-ink hover:bg-black text-hm-paper font-display font-semibold text-xs rounded-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Mengevaluasi Hasil Pengerjaan...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Submit & Kunci Semua Jawaban</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
