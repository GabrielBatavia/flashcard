import { useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { RotateCcw, Trash2, Eye, Check, X, HelpCircle, Volume2 } from 'lucide-react';
import type { Flashcard } from '../types';
import { soundManager } from '../utils/sound';

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
      x: Math.max(0, Math.min(600, ((event.clientX - bounds.left) / bounds.width) * 600)),
      y: Math.max(0, Math.min(480, ((event.clientY - bounds.top) / bounds.height) * 480)),
    };
  };

  const finish = (event: PointerEvent<SVGSVGElement>) => {
    if (activePointer.current !== event.pointerId) return;
    activePointer.current = null;
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {}
  };

  const rate = (correct: boolean) => {
    if (!revealed || rated.current || disabled) return;
    rated.current = true;
    onRate(correct);
  };

  return (
    <section className="handwriting-card" aria-label="Latihan menulis">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold leading-snug">{card.front}</h2>
        <button
          type="button"
          onClick={() => soundManager.speak(card.back)}
          className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl shrink-0"
          title="Dengarkan Jawaban"
        >
          <Volume2 className="w-4 h-4" />
        </button>
      </div>

      {card.hint && (
        <details className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <summary className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 cursor-pointer">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Petunjuk / Pinyin</span>
          </summary>
          <p className="mt-1.5 text-slate-700 dark:text-slate-300 font-medium pl-5">{card.hint}</p>
        </details>
      )}

      <p className="writing-instruction text-xs">
        ✍️ Tulis karakter/kalimat dengan jari, stylus, atau mouse di area bawah ini:
      </p>

      {/* Drawing Pad (Canvas SVG) */}
      <svg
        className="writing-pad"
        viewBox="0 0 600 480"
        role="img"
        aria-label="Area tulisan tangan"
        preserveAspectRatio="none"
        onPointerDown={event => {
          if (revealed || disabled || activePointer.current !== null) return;
          if (event.pointerType === 'mouse' && event.button !== 0) return;
          event.preventDefault();
          activePointer.current = event.pointerId;
          try {
            event.currentTarget.setPointerCapture(event.pointerId);
          } catch {}
          const start = point(event);
          setStrokes(previous => [...previous, [start]]);
        }}
        onPointerMove={event => {
          if (activePointer.current !== event.pointerId) return;
          const next = point(event);
          setStrokes(previous => [...previous.slice(0, -1), [...previous[previous.length - 1], next]]);
        }}
        onPointerUp={finish}
        onPointerCancel={finish}
        onLostPointerCapture={() => {
          activePointer.current = null;
        }}
      >
        {/* Chinese character grid lines (田字格 / 4-quadrant grid) */}
        {[120, 240, 360].map(y => (
          <line key={y} x1="0" y1={y} x2="600" y2={y} className="writing-guide" />
        ))}
        <line x1="300" y1="0" x2="300" y2="480" className="writing-guide" />

        {/* Drawn strokes */}
        {strokes.map((stroke, index) =>
          stroke.length === 1 ? (
            <circle key={index} cx={stroke[0].x} cy={stroke[0].y} r="3" fill="currentColor" />
          ) : (
            <polyline
              key={index}
              points={stroke.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )
        )}
      </svg>

      {/* Writing Tools */}
      <div className="writing-tools flex gap-2">
        <button
          type="button"
          className="button flex-1 py-2 text-xs"
          disabled={revealed || disabled || !strokes.length}
          onClick={() => setStrokes(previous => previous.slice(0, -1))}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Urungkan</span>
        </button>
        <button
          type="button"
          className="button flex-1 py-2 text-xs"
          disabled={revealed || disabled || !strokes.length}
          onClick={() => setStrokes([])}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Hapus Semua</span>
        </button>
      </div>

      {!revealed ? (
        <button
          type="button"
          className="button primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-md"
          disabled={disabled}
          onClick={() => {
            activePointer.current = null;
            setRevealed(true);
          }}
        >
          <Eye className="w-4 h-4" />
          <span>Lihat Jawaban &amp; Cocokkan</span>
        </button>
      ) : (
        <div className="writing-comparison p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3" role="status">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Karakter / Jawaban Seharusnya:
          </p>
          <div className="writing-answer text-4xl sm:text-5xl font-bold py-2 text-indigo-600 dark:text-indigo-300" lang={language}>
            {card.back}
          </div>
          {card.explanation && (
            <p className="text-xs text-slate-600 dark:text-slate-300">{card.explanation}</p>
          )}
          <p className="text-xs text-slate-500">
            Bandingkan dengan tulisanmu di atas, lalu nilai sendiri:
          </p>
          <div className="writing-tools flex gap-3 pt-1">
            <button
              type="button"
              className="button flex-1 py-3 text-sm font-bold text-rose-600 border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center gap-1.5"
              disabled={disabled}
              onClick={() => rate(false)}
            >
              <X className="w-4 h-4" />
              <span>Salah</span>
            </button>
            <button
              type="button"
              className="button primary flex-1 py-3 text-sm font-bold bg-emerald-600 border-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5"
              disabled={disabled}
              onClick={() => rate(true)}
            >
              <Check className="w-4 h-4" />
              <span>Benar</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
