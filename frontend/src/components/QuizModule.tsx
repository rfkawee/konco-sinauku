import React, { useState } from 'react';
import { Award, CheckCircle, XCircle, Sparkles, Loader2, Bookmark, RefreshCw } from 'lucide-react';
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
    if (quizResult) return; // Kuis sudah disubmit, tidak bisa diganti
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionLetter,
    }));
  };

  const handleSubmitAll = async () => {
    if (!document || questions.length === 0) return;

    // Cek apakah ada soal yang belum dijawab
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
      <div className="h-full flex items-center justify-center p-8 text-center text-slate-400 text-xs">
        Pilih materi terlebih dahulu untuk membuka modul kuis evaluasi.
      </div>
    );
  }

  const topicOptions = ['Semua Bagian Dokumen', ...(document.topics || []), 'Kustom'];

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-y-auto p-4 space-y-4">
      {/* Kartu Konfigurasi Kuis */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-3">
          <Award className="w-4 h-4 text-blue-600" />
          <span>Pengaturan Kuis Pilihan Ganda</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          {/* Pilih Topik */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Topik / Bab Materi:
            </label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              disabled={loading || submitting}
              className="w-full py-1.5 px-2.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-500"
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Jumlah Butir Soal:
            </label>
            <div className="flex items-center gap-2">
              {[3, 5, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setNumQuestions(num)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                    numQuestions === num
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {num} Soal
                </button>
              ))}
            </div>
          </div>
        </div>

        {selectedTopic === 'Kustom' && (
          <div className="mb-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tulis Topik Kustom:
            </label>
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="Contoh: Mekanisme Difusi dan Osmosis"
              className="w-full py-1.5 px-3 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

        <button
          onClick={handleGenerateQuiz}
          disabled={loading || submitting}
          className="w-full py-2.5 px-4 bg-linear-to-r from-blue-600 to-indigo-600 text-white font-semibold text-xs rounded-xl hover:from-blue-700 hover:to-indigo-700 transition cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Menyusun Soal Berdasarkan Materi...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{questions.length > 0 ? 'Buat Ulang Kuis' : 'Buat Soal Kuis Sekarang'}</span>
            </>
          )}
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Banner Hasil Kuis Pasca Submit */}
      {quizResult && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-4 shadow-xs animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-emerald-900">
                Skor Akhir: {quizResult.percentage}% ({quizResult.correct_count} / {quizResult.total_questions} Benar)
              </h3>
              <p className="text-xs text-emerald-700 mt-1">{quizResult.message}</p>
            </div>
            <button
              onClick={handleGenerateQuiz}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Latihan Lagi</span>
            </button>
          </div>
        </div>
      )}

      {/* Daftar Soal */}
      {questions.length > 0 && (
        <div className="space-y-3.5">
          {questions.map((q, idx) => {
            const detail = quizResult?.details.find((d) => d.question_id === q.id);
            const userChoice = userAnswers[q.id];

            return (
              <div
                key={q.id}
                className={`p-4 rounded-xl border transition bg-white shadow-2xs ${
                  detail
                    ? detail.is_correct
                      ? 'border-emerald-300 bg-emerald-50/20'
                      : 'border-rose-300 bg-rose-50/20'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-bold text-xs text-slate-800 leading-snug">
                    <span className="text-blue-600 mr-1.5">#{idx + 1}</span>
                    {q.question}
                  </h4>
                  {detail && (
                    <span className="shrink-0">
                      {detail.is_correct ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-500" />
                      )}
                    </span>
                  )}
                </div>

                {/* 4 Opsi Jawaban */}
                <div className="space-y-1.5 mt-2.5">
                  {q.options.map((opt, oIdx) => {
                    const letter = opt.trim().substring(0, 1).toUpperCase();
                    const isSelected = userChoice === letter;
                    let optionClass = 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700';

                    if (detail) {
                      if (letter === detail.correct_answer) {
                        optionClass = 'border-emerald-500 bg-emerald-100/70 text-emerald-900 font-bold';
                      } else if (isSelected && !detail.is_correct) {
                        optionClass = 'border-rose-400 bg-rose-100/70 text-rose-900 line-through';
                      } else {
                        optionClass = 'border-slate-200 bg-slate-50 opacity-60 text-slate-500';
                      }
                    } else if (isSelected) {
                      optionClass = 'border-blue-500 bg-blue-50 text-blue-900 font-bold ring-1 ring-blue-400';
                    }

                    return (
                      <div
                        key={oIdx}
                        onClick={() => handleSelectOption(q.id, letter)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between ${optionClass}`}
                      >
                        <span>{opt}</span>
                        {isSelected && !detail && (
                          <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Penjelasan & Analisis Pasca Submit */}
                {detail && (
                  <div className="mt-3 pt-3 border-t border-slate-200/80 bg-slate-50 p-3 rounded-lg text-xs space-y-2">
                    <p className="text-slate-700 leading-relaxed">
                      <strong>Analisis Pembahasan:</strong> {detail.explanation}
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-500">
                        Kunci Jawaban: <strong className="text-emerald-700">{detail.correct_answer}</strong>
                      </span>
                      <button
                        onClick={() => onJumpToPage(detail.relevant_page)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold text-[11px] transition cursor-pointer border border-blue-300"
                      >
                        <Bookmark className="w-3 h-3 text-blue-600" />
                        <span>Validasi di Halaman {detail.relevant_page}</span>
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
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mengevaluasi Jawaban Anda...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Submit Semua Jawaban</span>
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
