export interface Flashcard {
  id: string;
  type?: 'flashcard' | 'quiz'; // 'flashcard' atau 'quiz' untuk mode alur gabungan
  front: string; // Question / Term / Soal
  back: string;  // Answer / Definition / Jawaban Benar
  hint?: string;
  options?: string[]; // Multiple choice options (Pilihan Ganda A, B, C, D)
  explanation?: string; // Pembahasan / Penjelasan soal kuis
  mastered?: boolean; // Learned status
  lastReviewed?: number; // timestamp
}

export interface Deck {
  id: string;
  title: string;
  description: string;
  category: string;
  color: string; // Tailwind color class or hex
  cards: Flashcard[];
  createdAt: number;
  updatedAt: number;
  quizHighScore?: number;
}

export type StudyMode = 'deck-select' | 'flashcards' | 'quiz' | 'hybrid' | 'edit-deck';

export interface QuizQuestion {
  cardId: string;
  question: string;
  correctAnswer: string;
  options: string[];
  explanation?: string;
  userAnswer?: string;
  isCorrect?: boolean;
}

export interface QuizResult {
  deckId: string;
  deckTitle: string;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  scorePercentage: number;
  wrongQuestions: QuizQuestion[];
  completedAt: number;
}
