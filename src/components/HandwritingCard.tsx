import { useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import type { Flashcard } from '../types';

type Point = { x: number; y: number };

export function HandwritingCard({ card, language, onRate, disabled = false }: {
  card: Flashcard;
  language?: string;
  onRate: (correct: boolean) => void;
  disabled?: boolean;
}) {
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [revealed, setRevealed] = useState(false);
  const activePointer = useRef<number | null>(null);
  const rated = useRef(false);

  const point = (event: PointerEvent<SVGSVGElement>): Point => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(600, (event.clientX - bounds.left) / bounds.width * 600)),
      y: Math.max(0, Math.min(480, (event.clientY - bounds.top) / bounds.height * 480)),
    };
  };
  const finish = (event: PointerEvent<SVGSVGElement>) => {
    if (activePointer.current !== event.pointerId) return;
    activePointer.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const rate = (correct: boolean) => {
    if (!revealed || rated.current || disabled) return;
    rated.current = true;
    onRate(correct);
  };

  return <section className="handwriting-card" aria-label="Latihan menulis">
    <h2>{card.front}</h2>
    {card.hint && <details><summary>Petunjuk</summary><p>{card.hint}</p></details>}
    <p className="writing-instruction">Tulis dengan jari, stylus, atau mouse. Gunakan beberapa baris untuk kalimat.</p>
    <svg className="writing-pad" viewBox="0 0 600 480" role="img"
      aria-label="Area tulisan tangan" preserveAspectRatio="none"
      onPointerDown={event => {
        if (revealed || disabled || activePointer.current !== null || event.button !== 0) return;
        event.preventDefault();
        activePointer.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        const start = point(event);
        setStrokes(previous => [...previous, [start]]);
      }}
      onPointerMove={event => {
        if (activePointer.current !== event.pointerId) return;
        const next = point(event);
        setStrokes(previous => [...previous.slice(0, -1), [...previous[previous.length - 1], next]]);
      }}
      onPointerUp={finish} onPointerCancel={finish}
      onLostPointerCapture={() => { activePointer.current = null; }}>
      {[120, 240, 360].map(y => <line key={y} x1="0" y1={y} x2="600" y2={y} className="writing-guide" />)}
      {strokes.map((stroke, index) => stroke.length === 1
        ? <circle key={index} cx={stroke[0].x} cy={stroke[0].y} r="2.5" fill="currentColor" />
        : <polyline key={index} points={stroke.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />)}
    </svg>
    <div className="writing-tools">
      <button className="button" disabled={revealed || disabled || !strokes.length} onClick={() => setStrokes(previous => previous.slice(0, -1))}>Urungkan goresan</button>
      <button className="button" disabled={revealed || disabled || !strokes.length} onClick={() => setStrokes([])}>Hapus semua</button>
    </div>
    {!revealed ? <button className="button primary w-full" disabled={disabled} onClick={() => {
      activePointer.current = null;
      setRevealed(true);
    }}>Lihat jawaban</button> : <div className="writing-comparison" role="status">
      <p>Jawaban</p>
      <div className="writing-answer" lang={language}>{card.back}</div>
      {card.explanation && <p>{card.explanation}</p>}
      <p>Bandingkan dengan tulisanmu, lalu nilai sendiri.</p>
      <div className="writing-tools">
        <button className="button" disabled={disabled} onClick={() => rate(false)}>Salah</button>
        <button className="button primary" disabled={disabled} onClick={() => rate(true)}>Benar</button>
      </div>
    </div>}
  </section>;
}
