export interface Flashcard {
  id: string;
  front: string; // Question / Term
  back: string;  // Answer / Definition
  hint?: string;
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

export type StudyMode = 'deck-select' | 'flashcards' | 'quiz' | 'edit-deck';

export interface QuizQuestion {
  cardId: string;
  question: string;
  correctAnswer: string;
  options: string[];
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
