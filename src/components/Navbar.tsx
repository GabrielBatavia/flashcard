import React from 'react';
import { Volume2, VolumeX, Sun, Moon, BarChart3, Layers, BookOpen } from 'lucide-react';
import type { Deck, StudyMode } from '../types';

interface NavbarProps {
  currentMode: StudyMode;
  activeDeck: Deck | null;
  onNavigate: (mode: StudyMode) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenStats: () => void;
  onOpenImportExport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMode,
  activeDeck,
  onNavigate,
  soundEnabled,
  onToggleSound,
  theme,
  onToggleTheme,
  onOpenStats,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-slate-900/85 border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Brand / Back button */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => onNavigate('deck-select')}
            className="flex items-center gap-2 text-left focus:outline-none group"
            title="Kembali ke Beranda Dek"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent truncate leading-tight">
                FlashQuiz
              </h1>
              {activeDeck && currentMode !== 'deck-select' ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {activeDeck.title}
                </p>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">Mobile Flashcard & Quiz</p>
              )}
            </div>
          </button>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Quick Deck Switcher badge if in study mode */}
          {activeDeck && currentMode !== 'deck-select' && (
            <button
              onClick={() => onNavigate('deck-select')}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Layers className="w-3.5 h-3.5" />
              Ganti Dek
            </button>
          )}

          {/* Stats Button */}
          <button
            onClick={onOpenStats}
            aria-label="Statistik Belajar"
            className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors active:scale-95"
            title="Statistik Belajar"
          >
            <BarChart3 className="w-5 h-5" />
          </button>

          {/* Audio toggle */}
          <button
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Matikan Suara' : 'Nyalakan Suara'}
            className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors active:scale-95"
            title={soundEnabled ? 'Suara Aktif' : 'Suara Mati'}
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <VolumeX className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {/* Theme toggle */}
          <button
            onClick={onToggleTheme}
            aria-label="Ganti Tema"
            className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors active:scale-95"
            title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
