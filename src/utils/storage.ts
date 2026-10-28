import type { Deck, QuizResult, Flashcard } from '../types';
import { DEFAULT_DECKS } from '../data/defaultDecks';

const STORAGE_KEY_DECKS = 'flashquiz_decks_v1';
const STORAGE_KEY_HISTORY = 'flashquiz_quiz_history_v1';
const STORAGE_KEY_THEME = 'flashquiz_theme_mode';

export const SAMPLE_HYBRID_JSON = `{
  "title": "Pemrograman JavaScript Modern",
  "description": "Flashcard materi inti diselingi kuis uji pemahaman di tengah alur belajar",
  "category": "Pemrograman",
  "color": "from-emerald-500 to-teal-600",
  "items": [
    {
      "type": "flashcard",
      "front": "Apa itu Closure di JavaScript?",
      "back": "Fungsi yang mengingat dan mengakses variabel dari lexical scope induknya bahkan setelah fungsi induk selesai dieksekusi.",
      "hint": "Lexical Scope"
    },
    {
      "type": "flashcard",
      "front": "Apa perbedaan let dan var?",
      "back": "let memiliki block scope dan temporal dead zone, sedangkan var memiliki function scope dan di-hoist tanpa TDZ.",
      "hint": "Block scope vs Function scope"
    },
    {
      "type": "quiz",
      "question": "Manakah deklarasi variabel yang TIDAK mengalami Temporal Dead Zone (TDZ)?",
      "options": ["let", "const", "var", "semua mengalami TDZ"],
      "answer": "var",
      "explanation": "var di-hoist dengan nilai default undefined, sedangkan let dan const berada di TDZ sebelum baris deklarasinya dieksekusi."
    },
    {
      "type": "flashcard",
      "front": "Apa fungsi Promise.all()?",
      "back": "Menjalankan beberapa promise secara paralel dan menunggu semuanya resolve (atau langsung reject jika salah satu gagal).",
      "hint": "Asynchronous concurrency"
    },
    {
      "type": "quiz",
      "question": "Apa output default dari fungsi async?",
      "options": ["Promise", "Undefined", "Object", "Function"],
      "answer": "Promise",
      "explanation": "Fungsi async selalu membungkus nilai kembaliannya ke dalam Promise (Promise.resolve)."
    }
  ]
}`;

export const SAMPLE_QUIZ_JSON = `{
  "title": "Kuis Cerdas Cermat",
  "description": "Latihan soal pilihan ganda sains dan pengetahuan umum",
  "category": "Pengetahuan Umum",
  "color": "from-indigo-500 to-purple-600",
  "questions": [
    {
      "question": "Apa ibu kota negara Indonesia saat ini?",
      "options": ["Jakarta", "Surabaya", "Bandung", "Medan"],
      "answer": "Jakarta",
      "explanation": "Jakarta saat ini masih berstatus sebagai ibu kota negara Republik Indonesia."
    },
    {
      "question": "Planet terdekat dari Matahari dalam tata surya adalah...",
      "options": ["Merkurius", "Venus", "Bumi", "Mars"],
      "answer": "Merkurius",
      "explanation": "Merkurius adalah planet terdekat dengan Matahari berjarak sekitar 58 juta km."
    },
    {
      "question": "Berapa hasil dari 25 x 4?",
      "options": ["75", "100", "125", "150"],
      "answer": "100",
      "explanation": "25 dikalikan 4 menghasilkan 100."
    }
  ]
}`;

export const SAMPLE_DECK_JSON = `{
  "title": "Kosakata Bahasa Jepang N5",
  "description": "Kosakata dasar dan artinya untuk persiapan JLPT N5",
  "category": "Bahasa",
  "color": "from-indigo-500 to-purple-600",
  "cards": [
    {
      "front": "Taberu (食べる)",
      "back": "Makan (to eat)",
      "hint": "Kata kerja golongan 2"
    },
    {
      "front": "Nomu (飲む)",
      "back": "Minum (to drink)",
      "hint": "Kata kerja golongan 1"
    },
    {
      "front": "Ikimasu (行きます)",
      "back": "Pergi (to go)",
      "hint": "Bentuk sopan / masu"
    }
  ]
}`;

export const SAMPLE_CARDS_JSON = `[
  {
    "front": "Apa fungsi DNS?",
    "back": "Menerjemahkan nama domain (seperti google.com) menjadi alamat IP.",
    "hint": "Domain Name System"
  },
  {
    "front": "Apa perbedaan HTTP dan HTTPS?",
    "back": "HTTPS memiliki lapisan enkripsi SSL/TLS untuk transmisi data yang aman.",
    "hint": "Huruf S berarti Secure"
  }
]`;

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

// Normalize a single item object to Flashcard / Quiz format
// Accepts:
// Question: front / question / soal / pertanyaan / term / q
// Answer: back / answer / jawaban / jawaban_benar / correctAnswer / correct_answer / definition / a
// Options: options / pilihan / choices / opsi
// Explanation: explanation / pembahasan / penjelasan / alasan
// Hint: hint / petunjuk / clue
function normalizeCard(rawCard: Record<string, unknown>, index: number): Flashcard | null {
  if (!rawCard || typeof rawCard !== 'object') return null;

  const front = String(
    rawCard.front ??
    rawCard.question ??
    rawCard.soal ??
    rawCard.pertanyaan ??
    rawCard.term ??
    rawCard.q ??
    ''
  ).trim();

  // Extract multiple choice options if available
  const rawOpts = rawCard.options ?? rawCard.pilihan ?? rawCard.choices ?? rawCard.opsi;
  let options: string[] | undefined = undefined;
  if (Array.isArray(rawOpts)) {
    const cleaned = rawOpts.map(o => String(o).trim()).filter(Boolean);
    if (cleaned.length >= 2) {
      options = cleaned;
    }
  }

  // Answer resolution (handles text, number index, or letter A-D)
  const rawAnswer =
    rawCard.back ??
    rawCard.answer ??
    rawCard.jawaban ??
    rawCard.jawaban_benar ??
    rawCard.correctAnswer ??
    rawCard.correct_answer ??
    rawCard.definition ??
    rawCard.a;

  let back = '';

  if (typeof rawAnswer === 'number' && options && options[rawAnswer]) {
    // 0 -> option[0], 1 -> option[1]
    back = options[rawAnswer];
  } else if (typeof rawAnswer === 'string') {
    const trimmed = rawAnswer.trim();
    // Check if it's a single letter A, B, C, D (case insensitive) and options exist
    if (options && options.length >= 2 && /^[A-Da-d]$/.test(trimmed)) {
      const letterIdx = trimmed.toUpperCase().charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
      if (options[letterIdx]) {
        back = options[letterIdx];
      } else {
        back = trimmed;
      }
    } else {
      back = trimmed;
    }
  } else if (rawAnswer !== undefined && rawAnswer !== null) {
    back = String(rawAnswer).trim();
  }

  if (!front || !back) return null;

  // If options exist, make sure the correct answer is one of the options
  if (options && options.length >= 2 && !options.includes(back)) {
    options.unshift(back);
  }

  const hint = rawCard.hint ?? rawCard.petunjuk ?? rawCard.clue;
  const explanation = rawCard.explanation ?? rawCard.pembahasan ?? rawCard.penjelasan ?? rawCard.alasan;

  // Explicit or inferred item type
  const rawType = String(rawCard.type ?? rawCard.tipe ?? rawCard.kind ?? '').toLowerCase();
  let type: 'flashcard' | 'quiz' = 'flashcard';
  if (rawType === 'quiz' || rawType === 'kuis') {
    type = 'quiz';
  } else if (rawType === 'flashcard' || rawType === 'kartu') {
    type = 'flashcard';
  } else if (options && options.length >= 2) {
    type = 'quiz';
  }

  return {
    id: (rawCard.id as string) || `c-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
    type,
    front,
    back,
    options,
    explanation: explanation ? String(explanation).trim() : undefined,
    hint: hint ? String(hint).trim() : undefined,
    mastered: Boolean(rawCard.mastered),
  };
}

export interface ParsedDeckResult {
  title?: string;
  description?: string;
  category?: string;
  color?: string;
  cards: Flashcard[];
}

export type FlexibleParseResult =
  | { type: 'deck'; deck: ParsedDeckResult }
  | { type: 'multi-deck'; decks: Deck[] }
  | { type: 'cards'; cards: Flashcard[] };

export function parseFlexibleDeckJson(jsonString: string): FlexibleParseResult {
  const trimmed = jsonString.trim();
  if (!trimmed) {
    throw new Error('Data JSON kosong.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error('Format JSON tidak valid. Periksa tanda koma, kurung kurawal {}, atau kutip dua "".');
  }

  // Case 1: Array of objects
  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      throw new Error('Array JSON kosong.');
    }

    // Check if it's an array of Decks (each item has 'title' and ('items' or 'cards' or 'questions' or 'soal'))
    const looksLikeMultiDeck = parsed.some(
      item => item && typeof item === 'object' && 'title' in item && ('items' in item || 'cards' in item || 'questions' in item || 'soal' in item || 'quiz' in item)
    );

    if (looksLikeMultiDeck) {
      const decks: Deck[] = [];
      parsed.forEach((rawDeck, dIdx) => {
        if (!rawDeck || typeof rawDeck !== 'object') return;
        const rawCards = Array.isArray(rawDeck.items)
          ? rawDeck.items
          : Array.isArray(rawDeck.cards)
          ? rawDeck.cards
          : Array.isArray(rawDeck.questions)
          ? rawDeck.questions
          : Array.isArray(rawDeck.soal)
          ? rawDeck.soal
          : Array.isArray(rawDeck.quiz)
          ? rawDeck.quiz
          : [];
        const cards: Flashcard[] = [];
        rawCards.forEach((c: Record<string, unknown>, cIdx: number) => {
          const norm = normalizeCard(c, cIdx);
          if (norm) cards.push(norm);
        });

        if (cards.length > 0) {
          decks.push({
            id: rawDeck.id || `deck-${Date.now()}-${dIdx}`,
            title: String(rawDeck.title || `Dek Impor ${dIdx + 1}`).trim(),
            description: String(rawDeck.description || '').trim(),
            category: String(rawDeck.category || 'Umum').trim(),
            color: String(rawDeck.color || 'from-indigo-500 to-purple-600').trim(),
            cards,
            createdAt: Number(rawDeck.createdAt) || Date.now(),
            updatedAt: Date.now(),
            quizHighScore: typeof rawDeck.quizHighScore === 'number' ? rawDeck.quizHighScore : undefined,
          });
        }
      });

      if (decks.length === 0) {
        throw new Error('Tidak ada dek atau kartu yang valid dalam array JSON.');
      }

      return { type: 'multi-deck', decks };
    }

    // Otherwise, treat as an array of Cards / Questions / Items!
    const cards: Flashcard[] = [];
    parsed.forEach((item, idx) => {
      const norm = normalizeCard(item as Record<string, unknown>, idx);
      if (norm) cards.push(norm);
    });

    if (cards.length === 0) {
      throw new Error('Tidak ada kartu atau soal yang valid. Pastikan setiap soal memiliki pertanyaan dan jawaban.');
    }

    return { type: 'cards', cards };
  }

  // Case 2: Single Deck Object { title, description, category, color, items/questions/cards }
  if (parsed && typeof parsed === 'object') {
    const rawObj = parsed as Record<string, unknown>;

    // Find cards / items / questions array
    const rawCards = Array.isArray(rawObj.items)
      ? rawObj.items
      : Array.isArray(rawObj.cards)
      ? rawObj.cards
      : Array.isArray(rawObj.questions)
      ? rawObj.questions
      : Array.isArray(rawObj.content)
      ? rawObj.content
      : Array.isArray(rawObj.materi)
      ? rawObj.materi
      : Array.isArray(rawObj.soal)
      ? rawObj.soal
      : Array.isArray(rawObj.quiz)
      ? rawObj.quiz
      : Array.isArray(rawObj.kuis)
      ? rawObj.kuis
      : Array.isArray(rawObj.flashcards)
      ? rawObj.flashcards
      : null;

    if (!rawCards) {
      throw new Error('Objek dek harus memiliki daftar isi materi (properti "items", "cards", atau "questions").');
    }

    const cards: Flashcard[] = [];
    rawCards.forEach((item, idx) => {
      const norm = normalizeCard(item as Record<string, unknown>, idx);
      if (norm) cards.push(norm);
    });

    if (cards.length === 0) {
      throw new Error('Daftar kartu pada objek dek kosong atau tidak memiliki "front" dan "back".');
    }

    return {
      type: 'deck',
      deck: {
        title: rawObj.title ? String(rawObj.title).trim() : undefined,
        description: rawObj.description ? String(rawObj.description).trim() : undefined,
        category: rawObj.category ? String(rawObj.category).trim() : undefined,
        color: rawObj.color ? String(rawObj.color).trim() : undefined,
        cards,
      },
    };
  }

  throw new Error('Format data JSON tidak dikenali.');
}

export function importDecksFromJson(jsonString: string): Deck[] {
  const result = parseFlexibleDeckJson(jsonString);

  if (result.type === 'multi-deck') {
    return result.decks;
  }

  if (result.type === 'deck') {
    const singleDeck: Deck = {
      id: `deck-${Date.now()}`,
      title: result.deck.title || 'Dek Baru Impor',
      description: result.deck.description || '',
      category: result.deck.category || 'Umum',
      color: result.deck.color || 'from-indigo-500 to-purple-600',
      cards: result.deck.cards,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    return [singleDeck];
  }

  // result.type === 'cards'
  const cardsOnlyDeck: Deck = {
    id: `deck-${Date.now()}`,
    title: 'Dek Baru Impor',
    description: `Diimpor otomatis (${result.cards.length} kartu)`,
    category: 'Umum',
    color: 'from-indigo-500 to-purple-600',
    cards: result.cards,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  return [cardsOnlyDeck];
}

export function parseCsvCards(csvContent: string): { front: string; back: string }[] {
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
  const cards: { front: string; back: string }[] = [];

  for (const line of lines) {
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
