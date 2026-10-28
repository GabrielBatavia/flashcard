import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, RefreshCw, CheckCircle2, RotateCcw, Shuffle } from 'lucide-react';
import type { Deck, Flashcard, QuizQuestion } from '../types';
import { HandwritingCard } from './HandwritingCard';
import { saveQuizResult } from '../utils/storage';
import { soundManager } from '../utils/sound';
import confetti from 'canvas-confetti';
import { useMotionStep } from './useMotionStep';

export function HandwritingViewer({ deck, onBack, onUpdateDeck }: {
  deck: Deck;
  onBack: () => void;
  onUpdateDeck: (deck: Deck) => void;
}) {
  const [cards, setCards] = useState(() => deck.cards.filter(card => card.type === 'handwriting'));
  const [results, setResults] = useState<QuizQuestion[]>([]);
  const [attempt, setAttempt] = useState(0);
  const rating = useRef(false);
  const { ref: stageRef, run: changeStep, busy: isMoving } = useMotionStep(12);
  const card = cards[results.length];
  const correctCount = results.filter(result => result.isCorrect).length;
  const missed = cards.filter(item => results.some(result => result.cardId === item.id && !result.isCorrect));

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [card?.id, attempt]);

  const restart = (next: Flashcard[]) => {
    setCards(next);
    setResults([]);
    setAttempt(previous => previous + 1);
    rating.current = false;
  };

  const shuffleRemaining = () => {
    const completed = cards.slice(0, results.length);
    const upcoming = cards.slice(results.length).sort(() => Math.random() - 0.5);
    setCards([...completed, ...upcoming]);
    setAttempt(previous => previous + 1);
  };

  const rate = (correct: boolean) => {
    if (!card || rating.current) return;
    rating.current = true;
    const next = [...results, {
      cardId: card.id,
      question: card.front,
      correctAnswer: card.back,
      options: [],
      explanation: card.explanation,
      userAnswer: correct ? 'Dinilai sendiri: benar' : 'Dinilai sendiri: salah',
      isCorrect: correct,
    }];

    const updatedDeck = {
      ...deck,
      updatedAt: Date.now(),
      cards: deck.cards.map(item => item.id === card.id
        ? { ...item, mastered: correct, lastReviewed: Date.now() }
        : item)
    };

    if (next.length === cards.length) {
      const count = next.filter(result => result.isCorrect).length;
      const percentage = Math.round((count / cards.length) * 100);
      updatedDeck.quizHighScore = Math.max(deck.quizHighScore || 0, percentage);
      saveQuizResult({
        deckId: deck.id,
        deckTitle: `${deck.title} (Menulis)`,
        totalQuestions: cards.length,
        correctCount: count,
        wrongCount: cards.length - count,
        scorePercentage: percentage,
        wrongQuestions: next.filter(result => !result.isCorrect),
        completedAt: Date.now(),
      });
      confetti({
        disableForReducedMotion: true,
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
      soundManager.playSuccess();
    } else {
      if (correct) soundManager.playCorrect();
      else soundManager.playWrong();
    }

    onUpdateDeck(updatedDeck);
    setResults(next);
    rating.current = false;
  };

  const progressPercent = cards.length ? Math.round((results.length / cards.length) * 100) : 0;

  return (
    <div className="writing-viewer max-w-xl mx-auto px-4 pt-3 pb-24">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <button
          onClick={onBack}
          className="button text-xs font-semibold flex items-center gap-1.5"
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Koleksi</span>
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-bold text-slate-500 truncate">{deck.title}</span>
          {card && <button type="button" className="button text-xs font-semibold flex items-center gap-1.5 shrink-0"
            disabled={isMoving} onClick={() => { void changeStep(shuffleRemaining); }} title="Acak urutan soal yang belum dikerjakan">
            <Shuffle size={15} /><span>Acak soal</span>
          </button>}
        </div>
      </div>

      <div ref={stageRef} aria-busy={isMoving} inert={isMoving}>
      {cards.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-3">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Dek ini belum memiliki kartu latihan menulis.
          </p>
          <p className="text-xs text-slate-400">
            Impor kartu dengan tipe <code>"type": "handwriting"</code> melalui menu Impor JSON.
          </p>
          <button className="button primary mt-2" onClick={onBack}>
            Kembali ke Koleksi
          </button>
        </div>
      ) : card ? (
        <>
          {/* Progress Header */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1.5">
              <span>✍️ Karakter {results.length + 1} dari {cards.length}</span>
              <span className="text-emerald-600 dark:text-emerald-400">Benar: {correctCount}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <HandwritingCard
            key={`${attempt}-${card.id}`}
            card={card}
            language={deck.language}
            disabled={isMoving}
            onRate={correct => { void changeStep(() => rate(correct)); }}
          />
        </>
      ) : (
        /* Completion Screen */
        <section className="handwriting-card completion-screen p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 text-white flex items-center justify-center text-3xl mx-auto shadow-lg shadow-emerald-500/20">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-xl font-bold">Latihan Menulis Selesai! 🎉</h2>
          <p className="text-xs text-slate-500">
            Hasil evaluasi mandiri dari {results.length} karakter / suku kata:
          </p>
          <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border text-xs">
            <div>
              <p className="text-slate-400">Benar</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{correctCount}</p>
            </div>
            <div>
              <p className="text-slate-400">Perlu Latihan</p>
              <p className="text-xl font-bold text-rose-500">{results.length - correctCount}</p>
            </div>
          </div>

          <div className="space-y-2.5 max-w-xs mx-auto pt-2">
            {missed.length > 0 && (
              <button
                className="button primary w-full py-3 text-xs font-bold flex items-center justify-center gap-2"
                onClick={() => { void changeStep(() => restart(missed)); }}
              >
                <RotateCcw size={16} />
                <span>Ulangi {missed.length} Karakter yang Salah</span>
              </button>
            )}
            <button
              className="button w-full py-3 text-xs font-semibold flex items-center justify-center gap-2"
              onClick={() => { void changeStep(() => restart(deck.cards.filter(item => item.type === 'handwriting').sort(() => Math.random() - 0.5))); }}
            >
              <RefreshCw size={16} />
              <span>Latihan Semua dari Awal</span>
            </button>
            <button className="button w-full py-2.5 text-xs text-slate-500" onClick={onBack}>
              Kembali ke Koleksi Materi
            </button>
          </div>
        </section>
      )}
      </div>
    </div>
  );
}
