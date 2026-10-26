import { Volume2, VolumeX, Sun, Moon, ChartNoAxesColumn, BookOpen, ChevronLeft } from 'lucide-react';
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

export function Navbar({ currentMode, activeDeck, onNavigate, soundEnabled, onToggleSound, theme, onToggleTheme, onOpenStats }: NavbarProps) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <button className="brand" onClick={() => onNavigate('deck-select')} aria-label="FlashQuiz, kembali ke materi">
          <span className="brand-icon">{currentMode === 'deck-select' ? <BookOpen size={22} /> : <ChevronLeft size={24} />}</span>
          <span><strong>FlashQuiz</strong><small>{currentMode === 'deck-select' ? 'Ruang belajarmu' : currentMode === 'edit-deck' ? 'Editor materi' : activeDeck?.title}</small></span>
        </button>
        <div className="toolbar glass">
          <button className="icon-button" onClick={onOpenStats} title="Statistik belajar" aria-label="Statistik belajar"><ChartNoAxesColumn size={20} /></button>
          <button className="icon-button" onClick={onToggleSound} title={soundEnabled ? 'Matikan suara' : 'Nyalakan suara'} aria-label={soundEnabled ? 'Matikan suara' : 'Nyalakan suara'} aria-pressed={soundEnabled}>{soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}</button>
          <button className="icon-button" onClick={onToggleTheme} title={theme === 'dark' ? 'Mode terang' : 'Mode gelap'} aria-label={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}>{theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</button>
        </div>
      </div>
    </header>
  );
}
