import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  ArrowLeft, RotateCw, ChevronLeft, ChevronRight, Shuffle, 
  Volume2, HelpCircle, Check, X, ListChecks, RefreshCw,
  CheckCircle2, XCircle
} from 'lucide-react';
import type { Deck } from '../types';
import { soundManager } from '../utils/sound';
import confetti from 'canvas-confetti';
import { useMotionStep } from './useMotionStep';

interface FlashcardViewerProps {
  deck: Deck;
  onBack: () => void;
  onUpdateDeck: (updatedDeck: Deck) => void;
  onStartQuiz: () => void;
}

type FilterMode = 'all' | 'flashcard' | 'quiz' | 'unmastered';

export const FlashcardViewer: React.FC<FlashcardViewerProps> = ({
  deck,
  onBack,
  onUpdateDeck,
  onStartQuiz,
}) => {
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [invertSide, setInvertSide] = useState(false); // study Back first
  const [isFinished, setIsFinished] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, { selected: string; isCorrect: boolean }>>({});
  const { ref: cardRef, run: changeCard, busy: isMoving } = useMotionStep();

  // Touch swipe handling for mobile
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);

  // Compute available cards based on filter
  const cards = useMemo(() => {
    let list = [...deck.cards];
    if (filterMode === 'flashcard') {
      list = list.filter(c => !(c.type === 'quiz' || (Array.isArray(c.options) && c.options.length >= 2)));
    } else if (filterMode === 'quiz') {
      list = list.filter(c => c.type === 'quiz' || (Array.isArray(c.options) && c.options.length >= 2));
    } else if (filterMode === 'unmastered') {
      list = list.filter(c => !c.mastered);
    }
    return list;
  }, [deck.cards, filterMode]);

  const hasQuizItems = useMemo(() => {
    return deck.cards.some(c => c.type === 'quiz' || (Array.isArray(c.options) && c.options.length >= 2));
  }, [deck.cards]);

  const hasFlashcardItems = useMemo(() => {
    return deck.cards.some(c => !(c.type === 'quiz' || (Array.isArray(c.options) && c.options.length >= 2)));
  }, [deck.cards]);

  const isHybridDeck = hasQuizItems && hasFlashcardItems;

  const currentCard = cards[currentIndex];

  const isCurrentQuiz = Boolean(
    currentCard && (currentCard.type === 'quiz' || (Array.isArray(currentCard.options) && currentCard.options.length >= 2))
  );

  const currentQuizAnswer = currentCard ? quizAnswers[currentCard.id] : undefined;

  // Generate quiz options for the current card (either pre-set options or auto-generated)
  const currentQuizOptions = useMemo(() => {
    if (!currentCard || !isCurrentQuiz) return [];
    if (Array.isArray(currentCard.options) && currentCard.options.length >= 2) {
      return currentCard.options;
    }
    // Auto-generate distractors from other cards in the deck
    const otherBacks = deck.cards.filter(c => c.id !== currentCard.id).map(c => c.back);
    const shuffledOthers = [...otherBacks].sort(() => Math.random() - 0.5).slice(0, 3);
    return Array.from(new Set([currentCard.back, ...shuffledOthers])).sort(() => Math.random() - 0.5);
  }, [currentCard, isCurrentQuiz, deck.cards]);

  const handleFlip = useCallback(() => {
    if (isMoving || isFinished || isCurrentQuiz) return;
    soundManager.playFlip();
    setIsFlipped(prev => !prev);
  }, [isMoving, isFinished, isCurrentQuiz]);

  const advance = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setShowHint(false);
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
      confetti({
        disableForReducedMotion: true,
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
      soundManager.playSuccess();
    }
  }, [currentIndex, cards.length]);

  const handleNext = useCallback(() => {
    if (!isFinished) void changeCard(advance);
  }, [changeCard, advance, isFinished]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      void changeCard(() => {
        setIsFlipped(false);
        setShowHint(false);
        setCurrentIndex(prev => prev - 1);
        setIsFinished(false);
      }, -1);
    }
  }, [currentIndex, changeCard]);

  const handleShuffle = () => {
    void changeCard(() => {
      // Re-order deck cards
      const shuffled = [...deck.cards].sort(() => Math.random() - 0.5);
      onUpdateDeck({ ...deck, cards: shuffled });
      setCurrentIndex(0);
      setIsFlipped(false);
      setShowHint(false);
    });
  };

  const handleMarkMastery = useCallback((mastered: boolean) => {
    if (!currentCard || isFinished) return;
    void changeCard(() => {
      if (mastered) {
        soundManager.playCorrect();
      } else {
        soundManager.playWrong();
      }
      const updatedDeckCards = deck.cards.map(c =>
        c.id === currentCard.id ? { ...c, mastered, lastReviewed: Date.now() } : c
      );
      onUpdateDeck({ ...deck, cards: updatedDeckCards, updatedAt: Date.now() });
      advance();
    });
  }, [currentCard, deck, onUpdateDeck, advance, changeCard, isFinished]);

  const handleSelectQuizOption = (option: string) => {
    if (!currentCard || currentQuizAnswer) return;

    const isCorrect = option === currentCard.back;
    if (isCorrect) {
      soundManager.playCorrect();
    } else {
      soundManager.playWrong();
    }

    setQuizAnswers(prev => ({
      ...prev,
      [currentCard.id]: { selected: option, isCorrect }
    }));

    // Save mastery to deck
    const updatedDeckCards = deck.cards.map(c =>
      c.id === currentCard.id ? { ...c, mastered: isCorrect, lastReviewed: Date.now() } : c
    );
    onUpdateDeck({ ...deck, cards: updatedDeckCards, updatedAt: Date.now() });
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || isMoving) return;
      if (document.querySelector('[role="dialog"]') || (e.target instanceof HTMLElement && e.target.closest('button, input, textarea, select'))) return;

      if (isCurrentQuiz) {
        // Numbers 1-4 for quiz options
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= currentQuizOptions.length) {
          handleSelectQuizOption(currentQuizOptions[num - 1]);
        } else if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
          if (currentQuizAnswer) {
            handleNext();
          }
        } else if (e.key === 'ArrowLeft') {
          handlePrev();
        }
      } else {
        // Flashcard controls
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          handleFlip();
        } else if (e.key === 'ArrowRight') {
          handleNext();
        } else if (e.key === 'ArrowLeft') {
          handlePrev();
        } else if (e.key === '1') {
          handleMarkMastery(false);
        } else if (e.key === '2') {
          handleMarkMastery(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, handleNext, handlePrev, handleMarkMastery, isMoving, isCurrentQuiz, currentQuizOptions, currentQuizAnswer]);

  // Touch handlers for mobile swipe
  const onTouchStart = (e: React.TouchEvent) => {
    suppressClick.current = false;
    touchStart.current = null;
    if (isMoving || (e.target as HTMLElement).closest('button') || e.touches.length !== 1) return;
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const diff = e.changedTouches[0].clientX - touchStart.current.x;
    const vertical = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.abs(diff) > 50 && Math.abs(diff) > Math.abs(vertical) * 1.4) {
      suppressClick.current = true;
      if (diff < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStart.current = null;
  };

  if (!currentCard) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <p className="text-slate-600 dark:text-slate-300">
          {filterMode === 'unmastered'
            ? 'Semua materi sudah kamu pahami!'
            : 'Tidak ada kartu yang sesuai dengan filter ini.'}
        </p>
        <button
          onClick={() => {
            setFilterMode('all');
            setCurrentIndex(0);
          }}
          className="button primary mt-4"
        >
          Tampilkan Semua Materi
        </button>
        <button
          onClick={onBack}
          className="mt-3 block mx-auto px-4 py-2 text-slate-500 text-xs font-semibold"
        >
          Kembali ke Koleksi
        </button>
      </div>
    );
  }

  const frontText = invertSide && !isCurrentQuiz ? currentCard.back : currentCard.front;
  const backText = invertSide && !isCurrentQuiz ? currentCard.front : currentCard.back;
  const progressPercent = Math.round(((currentIndex + 1) / cards.length) * 100);

  // Completion calculation
  const totalQuizInCards = cards.filter(c => c.type === 'quiz' || (Array.isArray(c.options) && c.options.length >= 2)).length;
  const totalFlashcardInCards = cards.length - totalQuizInCards;
  const quizCorrectCount = Object.values(quizAnswers).filter(a => a.isCorrect).length;
  const flashcardsMastered = cards.filter(c => !(c.type === 'quiz' || (Array.isArray(c.options) && c.options.length >= 2)) && c.mastered).length;

  return (
    <div className="max-w-md mx-auto px-4 pt-3 pb-24 flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <button
          onClick={onBack}
          aria-label="Kembali ke materi"
          className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden xs:inline">Kembali</span>
        </button>

        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={handleShuffle}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title="Acak Urutan"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          {!isCurrentQuiz && (
            <button
              onClick={() => { void changeCard(() => { setInvertSide(!invertSide); setIsFlipped(false); }); }}
              className={`p-2 rounded-xl transition-colors ${
                invertSide
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Tukar Sisi Flashcard"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          )}

          {/* Filter Pills */}
          <select
            value={filterMode}
            onChange={e => {
              const val = e.target.value as FilterMode;
              void changeCard(() => {
                setFilterMode(val);
                setCurrentIndex(0);
                setIsFlipped(false);
                setIsFinished(false);
              });
            }}
            className="px-2 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            aria-label="Filter alur belajar"
          >
            <option value="all">{isHybridDeck ? '⚡ Alur Gabungan' : 'Semua Kartu'}</option>
            {isHybridDeck && <option value="flashcard">🃏 Hanya Flashcard</option>}
            {isHybridDeck && <option value="quiz">🎯 Hanya Kuis</option>}
            <option value="unmastered">⚠️ Perlu Review</option>
          </select>
        </div>
      </div>

      {/* Progress Bar & Counter */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
          <span className="flex items-center gap-1.5">
            {isCurrentQuiz ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <ListChecks className="w-3.5 h-3.5" /> Soal Kuis {currentIndex + 1}
              </span>
            ) : (
              <span>
                Kartu <span className="text-indigo-600 dark:text-indigo-400 font-bold">{currentIndex + 1}</span>
              </span>
            )}
            <span>dari {cards.length}</span>
          </span>

          <span className="flex items-center gap-1">
            {currentCard.mastered ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <Check className="w-3.5 h-3.5" /> Sudah Paham
              </span>
            ) : (
              <span className="text-slate-400">Belum Paham</span>
            )}
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isCurrentQuiz
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                : 'bg-gradient-to-r from-indigo-500 to-violet-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Finished Screen or Study Card Display */}
      {isFinished ? (
        <div className="completion-screen flex-1 flex flex-col items-center justify-center text-center p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl my-auto animate-fadeIn">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 text-white flex items-center justify-center text-3xl mb-4 shadow-lg shadow-emerald-500/20">
            <Check size={28} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {isHybridDeck ? 'Selesai Alur Belajar Gabungan!' : 'Selesai Mempelajari Dek!'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-xs leading-relaxed">
            Hebat! Kamu telah menyelesaikan semua {cards.length} materi dalam &quot;{deck.title}&quot;.
          </p>

          {/* Breakdown for hybrid decks */}
          {isHybridDeck && (
            <div className="grid grid-cols-2 gap-2.5 w-full max-w-xs mt-4 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <p className="text-slate-400 text-[11px]">Flashcard Dikuasai</p>
                <p className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                  {flashcardsMastered} / {totalFlashcardInCards}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-[11px]">Kuis Terjawab Benar</p>
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {quizCorrectCount} / {totalQuizInCards}
                </p>
              </div>
            </div>
          )}

          <div className="w-full max-w-xs space-y-2.5 mt-5">
            {hasQuizItems && (
              <button
                onClick={onStartQuiz}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <ListChecks className="w-4 h-4" />
                Mulai Uji Kuis Khusus
              </button>
            )}
            <button
              onClick={() => {
                setCurrentIndex(0);
                setIsFinished(false);
                setIsFlipped(false);
                setQuizAnswers({});
              }}
              className="w-full py-3 bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <RefreshCw className="w-4 h-4" />
              Ulangi dari Awal
            </button>
            <button
              onClick={onBack}
              className="w-full py-2.5 text-slate-500 dark:text-slate-400 text-xs hover:text-slate-700 dark:hover:text-slate-200"
            >
              Kembali ke Koleksi Materi
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between">
          {/* RENDER CURRENT ITEM: QUIZ CHECKPOINT OR 3D FLASHCARD */}
          {isCurrentQuiz ? (
            /* ================= INTERACTIVE IN-STREAM QUIZ CARD ================= */
            <div
              ref={cardRef}
              className="w-full flex-1 flex flex-col justify-between bg-white dark:bg-slate-800 rounded-3xl border-2 border-emerald-500/30 dark:border-emerald-500/40 shadow-lg p-5 sm:p-6"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/80 flex items-center gap-1.5">
                    <ListChecks className="w-3.5 h-3.5 text-emerald-500" />
                    Kuis Uji Pemahaman
                  </span>

                  <button
                    onClick={() => soundManager.speak(currentCard.front)}
                    className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-colors"
                    title="Dengarkan Soal"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Question */}
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-relaxed mb-4">
                  {currentCard.front}
                </h3>

                {/* Multiple Choice Options */}
                <div className="space-y-2.5">
                  {currentQuizOptions.map((option, idx) => {
                    const isSelected = currentQuizAnswer?.selected === option;
                    const isCorrect = option === currentCard.back;
                    const isSubmitted = Boolean(currentQuizAnswer);

                    let optionStyle = 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 text-slate-800 dark:text-slate-100';

                    if (isSubmitted) {
                      if (isCorrect) {
                        optionStyle = 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold ring-1 ring-emerald-500';
                      } else if (isSelected && !isCorrect) {
                        optionStyle = 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-900 dark:text-rose-200 font-semibold ring-1 ring-rose-500';
                      } else {
                        optionStyle = 'opacity-40 bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-500';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        disabled={isSubmitted}
                        onClick={() => handleSelectQuizOption(option)}
                        className={`w-full p-3.5 rounded-2xl border text-left text-xs sm:text-sm font-medium transition-all shadow-sm flex items-center justify-between gap-3 active:scale-[0.98] ${optionStyle}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center shrink-0">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="leading-snug break-words">{option}</span>
                        </div>

                        {isSubmitted && (
                          <div className="shrink-0">
                            {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                            {isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-500" />}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Box */}
                {currentQuizAnswer && currentCard.explanation && (
                  <div className="mt-3.5 p-3.5 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl text-xs text-indigo-950 dark:text-indigo-200 animate-fadeIn space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-700 dark:text-indigo-400">
                      <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>Pembahasan:</span>
                    </div>
                    <p className="leading-relaxed text-[11px] sm:text-xs text-slate-700 dark:text-slate-300">
                      {currentCard.explanation}
                    </p>
                  </div>
                )}
              </div>

              {/* Quiz Continue Button */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-700/80">
                {currentQuizAnswer ? (
                  <button
                    onClick={handleNext}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <span>Lanjut ke Materi Berikutnya</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-1 font-medium">
                    Pilih salah satu jawaban kuis di atas
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* ================= STANDARD 3D FLASHCARD ================= */
            <div
              ref={cardRef}
              aria-busy={isMoving}
              tabIndex={0}
              aria-label={isFlipped ? 'Kartu jawaban. Tekan Enter untuk membalik.' : 'Kartu pertanyaan. Tekan Enter untuk membalik.'}
              className="study-card-stage perspective-1000 w-full flex-1 flex flex-col min-h-[320px] max-h-[460px] cursor-pointer"
              onClick={() => { if (suppressClick.current) { suppressClick.current = false; return; } handleFlip(); }}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
              onTouchCancel={() => { touchStart.current = null; suppressClick.current = false; }}
            >
              <div
                key={currentCard.id}
                className={`relative w-full h-full duration-500 transform-style-3d transition-transform flex-1 ${
                  isFlipped ? 'rotate-y-180' : ''
                }`}
              >
                {/* FRONT FACE */}
                <div inert={isFlipped || isMoving} aria-hidden={isFlipped} className="absolute inset-0 w-full h-full backface-hidden bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 dark:border-slate-700/80 shadow-lg p-6 flex flex-col justify-between select-none">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold tracking-wider uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full">
                      {invertSide ? 'JAWABAN' : 'PERTANYAAN'}
                    </span>
                    
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      {currentCard.hint && (
                        <button
                          onClick={() => setShowHint(!showHint)}
                          className={`p-2 rounded-xl transition-colors ${
                            showHint
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                          }`}
                          title="Lihat Petunjuk"
                        >
                          <HelpCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => soundManager.speak(frontText)}
                        className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-colors"
                        title="Dengarkan Pengucapan"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Question Content */}
                  <div className="my-auto py-4 text-center">
                    <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50 leading-relaxed break-words whitespace-pre-wrap">
                      {frontText}
                    </p>

                    {/* Hint Reveal */}
                    {showHint && currentCard.hint && (
                      <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-200 animate-fadeIn">
                        <strong>Petunjuk:</strong> {currentCard.hint}
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium flex items-center justify-center gap-1">
                      <RotateCw className="w-3 h-3" /> Ketuk untuk melihat jawaban
                    </p>
                  </div>
                </div>

                {/* BACK FACE */}
                <div inert={!isFlipped || isMoving} aria-hidden={!isFlipped} className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-gradient-to-b from-indigo-50/50 via-white to-indigo-50/20 dark:from-slate-800 dark:via-slate-800 dark:to-slate-850 rounded-3xl border-2 border-indigo-200 dark:border-indigo-900/60 shadow-lg p-6 flex flex-col justify-between select-none">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full">
                      {invertSide ? 'PERTANYAAN' : 'JAWABAN'}
                    </span>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        soundManager.speak(backText);
                      }}
                      className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-colors"
                      title="Dengarkan Pengucapan"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Answer Content */}
                  <div className="my-auto py-4 text-center">
                    <p className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-100 leading-relaxed break-words whitespace-pre-wrap">
                      {backText}
                    </p>

                    {currentCard.explanation && (
                      <div className="mt-3.5 p-3 bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900/60 rounded-xl text-left text-xs text-indigo-900 dark:text-indigo-200">
                        <span className="font-bold text-indigo-700 dark:text-indigo-400">💡 Pembahasan: </span>
                        <span className="text-slate-700 dark:text-slate-300">{currentCard.explanation}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium flex items-center justify-center gap-1">
                      <RotateCw className="w-3 h-3" /> Ketuk untuk membalik kembali
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Action Controls */}
          <div className="mt-5 space-y-3">
            {/* Show Belum Paham / Sudah Paham only for Flashcard items */}
            {!isCurrentQuiz && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleMarkMastery(false)}
                  className="py-3 px-4 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 font-semibold text-xs rounded-2xl border border-rose-200 dark:border-rose-900/50 flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
                >
                  <X className="w-4 h-4 text-rose-500" />
                  <span>Belum Paham</span>
                </button>

                <button
                  onClick={() => handleMarkMastery(true)}
                  className="py-3 px-4 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold text-xs rounded-2xl border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
                >
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>Sudah Paham</span>
                </button>
              </div>
            )}

            {/* Navigation Arrows */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="flex-1 py-2.5 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs rounded-xl flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Sebelumnya</span>
              </button>

              <button
                onClick={handleNext}
                className="flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-1 transition-colors shadow-sm shadow-indigo-600/30"
              >
                <span>{currentIndex === cards.length - 1 ? 'Selesai' : 'Berikutnya'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
