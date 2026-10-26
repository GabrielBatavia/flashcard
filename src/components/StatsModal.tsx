import React, { useMemo } from 'react';
import { X, Trophy, BarChart3, CheckCircle2, RotateCcw, Layers } from 'lucide-react';
import type { Deck } from '../types';
import { loadQuizHistory } from '../utils/storage';
import { useDialog } from './useDialog';

interface StatsModalProps {
  decks: Deck[];
  isOpen: boolean;
  onClose: () => void;
  onResetProgress: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  decks,
  isOpen,
  onClose,
  onResetProgress,
}) => {
  const dialogRef = useDialog(isOpen, onClose);
  const quizHistory = useMemo(() => isOpen ? loadQuizHistory() : [], [isOpen]);

  const stats = useMemo(() => {
    let totalCards = 0;
    let masteredCards = 0;
    decks.forEach(d => {
      totalCards += d.cards.length;
      masteredCards += d.cards.filter(c => c.mastered).length;
    });

    const percent = totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0;
    const avgQuizScore =
      quizHistory.length > 0
        ? Math.round(
            quizHistory.reduce((acc, curr) => acc + curr.scorePercentage, 0) /
              quizHistory.length
          )
        : 0;

    return {
      totalDecks: decks.length,
      totalCards,
      masteredCards,
      percent,
      quizzesTaken: quizHistory.length,
      avgQuizScore,
    };
  }, [decks, quizHistory]);

  if (!isOpen) return null;

  return (
    <div className="sheet-overlay fixed inset-0 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Statistik pembelajaran" tabIndex={-1} className="sheet-panel rounded-3xl max-w-md w-full border space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            Statistik Pembelajaran
          </h3>
          <button
            onClick={onClose}
            aria-label="Tutup statistik"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big metrics grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Total Kartu
            </span>
            <p className="text-xl font-black text-indigo-950 dark:text-indigo-100 mt-1">
              {stats.totalCards}
            </p>
            <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300">
              di {stats.totalDecks} dek aktif
            </p>
          </div>

          <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Pemahaman
            </span>
            <p className="text-xl font-black text-emerald-950 dark:text-emerald-100 mt-1">
              {stats.percent}%
            </p>
            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300">
              {stats.masteredCards} kartu dikuasai
            </p>
          </div>

          <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <Trophy className="w-3 h-3" /> Kuis Selesai
            </span>
            <p className="text-xl font-black text-amber-950 dark:text-amber-100 mt-1">
              {stats.quizzesTaken}
            </p>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-300">
              rata-rata {stats.avgQuizScore}%
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1">
              <Layers className="w-3 h-3" /> Materi
            </span>
            <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {stats.totalDecks}
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              dek dalam koleksi
            </p>
          </div>
        </div>

        {/* Recent Quiz Logs */}
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Riwayat Kuis Terakhir
          </h4>
          {quizHistory.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2">
              Belum ada riwayat kuis. Mulai kuis pertamamu untuk melihat hasil di sini!
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {quizHistory.slice(0, 5).map((q, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-between text-xs border border-slate-100 dark:border-slate-800"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {q.deckTitle}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(q.completedAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs flex-shrink-0 ${
                      q.scorePercentage >= 80
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : q.scorePercentage >= 60
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {q.scorePercentage}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reset Progress Action */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-700/80">
          <button
            onClick={() => {
              if (
                window.confirm(
                  'Apakah kamu yakin ingin mereset seluruh status pemahaman kartu? (Data dek tidak akan terhapus)'
                )
              ) {
                onResetProgress();
              }
            }}
            className="w-full py-2.5 text-xs text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Status Pemahaman Seluruh Kartu
          </button>
        </div>
      </div>
    </div>
  );
};
