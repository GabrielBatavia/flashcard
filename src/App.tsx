import { useState, useEffect, useMemo } from 'react';
import type { Deck, StudyMode, Flashcard } from './types';
import { loadDecks, saveDecks, getThemePreference, saveThemePreference } from './utils/storage';
import { soundManager } from './utils/sound';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { DeckList } from './components/DeckList';
import { FlashcardViewer } from './components/FlashcardViewer';
import { QuizViewer } from './components/QuizViewer';
import { HandwritingViewer } from './components/HandwritingViewer';
import { DeckEditor } from './components/DeckEditor';
import { ImportExportModal } from './components/ImportExportModal';
import { StatsModal } from './components/StatsModal';
import { JsonImportModal } from './components/JsonImportModal';
import { useMotionStep } from './components/useMotionStep';

export function App() {
  const [decks, setDecks] = useState<Deck[]>(() => loadDecks());
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState<StudyMode>('deck-select');
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => soundManager.isEnabled());
  const [theme, setTheme] = useState<'light' | 'dark'>(() => getThemePreference());

  // Modals
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const { ref: pageRef, run: transitionPage, busy: isNavigating } = useMotionStep<HTMLElement>(0);

  const navigate = (mode: StudyMode) => {
    if (mode === currentMode) return;
    void transitionPage(() => setCurrentMode(mode));
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentMode]);

  // Initialize theme class
  useEffect(() => {
    saveThemePreference(theme);
  }, [theme]);

  // Save decks whenever changed
  useEffect(() => {
    saveDecks(decks);
  }, [decks]);

  const activeDeck = useMemo(() => {
    return decks.find(d => d.id === activeDeckId) || decks[0] || null;
  }, [decks, activeDeckId]);

  const handleSelectDeck = (deck: Deck, mode: 'flashcards' | 'quiz' | 'hybrid' | 'handwriting') => {
    setActiveDeckId(deck.id);
    navigate(mode);
  };

  const handleCreateDeck = () => {
    setEditingDeck(null);
    navigate('edit-deck');
  };

  const handleEditDeck = (deck: Deck) => {
    setEditingDeck(deck);
    navigate('edit-deck');
  };

  const handleSaveDeck = (newOrUpdatedDeck: Deck) => {
    setDecks(prev => {
      const idx = prev.findIndex(d => d.id === newOrUpdatedDeck.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = newOrUpdatedDeck;
        return next;
      }
      return [newOrUpdatedDeck, ...prev];
    });
    setActiveDeckId(newOrUpdatedDeck.id);
    navigate('deck-select');
  };

  const handleDeleteDeck = (deckId: string) => {
    setDecks(prev => prev.filter(d => d.id !== deckId));
    if (activeDeckId === deckId) {
      setActiveDeckId(null);
      navigate('deck-select');
    }
  };

  const handleUpdateDeckFromStudy = (updatedDeck: Deck) => {
    setDecks(prev => prev.map(d => (d.id === updatedDeck.id ? updatedDeck : d)));
  };

  const handleToggleSound = () => {
    const next = soundManager.toggleSound();
    setSoundEnabled(next);
  };

  const handleToggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
  };

  const handleResetProgress = () => {
    setDecks(prev =>
      prev.map(deck => ({
        ...deck,
        cards: deck.cards.map(c => ({ ...c, mastered: false })),
      }))
    );
    setIsStatsOpen(false);
  };

  const handleImportSuccess = (importedDecks: Deck[]) => {
    setDecks(importedDecks);
    if (importedDecks.length > 0) {
      setActiveDeckId(importedDecks[0].id);
    }
  };

  const handleImportDeckFromJson = (deckData: {
    language?: string;
    title?: string;
    description?: string;
    category?: string;
    color?: string;
    cards: Flashcard[];
  }) => {
    const newDeck: Deck = {
      language: deckData.language,
      id: `deck-${Date.now()}`,
      title: deckData.title || 'Dek Baru Impor',
      description: deckData.description || '',
      category: deckData.category || 'Umum',
      color: deckData.color || 'from-indigo-500 to-purple-600',
      cards: deckData.cards,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setDecks(prev => [newDeck, ...prev]);
    setActiveDeckId(newDeck.id);
    navigate('deck-select');
  };

  const handleImportMultiDecksFromJson = (importedDecks: Deck[]) => {
    setDecks(prev => [...importedDecks, ...prev]);
    if (importedDecks.length > 0) {
      setActiveDeckId(importedDecks[0].id);
    }
    navigate('deck-select');
  };

  return (
    <div className="app-shell">
      {/* Top Navbar */}
      <Navbar
        currentMode={currentMode}
        activeDeck={activeDeck}
        onNavigate={navigate}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenImportExport={() => setIsImportExportOpen(true)}
      />

      {/* Main Study / Deck Area */}
      <main ref={pageRef} tabIndex={-1} aria-busy={isNavigating} inert={isNavigating} className={`page-content page-${currentMode}`}>
        {currentMode === 'deck-select' && (
          <DeckList
            decks={decks}
            onSelectDeck={handleSelectDeck}
            onEditDeck={handleEditDeck}
            onCreateDeck={handleCreateDeck}
            onDeleteDeck={handleDeleteDeck}
            onOpenImportExport={() => setIsImportExportOpen(true)}
            onOpenJsonImport={() => setIsJsonModalOpen(true)}
          />
        )}

        {(currentMode === 'flashcards' || currentMode === 'hybrid') && activeDeck && (
          <FlashcardViewer
            key={`${activeDeck.id}-${currentMode}`}
            deck={activeDeck}
            initialFilter={currentMode === 'hybrid' ? 'all' : 'flashcard'}
            onBack={() => navigate('deck-select')}
            onUpdateDeck={handleUpdateDeckFromStudy}
            onStartQuiz={() => navigate('quiz')}
          />
        )}

        {currentMode === 'quiz' && activeDeck && (
          <QuizViewer
            key={activeDeck.id}
            deck={{ ...activeDeck, cards: activeDeck.cards.filter(c => c.type !== 'handwriting') }}
            onBack={() => navigate('deck-select')}
            onGoToFlashcards={() => navigate('flashcards')}
          />
        )}

        {currentMode === 'handwriting' && activeDeck && (
          <HandwritingViewer key={activeDeck.id} deck={activeDeck}
            onBack={() => navigate('deck-select')} onUpdateDeck={handleUpdateDeckFromStudy} />
        )}

        {currentMode === 'edit-deck' && (
          <DeckEditor
            deck={editingDeck}
            onSave={handleSaveDeck}
            onCancel={() => navigate('deck-select')}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      {currentMode !== 'edit-deck' && (
        <BottomNav
          currentMode={currentMode}
          onNavigate={mode => {
            if ((mode === 'flashcards' || mode === 'quiz' || mode === 'hybrid' || mode === 'handwriting') && !activeDeckId && decks.length > 0) {
              setActiveDeckId(decks[0].id);
            }
            navigate(mode);
          }}
          hasActiveDeck={Boolean(activeDeck)}
          activeDeckIsWriting={Boolean(activeDeck && activeDeck.cards.some(c => c.type === 'handwriting') && !activeDeck.cards.some(c => c.type !== 'handwriting'))}
          onNewDeck={handleCreateDeck}
        />
      )}

      {/* Stats Modal */}
      <StatsModal
        decks={decks}
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        onResetProgress={handleResetProgress}
      />

      {/* Import / Export Modal */}
      <ImportExportModal
        decks={decks}
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        onImportSuccess={handleImportSuccess}
      />

      {/* Direct JSON Import Modal from Deck List */}
      <JsonImportModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        onImportDeck={handleImportDeckFromJson}
        onImportMultiDecks={handleImportMultiDecksFromJson}
      />
    </div>
  );
}

export default App;
