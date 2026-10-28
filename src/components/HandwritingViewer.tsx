import { useEffect, useRef, useState } from 'react';
import type { Deck, Flashcard, QuizQuestion } from '../types';
import { HandwritingCard } from './HandwritingCard';
import { saveQuizResult } from '../utils/storage';
import { soundManager } from '../utils/sound';

export function HandwritingViewer({ deck, onBack, onUpdateDeck }: {
  deck: Deck;
  onBack: () => void;
  onUpdateDeck: (deck: Deck) => void;
}) {
  const [cards, setCards] = useState(() => deck.cards.filter(card => card.type === 'handwriting'));
  const [results, setResults] = useState<QuizQuestion[]>([]);
  const [attempt, setAttempt] = useState(0);
  const rating = useRef(false);
  const card = cards[results.length];
  const correctCount = results.filter(result => result.isCorrect).length;
  const missed = cards.filter(item => results.some(result => result.cardId === item.id && !result.isCorrect));

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [card?.id, attempt]);

  const restart = (next: Flashcard[]) => {
    setCards(next);
    setResults([]);
    setAttempt(previous => previous + 1);
    rating.current = false;
  };
  const rate = (correct: boolean) => {
    if (!card || rating.current) return;
    rating.current = true;
    const next = [...results, {
      cardId: card.id, question: card.front, correctAnswer: card.back,
      options: [], explanation: card.explanation,
      userAnswer: correct ? 'Dinilai sendiri: benar' : 'Dinilai sendiri: salah', isCorrect: correct,
    }];
    const updatedDeck = { ...deck, updatedAt: Date.now(), cards: deck.cards.map(item => item.id === card.id
      ? { ...item, mastered: correct, lastReviewed: Date.now() } : item) };
    if (next.length === cards.length) {
      const count = next.filter(result => result.isCorrect).length;
      const percentage = Math.round(count / cards.length * 100);
      updatedDeck.quizHighScore = Math.max(deck.quizHighScore || 0, percentage);
      saveQuizResult({ deckId: deck.id, deckTitle: `${deck.title} (Menulis)`, totalQuestions: cards.length,
        correctCount: count, wrongCount: cards.length - count, scorePercentage: percentage,
        wrongQuestions: next.filter(result => !result.isCorrect), completedAt: Date.now() });
    }
    onUpdateDeck(updatedDeck);
    if (correct) soundManager.playCorrect(); else soundManager.playWrong();
    setResults(next);
    rating.current = false;
  };

  return <div className="writing-viewer">
    <button className="button" onClick={onBack}>Kembali ke materi</button>
    {cards.length === 0 ? <p>Dek ini belum memiliki kartu menulis. Impor kartu dengan type: handwriting.</p>
      : card ? <>
        <div className="writing-progress"><span>Menulis {results.length + 1} dari {cards.length}</span><span>Benar: {correctCount}</span></div>
        <HandwritingCard key={`${attempt}-${card.id}`} card={card} language={deck.language} onRate={rate} />
        <p className="writing-instruction">Penilaian tersimpan di perangkat ini. Goresan tidak disimpan setelah pindah soal.</p>
      </> : <section className="handwriting-card">
        <h2>Latihan selesai</h2>
        <p>{correctCount} benar, {results.length - correctCount} salah dari {results.length} soal.</p>
        <p>Hasil berdasarkan penilaianmu sendiri.</p>
        {missed.length > 0 && <button className="button primary" onClick={() => restart(missed)}>Ulangi {missed.length} soal yang salah</button>}
        <button className="button" onClick={() => restart(deck.cards.filter(item => item.type === 'handwriting'))}>Ulangi semua</button>
      </section>}
  </div>;
}
