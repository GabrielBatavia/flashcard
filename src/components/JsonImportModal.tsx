import React, { useState } from 'react';
import { 
  X, FileCode, Upload, Copy, Check, Sparkles, HelpCircle, 
  AlertCircle, ArrowRight, Wand2, ListChecks, CreditCard, Bot, Zap
} from 'lucide-react';
import type { Flashcard, Deck } from '../types';
import { 
  parseFlexibleDeckJson, 
  SAMPLE_DECK_JSON, 
  SAMPLE_QUIZ_JSON,
  SAMPLE_HYBRID_JSON
} from '../utils/storage';
import { usePresence } from './usePresence';
import { useDialog } from './useDialog';

interface JsonImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportDeck: (deckData: {
    title?: string;
    description?: string;
    category?: string;
    color?: string;
    cards: Flashcard[];
  }) => void;
  onImportMultiDecks?: (decks: Deck[]) => void;
}

export const JsonImportModal: React.FC<JsonImportModalProps> = ({
  isOpen,
  onClose,
  onImportDeck,
  onImportMultiDecks,
}) => {
  const { present, closing } = usePresence(isOpen);
  const dialogRef = useDialog(present, onClose);
  const [activeTab, setActiveTab] = useState<'input' | 'guide'>('input');
  const [guideMode, setGuideMode] = useState<'hybrid' | 'quiz' | 'flashcard'>('hybrid');
  const [jsonText, setJsonText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedFormat, setCopiedFormat] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  if (!present) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const content = event.target?.result as string;
        setJsonText(content);
        processJson(content);
      } catch (err: unknown) {
        setErrorMsg((err as Error).message || 'Gagal membaca file JSON.');
      }
    };
    reader.readAsText(file);
  };

  const processJson = (rawContent: string) => {
    setErrorMsg(null);
    if (!rawContent.trim()) {
      setErrorMsg('Teks JSON tidak boleh kosong.');
      return;
    }

    try {
      const result = parseFlexibleDeckJson(rawContent);

      if (result.type === 'deck') {
        onImportDeck(result.deck);
        onClose();
      } else if (result.type === 'cards') {
        const hasQuizOptions = result.cards.some(c => c.type === 'quiz' || (c.options && c.options.length >= 2));
        const hasFlashcards = result.cards.some(c => !(c.type === 'quiz' || (c.options && c.options.length >= 2)));
        const title = hasQuizOptions && hasFlashcards 
          ? 'Dek Alur Gabungan Baru' 
          : hasQuizOptions 
          ? 'Dek Kuis Baru' 
          : 'Dek Flashcard Baru';

        onImportDeck({
          title,
          description: `Dek berisi ${result.cards.length} materi/soal`,
          cards: result.cards,
        });
        onClose();
      } else if (result.type === 'multi-deck') {
        if (onImportMultiDecks) {
          onImportMultiDecks(result.decks);
          onClose();
        } else {
          const first = result.decks[0];
          onImportDeck({
            title: first.title,
            description: first.description,
            category: first.category,
            color: first.color,
            cards: first.cards,
          });
          onClose();
        }
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Format JSON tidak valid.');
    }
  };

  const handleLoadHybridSample = () => {
    setJsonText(SAMPLE_HYBRID_JSON);
    setErrorMsg(null);
  };

  const handleLoadQuizSample = () => {
    setJsonText(SAMPLE_QUIZ_JSON);
    setErrorMsg(null);
  };

  const handleLoadFlashcardSample = () => {
    setJsonText(SAMPLE_DECK_JSON);
    setErrorMsg(null);
  };

  const currentSample = 
    guideMode === 'hybrid' 
      ? SAMPLE_HYBRID_JSON 
      : guideMode === 'quiz' 
      ? SAMPLE_QUIZ_JSON 
      : SAMPLE_DECK_JSON;

  const handleCopyCurrentFormat = () => {
    navigator.clipboard.writeText(currentSample);
    setCopiedFormat(true);
    setTimeout(() => setCopiedFormat(false), 2000);
  };

  const hybridPrompt = `Buatkan materi belajar campuran (gabungan flashcard dan diselingi soal kuis pilihan ganda) tentang: [TULIS MATERI KAMU DI SINI, contoh: 15 Konsep JavaScript Modern / Biologi Sel SMA]

Atur urutannya: buat beberapa flashcard materi terlebih dahulu, lalu selingi dengan kuis uji pemahaman di tengah-tengah alur, lalu lanjutkan flashcard berikutnya.

Keluarkan HANYA format JSON murni yang valid persis seperti ini:
${SAMPLE_HYBRID_JSON}`;

  const quizPrompt = `Buatkan kuis pilihan ganda 10 soal tentang: [TULIS MATERI KAMU DI SINI, contoh: Biologi Sel / Sejarah Kemerdekaan Indonesia]

Keluarkan HANYA format JSON murni yang valid tanpa pengantar ataupun penutup markdown, persis seperti format ini:
${SAMPLE_QUIZ_JSON}`;

  const flashcardPrompt = `Buatkan flashcard tanya-jawab 10 kartu tentang: [TULIS MATERI KAMU DI SINI, contoh: Kosakata JLPT N5]

Keluarkan HANYA format JSON murni yang valid persis seperti format ini:
${SAMPLE_DECK_JSON}`;

  const activePrompt = 
    guideMode === 'hybrid' 
      ? hybridPrompt 
      : guideMode === 'quiz' 
      ? quizPrompt 
      : flashcardPrompt;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(activePrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div
      data-closing={closing}
      className="sheet-overlay fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={dialogRef}
        inert={closing}
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-json-title"
        className="sheet-panel bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-4 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-sm">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h3 id="import-json-title" className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                Impor Dek &amp; Alur Belajar via JSON ⚡
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Mendukung Flashcard, Kuis, atau Mode Gabungan (Alur Campuran)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle: Input vs Guide */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-900 p-1 text-xs font-semibold my-3">
          <button
            onClick={() => {
              setActiveTab('input');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'input'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Tempel / Unggah JSON</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('guide');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'guide'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Format Panduan JSON</span>
          </button>
        </div>

        {/* TAB 1: INPUT / UPLOAD */}
        {activeTab === 'input' && (
          <div className="space-y-3 overflow-y-auto pr-1 flex-1">
            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-xl cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-indigo-500" />
                <span>Pilih File .json</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleLoadHybridSample}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-xl transition-colors border border-purple-200 dark:border-purple-800"
                  title="Isi contoh JSON campuran flashcard + kuis"
                >
                  <Zap className="w-3.5 h-3.5 text-purple-500" />
                  <span>Contoh Gabungan</span>
                </button>

                <button
                  type="button"
                  onClick={handleLoadQuizSample}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-xl transition-colors border border-emerald-200 dark:border-emerald-800"
                  title="Isi contoh JSON soal kuis pilihan ganda"
                >
                  <ListChecks className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Kuis</span>
                </button>

                <button
                  type="button"
                  onClick={handleLoadFlashcardSample}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-xl transition-colors border border-indigo-200 dark:border-indigo-800"
                  title="Isi contoh JSON flashcard tanya jawab"
                >
                  <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Flashcard</span>
                </button>
              </div>
            </div>

            {/* Textarea */}
            <div>
              <textarea
                rows={9}
                value={jsonText}
                onChange={e => setJsonText(e.target.value)}
                placeholder={`Tempel kode JSON di sini...\n\nBisa format campuran:\n{\n  "title": "Materi Gabungan",\n  "items": [\n    { "type": "flashcard", "front": "Istilah 1", "back": "Arti 1" },\n    { "type": "quiz", "question": "Soal kuis?", "options": ["A", "B", "C", "D"], "answer": "A" }\n  ]\n}`}
                className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
              />
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
              ⚡ <em>Fleksibel:</em> Urutan dalam JSON akan dipatuhi 100%. Kamu bisa menyusun 20 flashcard, diselingi 1 kuis, lalu 10 flashcard lagi!
            </p>

            <button
              type="button"
              onClick={() => processJson(jsonText)}
              disabled={!jsonText.trim()}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-40 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <span>Impor &amp; Buat Dek Otomatis</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TAB 2: FORMAT GUIDE */}
        {activeTab === 'guide' && (
          <div className="space-y-3 overflow-y-auto pr-1 flex-1 text-xs">
            {/* Guide Sub-Toggle */}
            <div className="grid grid-cols-3 rounded-xl bg-slate-100 dark:bg-slate-900/80 p-1 border border-slate-200 dark:border-slate-700 text-xs font-semibold gap-1">
              <button
                onClick={() => setGuideMode('hybrid')}
                className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 truncate ${
                  guideMode === 'hybrid'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <Zap className="w-3 h-3 shrink-0" />
                <span className="truncate">⚡ Gabungan</span>
              </button>

              <button
                onClick={() => setGuideMode('quiz')}
                className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 truncate ${
                  guideMode === 'quiz'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <ListChecks className="w-3 h-3 shrink-0" />
                <span className="truncate">🎯 Kuis</span>
              </button>

              <button
                onClick={() => setGuideMode('flashcard')}
                className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 truncate ${
                  guideMode === 'flashcard'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-3 h-3 shrink-0" />
                <span className="truncate">🃏 Flashcard</span>
              </button>
            </div>

            {/* Guide Content: HYBRID / GABUNGAN */}
            {guideMode === 'hybrid' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-purple-500" />
                    Format Gabungan (Flashcard + Kuis Diselingi)
                  </span>
                  <button
                    onClick={handleCopyCurrentFormat}
                    className="px-2.5 py-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/60 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    {copiedFormat ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedFormat ? 'Tersalin!' : 'Salin JSON Gabungan'}</span>
                  </button>
                </div>

                <div className="p-3 bg-slate-900 text-slate-100 rounded-2xl overflow-x-auto font-mono text-[11px] leading-relaxed">
                  <pre>{SAMPLE_HYBRID_JSON}</pre>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl space-y-1.5 text-[11px] border border-slate-200 dark:border-slate-800">
                  <p className="font-bold text-slate-800 dark:text-slate-200">Cara Kerja Mode Gabungan:</p>
                  <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1 pl-1">
                    <li>Gunakan array <code>items</code> di dalam objek JSON.</li>
                    <li>Untuk kartu flashcard: sertakan <code>&quot;type&quot;: &quot;flashcard&quot;</code>, <code>&quot;front&quot;</code>, dan <code>&quot;back&quot;</code>.</li>
                    <li>Untuk soal kuis pilihan ganda: sertakan <code>&quot;type&quot;: &quot;quiz&quot;</code>, <code>&quot;question&quot;</code>, <code>&quot;options&quot;</code> (4 opsi), dan <code>&quot;answer&quot;</code>.</li>
                    <li>Saat kamu belajar, sistem akan menampilkan flashcard untuk dihafal, dan begitu tiba di kartu kuis, kuis interaktif akan muncul otomatis!</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Guide Content: QUIZ ONLY */}
            {guideMode === 'quiz' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    Struktur JSON Soal Kuis Saja
                  </span>
                  <button
                    onClick={handleCopyCurrentFormat}
                    className="px-2.5 py-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    {copiedFormat ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedFormat ? 'Tersalin!' : 'Salin JSON Kuis'}</span>
                  </button>
                </div>

                <div className="p-3 bg-slate-900 text-slate-100 rounded-2xl overflow-x-auto font-mono text-[11px] leading-relaxed">
                  <pre>{SAMPLE_QUIZ_JSON}</pre>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl space-y-1.5 text-[11px] border border-slate-200 dark:border-slate-800">
                  <p className="font-bold text-slate-800 dark:text-slate-200">Keterangan Properti Kuis:</p>
                  <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1 pl-1">
                    <li><code>questions</code>: Array berisi soal kuis.</li>
                    <li><code>question</code>: Kalimat pertanyaan.</li>
                    <li><code>options</code>: 4 pilihan jawaban.</li>
                    <li><code>answer</code>: Jawaban benar (teks langsung, huruf &quot;A&quot;-&quot;D&quot;, atau index 0-3).</li>
                    <li><code>explanation</code>: Pembahasan (opsional).</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Guide Content: FLASHCARD ONLY */}
            {guideMode === 'flashcard' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    Struktur JSON Flashcard Saja
                  </span>
                  <button
                    onClick={handleCopyCurrentFormat}
                    className="px-2.5 py-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    {copiedFormat ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedFormat ? 'Tersalin!' : 'Salin JSON Flashcard'}</span>
                  </button>
                </div>

                <div className="p-3 bg-slate-900 text-slate-100 rounded-2xl overflow-x-auto font-mono text-[11px] leading-relaxed">
                  <pre>{SAMPLE_DECK_JSON}</pre>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl space-y-1.5 text-[11px] border border-slate-200 dark:border-slate-800">
                  <p className="font-bold text-slate-800 dark:text-slate-200">Keterangan Properti Flashcard:</p>
                  <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1 pl-1">
                    <li><code>front</code>: Sisi depan (pertanyaan / istilah).</li>
                    <li><code>back</code>: Sisi belakang (jawaban / arti).</li>
                    <li><code>hint</code>: Petunjuk opsional.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Prompt ChatGPT Box */}
            <div className="p-3.5 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-950/40 dark:via-indigo-950/40 dark:to-blue-950/40 border border-purple-200 dark:border-purple-900/60 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-900 dark:text-indigo-200 text-xs flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Minta ChatGPT Buatkan Materi Otomatis
                </span>
                <button
                  onClick={handleCopyPrompt}
                  className="px-2.5 py-1 bg-white dark:bg-slate-800 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 rounded-lg shadow-sm flex items-center gap-1 hover:bg-slate-50 transition-colors"
                >
                  {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPrompt ? 'Prompt Tersalin!' : 'Salin Prompt AI'}</span>
                </button>
              </div>
              <p className="text-[11px] text-indigo-800/80 dark:text-indigo-300 leading-relaxed">
                Salin prompt di atas ke ChatGPT untuk membuat materi belajar sesuai format yang kamu pilih. Hasil balasan ChatGPT tinggal kamu copy dan paste di tab <strong>Tempel / Unggah JSON</strong>!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
