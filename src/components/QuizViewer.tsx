import React, { useState, useCallback } from 'react';
import { 
  ArrowLeft, CheckCircle2, XCircle, RotateCcw, 
  Flame, BookOpen, AlertCircle, ArrowRight 
} from 'lucide-react';
import type { Deck, QuizQuestion, QuizResult } from '../types';
import { soundManager } from '../utils/sound';
import { saveQuizResult } from '../utils/storage';
import confetti from 'canvas-confetti';

interface QuizViewerProps {
  deck: Deck;
  onBack: () => void;
  onGoToFlashcards: () => void;
}

export const QuizViewer: React.FC<QuizViewerProps> = ({
  deck,
  onBack,
  onGoToFlashcards,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [isQuizComplete, setIsQuizComplete] = useState(false);

  // Generate randomized quiz questions
  const generateQuestions = useCallback((sourceCards = deck.cards): QuizQuestion[] => {
    if (sourceCards.length === 0) return [];

    // Shuffle questions
    const shuffledCards = [...sourceCards].sort(() => Math.random() - 0.5);

    return shuffledCards.map(card => {
      // Pick 3 distractors from all deck cards
      const otherCards = deck.cards.filter(c => c.id !== card.id);
      const shuffledOthers = [...otherCards].sort(() => Math.random() - 0.5);
      const distractors = shuffledOthers.slice(0, 3).map(c => c.back);

      // Combine with correct answer & shuffle
      const options = [card.back, ...distractors].sort(() => Math.random() - 0.5);

      return {
        cardId: card.id,
        question: card.front,
        correctAnswer: card.back,
        options,
      };
    });
  }, [deck.cards]);

  const [questions, setQuestions] = useState<QuizQuestion[]>(() => generateQuestions());

  const currentQ = questions[currentIdx];

  const handleSelectOption = (option: string) => {
    if (isAnswerSubmitted) return; // prevent multiple clicks

    setSelectedAnswer(option);
    setIsAnswerSubmitted(true);

    const isCorrect = option === currentQ.correctAnswer;

    if (isCorrect) {
      soundManager.playCorrect();
      setScore(prev => prev + 1);
      setStreak(prev => {
        const next = prev + 1;
        if (next > maxStreak) setMaxStreak(next);
        return next;
      });
    } else {
      soundManager.playWrong();
      setStreak(0);
    }

    // Update questions array with user's answer
    setQuestions(prev =>
      prev.map((q, idx) =>
        idx === currentIdx ? { ...q, userAnswer: option, isCorrect } : q
      )
    );
  };

  const handleNextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswerSubmitted(false);
    } else {
      // Complete quiz
      const finalScore = score;
      const percentage = Math.round((finalScore / questions.length) * 100);
      
      const wrongList = questions
        .map((q, idx) => idx === currentIdx ? { ...q, userAnswer: selectedAnswer || '', isCorrect: selectedAnswer === q.correctAnswer } : q)
        .filter(q => !q.isCorrect);

      const result: QuizResult = {
        deckId: deck.id,
        deckTitle: deck.title,
        totalQuestions: questions.length,
        correctCount: finalScore,
        wrongCount: wrongList.length,
        scorePercentage: percentage,
        wrongQuestions: wrongList,
        completedAt: Date.now(),
      };

      saveQuizResult(result);
      setIsQuizComplete(true);

      if (percentage >= 75) {
        confetti({
          disableForReducedMotion: true,
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        soundManager.playSuccess();
      }
    }
  };

  const handleRetryAll = () => {
    const q = generateQuestions();
    setQuestions(q);
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setIsQuizComplete(false);
  };

  const handleRetryMissed = () => {
    const missedCards = deck.cards.filter(card =>
      questions.some(q => q.cardId === card.id && !q.isCorrect)
    );
    if (missedCards.length === 0) return;

    const q = generateQuestions(missedCards);
    setQuestions(q);
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setIsQuizComplete(false);
  };

  if (deck.cards.length < 2) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
          Dek Memerlukan Minimal 2 Kartu
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Tambahkan beberapa kartu lagi ke dek ini agar kuis pilihan ganda dapat menghasilkan pilihan jawaban.
        </p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
        >
          Kembali ke Menu Dek
        </button>
      </div>
    );
  }

  // QUIZ COMPLETED SCREEN
  if (isQuizComplete) {
    const finalScorePercentage = Math.round((score / questions.length) * 100);
    const wrongQuestions = questions.filter(q => !q.isCorrect);

    let feedbackTitle = 'Luar Biasa!';
    let feedbackDesc = 'Penguasaan materi kamu sudah sangat baik!';
    let badgeColor = 'from-amber-400 to-orange-500';

    if (finalScorePercentage === 100) {
      feedbackTitle = 'Semua jawaban benar.';
      feedbackDesc = 'Semua pertanyaan dijawab dengan benar tanpa cela!';
      badgeColor = 'from-emerald-400 to-teal-500';
    } else if (finalScorePercentage >= 80) {
      feedbackTitle = 'Materinya sudah kamu kuasai.';
      feedbackDesc = 'Sebagian besar materi sudah kamu pahami dengan baik.';
      badgeColor = 'from-indigo-500 to-purple-600';
    } else if (finalScorePercentage >= 60) {
      feedbackTitle = 'Pemahamanmu mulai terbentuk.';
      feedbackDesc = 'Hasil yang cukup baik, terus asah pemahamanmu!';
      badgeColor = 'from-blue-500 to-cyan-500';
    } else {
      feedbackTitle = 'Masih ada yang bisa dipelajari.';
      feedbackDesc = 'Jangan berkecil hati, review kembali materi dan coba lagi!';
      badgeColor = 'from-rose-500 to-pink-600';
    }

    return (
      <div className="max-w-md mx-auto px-4 pt-4 pb-24 space-y-5">
        {/* Result Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 text-center border border-slate-200 dark:border-slate-700 shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            {/* Score circle */}
            <div className={`w-24 h-24 mx-auto rounded-full bg-gradient-to-tr ${badgeColor} text-white flex flex-col items-center justify-center shadow-lg shadow-indigo-500/20 mb-3`}>
              <span className="text-2xl font-black">{finalScorePercentage}%</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider opacity-90">Skor</span>
            </div>

            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {feedbackTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
              {feedbackDesc}
            </p>

            {/* Quick stats grid */}
            <div className="grid grid-cols-4 gap-2 mt-5 py-3 border-y border-slate-100 dark:border-slate-700/80 text-xs">
              <div>
                <p className="text-slate-400">Total Soal</p>
                <p className="text-base font-bold text-slate-800 dark:text-slate-100">{questions.length}</p>
              </div>
              <div>
                <p className="text-emerald-500 font-medium">Benar</p>
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">{score}</p>
              </div>
              <div>
                <p className="text-rose-500 font-medium">Salah</p>
                <p className="text-base font-bold text-rose-600 dark:text-rose-400">{wrongQuestions.length}</p>
              </div>
              <div>
                <p className="text-amber-500 font-medium">Streak</p>
                <p className="text-base font-bold text-amber-600 dark:text-amber-400">{maxStreak}</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-5 space-y-2">
              {wrongQuestions.length > 0 && (
                <button
                  onClick={handleRetryMissed}
                  className="w-full py-3 bg-gradient-to-r from-rose-500 to-amber-500 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-500/20 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <RotateCcw className="w-4 h-4" />
                  Ulangi {wrongQuestions.length} Soal yang Salah Saja
                </button>
              )}

              <button
                onClick={handleRetryAll}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <RotateCcw className="w-4 h-4" />
                Ulangi Seluruh Kuis
              </button>

              <button
                onClick={onGoToFlashcards}
                className="w-full py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                Pelajari Ulang via Flashcard
              </button>

              <button
                onClick={onBack}
                className="w-full py-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                Kembali ke Beranda Dek
              </button>
            </div>
          </div>
        </div>

        {/* Missed questions breakdown */}
        {wrongQuestions.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
              Evaluasi Soal yang Keliru ({wrongQuestions.length})
            </h3>
            {wrongQuestions.map((q, idx) => (
              <div
                key={idx}
                className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-rose-200 dark:border-rose-900/50 space-y-2 text-xs"
              >
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {idx + 1}. {q.question}
                </p>
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 flex items-start gap-2">
                  <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
                  <div>
                    <span className="font-bold">Jawabanmu:</span> {q.userAnswer || '(Tidak dijawab)'}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" />
                  <div>
                    <span className="font-bold">Jawaban yang Benar:</span> {q.correctAnswer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ACTIVE QUESTION SCREEN
  const progressPercent = Math.round(((currentIdx + 1) / questions.length) * 100);

  return (
    <div className="max-w-md mx-auto px-4 pt-3 pb-24 flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Keluar</span>
        </button>

        {/* Streak indicator */}
        {streak > 1 && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200 font-semibold text-xs">
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>{streak} Streak!</span>
          </div>
        )}

        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Skor: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{score}</span>
        </div>
      </div>

      {/* Progress Bar & Question Tracker */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
          <span>
            Soal <span className="text-indigo-600 dark:text-indigo-400 font-bold">{currentIdx + 1}</span> dari {questions.length}
          </span>
          <span>{progressPercent}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="flex-1 flex flex-col justify-between">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-md">
          <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-full">
            PERTANYAAN
          </span>

          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mt-4 leading-relaxed whitespace-pre-wrap">
            {currentQ?.question}
          </h3>
        </div>

        {/* Options List */}
        <div className="mt-4 space-y-2.5">
          {currentQ?.options.map((option, idx) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = option === currentQ.correctAnswer;

            let optionStyle = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-indigo-400';

            if (isAnswerSubmitted) {
              if (isCorrect) {
                // Correct answer always shines green
                optionStyle = 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold ring-1 ring-emerald-500';
              } else if (isSelected && !isCorrect) {
                // Selected wrong answer turns red
                optionStyle = 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-900 dark:text-rose-200 font-semibold ring-1 ring-rose-500';
              } else {
                optionStyle = 'opacity-40 bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-500';
              }
            }

            return (
              <button
                key={idx}
                disabled={isAnswerSubmitted}
                onClick={() => handleSelectOption(option)}
                className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm font-medium transition-all shadow-sm flex items-center justify-between gap-3 active:scale-[0.98] ${optionStyle}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="leading-snug">{option}</span>
                </div>

                {isAnswerSubmitted && (
                  <div>
                    {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
                    {isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Continue / Next Button */}
        <div className="mt-5">
          {isAnswerSubmitted ? (
            <button
              onClick={handleNextQuestion}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <span>{currentIdx === questions.length - 1 ? 'Lihat Hasil Kuis' : 'Soal Berikutnya'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-2">
              Pilih salah satu jawaban di atas
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
