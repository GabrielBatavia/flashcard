import React, { useState } from 'react';
import { 
  X, FileCode, Upload, Copy, Check, Sparkles, HelpCircle, 
  AlertCircle, ArrowRight, Wand2 
} from 'lucide-react';
import type { Flashcard, Deck } from '../types';
import { 
  parseFlexibleDeckJson, 
  SAMPLE_DECK_JSON, 
  SAMPLE_CARDS_JSON 
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
        onImportDeck({
          title: 'Dek Impor Baru',
          description: `Dek berisi ${result.cards.length} kartu`,
          cards: result.cards,
        });
        onClose();
      } else if (result.type === 'multi-deck') {
        if (onImportMultiDecks) {
          onImportMultiDecks(result.decks);
          onClose();
        } else {
          // If only single deck handler available, import first deck
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

  const handleLoadSample = () => {
    setJsonText(SAMPLE_DECK_JSON);
    setErrorMsg(null);
  };

  const handleCopyFormat = () => {
    navigator.clipboard.writeText(SAMPLE_DECK_JSON);
    setCopiedFormat(true);
    setTimeout(() => setCopiedFormat(false), 2000);
  };

  const chatGptPrompt = `Buatkan flashcard belajar dalam format JSON persis seperti ini:
${SAMPLE_DECK_JSON}

Tolong buatkan materi tentang: [TULIS MATERI KAMU DI SINI, contoh: 15 Kosakata TOEFL / Rumus Fisika SMA]`;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(chatGptPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-4 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-sm">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                Impor Dek Otomatis via JSON
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Buat dek langsung dari file atau teks JSON
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

        {/* Tab Toggle */}
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
            <div className="flex items-center justify-between gap-2">
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

              <button
                type="button"
                onClick={handleLoadSample}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-xl transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Isi Contoh Data</span>
              </button>
            </div>

            {/* Textarea */}
            <div>
              <textarea
                rows={9}
                value={jsonText}
                onChange={e => setJsonText(e.target.value)}
                placeholder={`Tempel kode JSON di sini...\n\nContoh:\n{\n  "title": "Nama Dek",\n  "cards": [\n    { "front": "Pertanyaan", "back": "Jawaban" }\n  ]\n}`}
                className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
              />
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
              💡 <em>Tips:</em> Kamu bisa menggunakan kunci <code>&quot;front&quot;</code>/<code>&quot;question&quot;</code> dan <code>&quot;back&quot;</code>/<code>&quot;answer&quot;</code>. Sistem akan otomatis mengenalinya!
            </p>

            <button
              type="button"
              onClick={() => processJson(jsonText)}
              disabled={!jsonText.trim()}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-40 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <span>Impor & Terapkan ke Dek</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TAB 2: FORMAT GUIDE */}
        {activeTab === 'guide' && (
          <div className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
            {/* Format 1: Full Deck */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-[10px]">
                    1
                  </span>
                  Format Lengkap Dek (Sangat Disarankan)
                </h4>
                <button
                  onClick={handleCopyFormat}
                  className="px-2.5 py-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg flex items-center gap-1 transition-colors"
                >
                  {copiedFormat ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedFormat ? 'Tersalin!' : 'Salin JSON'}</span>
                </button>
              </div>

              <div className="p-3 bg-slate-900 text-slate-100 rounded-2xl overflow-x-auto font-mono text-[11px] leading-relaxed">
                <pre>{SAMPLE_DECK_JSON}</pre>
              </div>

              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1 pl-1 text-[11px]">
                <li><code>title</code> (Wajib): Judul dek materi.</li>
                <li><code>description</code> (Opsional): Ringkasan materi.</li>
                <li><code>category</code> (Opsional): Bahasa, Sains, Kuliah, dll.</li>
                <li><code>cards</code> (Wajib): Daftar kartu di dalam dek:
                  <ul className="list-circle list-inside pl-4 mt-0.5 space-y-0.5">
                    <li><code>front</code>: Pertanyaan / istilah di sisi depan.</li>
                    <li><code>back</code>: Jawaban / penjelasan di sisi belakang.</li>
                    <li><code>hint</code>: Petunjuk bantuan (opsional).</li>
                  </ul>
                </li>
              </ul>
            </div>

            {/* Format 2: Cards Only */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700/80">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-[10px]">
                  2
                </span>
                Format Array Kartu Saja
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Kamu juga bisa langsung menempel array kartu saja tanpa judul dek:
              </p>
              <div className="p-3 bg-slate-900 text-slate-100 rounded-2xl overflow-x-auto font-mono text-[11px] leading-relaxed">
                <pre>{SAMPLE_CARDS_JSON}</pre>
              </div>
            </div>

            {/* Prompt ChatGPT Box */}
            <div className="p-3.5 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-200 dark:border-indigo-900/60 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-900 dark:text-indigo-200 text-xs flex items-center gap-1">
                  🤖 Siapkan Soal Otomatis Menggunakan ChatGPT
                </span>
                <button
                  onClick={handleCopyPrompt}
                  className="px-2.5 py-1 bg-white dark:bg-slate-800 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 rounded-lg shadow-sm flex items-center gap-1 hover:bg-slate-50 transition-colors"
                >
                  {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPrompt ? 'Prompt Tersalin!' : 'Salin Prompt'}</span>
                </button>
              </div>
              <p className="text-[11px] text-indigo-800/80 dark:text-indigo-300">
                Kamu tinggal salin format atau prompt di atas, lalu minta ChatGPT membuat materi belajar yang kamu mau. Hasilnya tinggal di-copy dan paste ke tab <strong>Tempel / Unggah JSON</strong>!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
