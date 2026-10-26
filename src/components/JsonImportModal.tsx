import React, { useState } from 'react';
import { 
  X, FileCode, Upload, Copy, Check, Sparkles, HelpCircle, 
  AlertCircle, ArrowRight, Wand2, ListChecks, CreditCard, Bot 
} from 'lucide-react';
import type { Flashcard, Deck } from '../types';
import { 
  parseFlexibleDeckJson, 
  SAMPLE_DECK_JSON, 
  SAMPLE_QUIZ_JSON 
} from '../utils/storage';

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
  const [activeTab, setActiveTab] = useState<'input' | 'guide'>('input');
  const [guideMode, setGuideMode] = useState<'quiz' | 'flashcard'>('quiz');
  const [jsonText, setJsonText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedFormat, setCopiedFormat] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  if (!isOpen) return null;

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
        const hasQuizOptions = result.cards.some(c => c.options && c.options.length >= 2);
        onImportDeck({
          title: hasQuizOptions ? 'Dek Kuis Baru' : 'Dek Impor Baru',
          description: `Dek berisi ${result.cards.length} kartu/soal`,
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

  const handleLoadQuizSample = () => {
    setJsonText(SAMPLE_QUIZ_JSON);
    setErrorMsg(null);
  };

  const handleLoadFlashcardSample = () => {
    setJsonText(SAMPLE_DECK_JSON);
    setErrorMsg(null);
  };

  const currentSample = guideMode === 'quiz' ? SAMPLE_QUIZ_JSON : SAMPLE_DECK_JSON;

  const handleCopyCurrentFormat = () => {
    navigator.clipboard.writeText(currentSample);
    setCopiedFormat(true);
    setTimeout(() => setCopiedFormat(false), 2000);
  };

  const quizPrompt = `Buatkan kuis pilihan ganda 10 soal tentang: [TULIS MATERI KAMU DI SINI, contoh: Biologi Sel / Sejarah Kemerdekaan Indonesia]

Keluarkan HANYA format JSON murni yang valid tanpa pengantar ataupun penutup markdown, persis seperti format ini:
${SAMPLE_QUIZ_JSON}`;

  const flashcardPrompt = `Buatkan flashcard tanya-jawab 10 kartu tentang: [TULIS MATERI KAMU DI SINI, contoh: Kosakata JLPT N5]

Keluarkan HANYA format JSON murni yang valid persis seperti format ini:
${SAMPLE_DECK_JSON}`;

  const activePrompt = guideMode === 'quiz' ? quizPrompt : flashcardPrompt;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(activePrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-4 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-sm">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                Impor Dek & Kuis via JSON ⚡
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Buat dek flashcard atau kuis pilihan ganda secara otomatis
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

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleLoadQuizSample}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-xl transition-colors border border-emerald-200 dark:border-emerald-800"
                  title="Isi contoh JSON soal kuis pilihan ganda"
                >
                  <ListChecks className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Contoh Kuis</span>
                </button>

                <button
                  type="button"
                  onClick={handleLoadFlashcardSample}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-xl transition-colors border border-indigo-200 dark:border-indigo-800"
                  title="Isi contoh JSON flashcard tanya jawab"
                >
                  <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Contoh Flashcard</span>
                </button>
              </div>
            </div>

            {/* Textarea */}
            <div>
              <textarea
                rows={9}
                value={jsonText}
                onChange={e => setJsonText(e.target.value)}
                placeholder={`Tempel kode JSON di sini...\n\nContoh Soal Kuis:\n{\n  "title": "Kuis Sains",\n  "questions": [\n    {\n      "question": "Berapa 10 x 10?",\n      "options": ["50", "100", "150", "200"],\n      "answer": "100",\n      "explanation": "10 dikali 10 sama dengan 100."\n    }\n  ]\n}`}
                className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
              />
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
              💡 <em>Mendukung dua mode:</em> <strong>Soal Kuis</strong> (dengan <code>options</code> &amp; <code>explanation</code>) atau <strong>Flashcard</strong> (dengan <code>front</code> &amp; <code>back</code>).
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
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-900/80 p-1 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
              <button
                onClick={() => setGuideMode('quiz')}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  guideMode === 'quiz'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <ListChecks className="w-3.5 h-3.5" />
                <span>Format Soal Kuis (Pilihan Ganda)</span>
              </button>
              <button
                onClick={() => setGuideMode('flashcard')}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  guideMode === 'flashcard'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Format Flashcard Biasa</span>
              </button>
            </div>

            {/* Guide Content: QUIZ */}
            {guideMode === 'quiz' ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    Struktur JSON Soal Kuis (Pilihan Ganda)
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

                {/* Explanation of keys */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl space-y-1.5 text-[11px] border border-slate-200 dark:border-slate-800">
                  <p className="font-bold text-slate-800 dark:text-slate-200">Keterangan Properti Soal Kuis:</p>
                  <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1 pl-1">
                    <li><code>question</code> (Wajib): Kalimat pertanyaan / soal kuis.</li>
                    <li><code>options</code> (Wajib): Array berisi 4 pilihan jawaban yang akan muncul di layar.</li>
                    <li><code>answer</code> (Wajib): Jawaban yang benar. Bisa dituliskan <strong>teks jawabannya langsung</strong> (contoh: <code>&quot;Jakarta&quot;</code>), atau huruf (contoh: <code>&quot;A&quot;</code>), atau index angka (contoh: <code>0</code>).</li>
                    <li><code>explanation</code> (Opsional): Pembahasan detail yang muncul saat soal dijawab &amp; di evaluasi akhir.</li>
                  </ul>
                </div>
              </div>
            ) : (
              /* Guide Content: FLASHCARD */
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    Struktur JSON Flashcard (Tanya - Jawab)
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
            <div className="p-3.5 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-200 dark:border-indigo-900/60 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-900 dark:text-indigo-200 text-xs flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Minta ChatGPT Buatkan Soal Otomatis
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
                Salin prompt di atas ke ChatGPT untuk membuat soal kuis topik apa pun. Setelah ChatGPT membalas, copy hasilnya dan paste di tab <strong>Tempel / Unggah JSON</strong>!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
