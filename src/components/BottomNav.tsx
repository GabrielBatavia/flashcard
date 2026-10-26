import React from 'react';
import { Layers, CreditCard, Sparkles, PlusCircle } from 'lucide-react';
import type { StudyMode } from '../types';

interface BottomNavProps {
  currentMode: StudyMode;
  onNavigate: (mode: StudyMode) => void;
  hasActiveDeck: boolean;
  onNewDeck: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentMode,
  onNavigate,
  hasActiveDeck,
  onNewDeck,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-4 h-16 px-2">
        {/* Dek tab */}
        <button
          onClick={() => onNavigate('deck-select')}
          className={`flex flex-col items-center justify-center gap-1 transition-colors ${
            currentMode === 'deck-select'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[11px] leading-tight">Materi</span>
        </button>

        {/* Flashcard tab */}
        <button
          onClick={() => onNavigate('flashcards')}
          disabled={!hasActiveDeck}
          className={`flex flex-col items-center justify-center gap-1 transition-colors ${
            !hasActiveDeck
              ? 'opacity-40 cursor-not-allowed text-slate-400'
              : currentMode === 'flashcards'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-5 h-5" />
          <span className="text-[11px] leading-tight">Flashcard</span>
        </button>

        {/* Quiz tab */}
        <button
          onClick={() => onNavigate('quiz')}
          disabled={!hasActiveDeck}
          className={`flex flex-col items-center justify-center gap-1 transition-colors ${
            !hasActiveDeck
              ? 'opacity-40 cursor-not-allowed text-slate-400'
              : currentMode === 'quiz'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[11px] leading-tight">Kuis</span>
        </button>

        {/* Tambah Dek */}
        <button
          onClick={onNewDeck}
          className="flex flex-col items-center justify-center gap-1 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <PlusCircle className="w-5 h-5" />
          <span className="text-[11px] leading-tight">Buat Dek</span>
        </button>
      </div>
    </nav>
  );
};
