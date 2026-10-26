import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ArrowLeft, RotateCw, ChevronLeft, ChevronRight, Shuffle, 
  Volume2, HelpCircle, Check, X, ListChecks, RefreshCw
} from 'lucide-react';
import type { Deck, Flashcard } from '../types';
import { soundManager } from '../utils/sound';
import confetti from 'canvas-confetti';

interface FlashcardViewerProps {
  deck: Deck;
  onBack: () => void;
  onUpdateDeck: (updatedDeck: Deck) => void;
  onStartQuiz: () => void;
}

export const FlashcardViewer: React.FC<FlashcardViewerProps> = ({
  deck,
  onBack,
  onUpdateDeck,
  onStartQuiz,
}) => {
  const [cards, setCards] = useState<Flashcard[]>(deck.cards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [invertSide, setInvertSide] = useState(false); // study Back first
  const [filterUnmasteredOnly, setFilterUnmasteredOnly] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Touch swipe handling for mobile
  const touchStartX = useRef<number | null>(null);

  const toggleFilter = () => {
    const nextFilter = !filterUnmasteredOnly;
    let activeCards = [...deck.cards];
    if (nextFilter) {
      activeCards = activeCards.filter(c => !c.mastered);
    }
    setFilterUnmasteredOnly(nextFilter);
    setCards(activeCards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setIsFinished(false);
  };

  const currentCard = cards[currentIndex];

  const handleFlip = useCallback(() => {
    soundManager.playFlip();
    setIsFlipped(prev => !prev);
  }, []);

  const handleNext = useCallback(() => {
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

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setShowHint(false);
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
  };

  const handleMarkMastery = useCallback((mastered: boolean) => {
    if (!currentCard) return;
    if (mastered) {
      soundManager.playCorrect();
    } else {
      soundManager.playWrong();
    }

    const updatedDeckCards = deck.cards.map(c => 
      c.id === currentCard.id ? { ...c, mastered, lastReviewed: Date.now() } : c
    );
    const updatedDeck = { ...deck, cards: updatedDeckCards, updatedAt: Date.now() };
    onUpdateDeck(updatedDeck);

    // Update local card list too
    setCards(prev => prev.map(c => c.id === currentCard.id ? { ...c, mastered } : c));

    handleNext();
  }, [currentCard, deck, onUpdateDeck, handleNext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.querySelector('[role="dialog"]') || (e.target instanceof HTMLElement && e.target.closest('button, input, textarea, select'))) return;
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
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, handleNext, handlePrev, handleMarkMastery]);

  // Touch handlers for mobile swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 50) {
      if (diff < 0) {
        // Swiped left -> next
        handleNext();
      } else {
        // Swiped right -> prev
        handlePrev();
      }
    }
    touchStartX.current = null;
  };

  if (!currentCard) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <p className="text-slate-600 dark:text-slate-300">{filterUnmasteredOnly ? 'Semua kartu sudah kamu pahami.' : 'Tidak ada kartu dalam dek ini.'}</p>
        {filterUnmasteredOnly && <button onClick={toggleFilter} className="button primary mt-4">Pelajari semua kartu</button>}
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
        >
          Kembali ke Dek
        </button>
      </div>
    );
  }

  const frontText = invertSide ? currentCard.back : currentCard.front;
  const backText = invertSide ? currentCard.front : currentCard.back;
  const progressPercent = Math.round(((currentIndex + 1) / cards.length) * 100);

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
            title="Acak Kartu"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={() => setInvertSide(!invertSide)}
            className={`p-2 rounded-xl transition-colors ${
              invertSide
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Tukar Sisi (Tanya Jawaban / Tanya Soal)"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFilter}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              filterUnmasteredOnly
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {filterUnmasteredOnly ? 'Perlu Review' : 'Semua'}
          </button>
        </div>
      </div>

      {/* Progress Bar & Counter */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
          <span>
            Kartu <span className="text-indigo-600 dark:text-indigo-400 font-bold">{currentIndex + 1}</span> dari {cards.length}
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
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Finished Screen or Flashcard Display */}
      {isFinished ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl my-auto">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 text-white flex items-center justify-center text-3xl mb-4 shadow-lg shadow-emerald-500/20">
            <Check size={28} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Selesai Mempelajari Dek!
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-xs leading-relaxed">
            Hebat! Kamu telah meninjau semua {cards.length} kartu dalam dek &quot;{deck.title}&quot;.
          </p>

          <div className="w-full max-w-xs space-y-2.5 mt-6">
            <button
              onClick={onStartQuiz}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <ListChecks className="w-4 h-4" />
              Uji Kemampuan dengan Kuis
            </button>
            <button
              onClick={() => {
                setCurrentIndex(0);
                setIsFinished(false);
                setIsFlipped(false);
              }}
              className="w-full py-3 bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <RefreshCw className="w-4 h-4" />
              Ulangi Flashcard
            </button>
            <button
              onClick={onBack}
              className="w-full py-2.5 text-slate-500 dark:text-slate-400 text-xs hover:text-slate-700 dark:hover:text-slate-200"
            >
              Kembali ke Menu Dek
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between">
          {/* Flip Card with Touch Gestures */}
          <div
            tabIndex={0}
            aria-label={isFlipped ? 'Kartu jawaban. Tekan Enter untuk membalik.' : 'Kartu pertanyaan. Tekan Enter untuk membalik.'}
            className="perspective-1000 w-full flex-1 flex flex-col min-h-[320px] max-h-[460px] cursor-pointer"
            onClick={handleFlip}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div
              className={`relative w-full h-full duration-500 transform-style-3d transition-transform flex-1 ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* FRONT FACE */}
              <div className="absolute inset-0 w-full h-full backface-hidden bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 dark:border-slate-700/80 shadow-lg p-6 flex flex-col justify-between select-none">
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
              <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-gradient-to-b from-indigo-50/50 via-white to-indigo-50/20 dark:from-slate-800 dark:via-slate-800 dark:to-slate-850 rounded-3xl border-2 border-indigo-200 dark:border-indigo-900/60 shadow-lg p-6 flex flex-col justify-between select-none">
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

          {/* Bottom Thumb-Friendly Action Buttons */}
          <div className="mt-5 space-y-3">
            {/* Quick Self-Assessment Buttons */}
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

            {/* Previous / Next Arrow Controls */}
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
