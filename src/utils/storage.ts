import type { Deck, QuizResult } from '../types';
import { DEFAULT_DECKS } from '../data/defaultDecks';

const STORAGE_KEY_DECKS = 'flashquiz_decks_v1';
const STORAGE_KEY_HISTORY = 'flashquiz_quiz_history_v1';
const STORAGE_KEY_THEME = 'flashquiz_theme_mode';

export function loadDecks(): Deck[] {
  if (typeof window === 'undefined') return DEFAULT_DECKS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DECKS);
    if (!raw) {
      saveDecks(DEFAULT_DECKS);
      return DEFAULT_DECKS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_DECKS;
  } catch (err) {
    console.error('Failed to parse decks from localStorage', err);
    return DEFAULT_DECKS;
  }
}

export function saveDecks(decks: Deck[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_DECKS, JSON.stringify(decks));
  } catch (err) {
    console.error('Failed to save decks', err);
  }
}

export function loadQuizHistory(): QuizResult[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveQuizResult(result: QuizResult): void {
  if (typeof window === 'undefined') return;
  try {
    const history = loadQuizHistory();
    const updated = [result, ...history].slice(0, 50); // keep last 50
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));

    // Update deck's high score
    const decks = loadDecks();
    const deckIdx = decks.findIndex(d => d.id === result.deckId);
    if (deckIdx >= 0) {
      const currentHigh = decks[deckIdx].quizHighScore || 0;
      if (result.scorePercentage > currentHigh) {
        decks[deckIdx].quizHighScore = Math.round(result.scorePercentage);
        saveDecks(decks);
      }
    }
  } catch (err) {
    console.error('Failed to save quiz result', err);
  }
}

export function exportDecksToJson(decks: Deck[]): string {
  return JSON.stringify(decks, null, 2);
}

export function importDecksFromJson(jsonString: string): Deck[] {
  const parsed = JSON.parse(jsonString);
  if (!Array.isArray(parsed)) {
    throw new Error('Format data tidak valid (harus array dek).');
  }
  // Validate structure
  parsed.forEach(deck => {
    if (!deck.title || !Array.isArray(deck.cards)) {
      throw new Error(`Dek "${deck.title || 'Tanpa Nama'}" tidak memiliki format kartu yang valid.`);
    }
  });
  return parsed;
}

export function parseCsvCards(csvContent: string): { front: string; back: string }[] {
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
  const cards: { front: string; back: string }[] = [];

  for (const line of lines) {
    // Support either comma, semicolon, or tab separator
    let delimiter = ';';
    if (line.includes(';') && !line.includes('\t')) delimiter = ';';
    else if (line.includes('\t')) delimiter = '\t';
    else if (line.includes('|')) delimiter = '|';
    else delimiter = ',';

    const parts = line.split(delimiter);
    if (parts.length >= 2) {
      const front = parts[0].trim().replace(/^["']|["']$/g, '');
      const back = parts.slice(1).join(delimiter).trim().replace(/^["']|["']$/g, '');
      if (front && back) {
        cards.push({ front, back });
      }
    }
  }
  return cards;
}

export function getThemePreference(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem(STORAGE_KEY_THEME);
  if (saved === 'dark' || saved === 'light') return saved;
  // default to dark or light based on system
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function saveThemePreference(theme: 'light' | 'dark'): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_THEME, theme);
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}
