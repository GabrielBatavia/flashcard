import { Layers, RectangleVertical, ListChecks, Plus } from 'lucide-react';
import type { StudyMode } from '../types';

interface BottomNavProps {
  currentMode: StudyMode;
  onNavigate: (mode: StudyMode) => void;
  hasActiveDeck: boolean;
  onNewDeck: () => void;
}

export function BottomNav({ currentMode, onNavigate, hasActiveDeck, onNewDeck }: BottomNavProps) {
  const tabs = [
    { mode: 'deck-select' as const, label: 'Materi', icon: Layers },
    { mode: 'flashcards' as const, label: 'Flashcard', icon: RectangleVertical },
    { mode: 'quiz' as const, label: 'Kuis', icon: ListChecks },
  ];
  return (
    <nav className="dock glass" aria-label="Navigasi utama">
      {tabs.map(({ mode, label, icon: Icon }) => {
        const isActive = currentMode === mode || (mode === 'flashcards' && currentMode === 'hybrid');
        return (
          <button key={mode} onClick={() => onNavigate(mode)} disabled={mode !== 'deck-select' && !hasActiveDeck} aria-current={isActive ? 'page' : undefined} className={`dock-item ${isActive ? 'is-active' : ''}`}>
            <Icon size={22} /><span>{label}</span>
          </button>
        );
      })}
      <button className="dock-item dock-create" onClick={onNewDeck}><Plus size={22} /><span>Buat dek</span></button>
    </nav>
  );
}
