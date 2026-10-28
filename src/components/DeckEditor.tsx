import React, { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Save, FileText, Check, Palette, ListPlus, FileCode, Wand2 } from 'lucide-react';
import type { Deck, Flashcard } from '../types';
import { parseCsvCards } from '../utils/storage';
import { JsonImportModal } from './JsonImportModal';

interface DeckEditorProps {
  deck?: Deck | null; // null if creating new
  onSave: (deck: Deck) => void;
  onCancel: () => void;
}

const COLOR_PRESETS = [
  { label: 'Indigo Purple', value: 'from-indigo-500 to-purple-600' },
  { label: 'Blue Cyan', value: 'from-blue-500 to-cyan-600' },
  { label: 'Emerald Teal', value: 'from-emerald-500 to-teal-600' },
  { label: 'Amber Orange', value: 'from-amber-500 to-orange-600' },
  { label: 'Rose Pink', value: 'from-rose-500 to-pink-600' },
  { label: 'Violet Fuchsia', value: 'from-violet-500 to-fuchsia-600' },
];

export const DeckEditor: React.FC<DeckEditorProps> = ({
  deck,
  onSave,
  onCancel,
}) => {
  const [title, setTitle] = useState(deck?.title || '');
  const [description, setDescription] = useState(deck?.description || '');
  const [category, setCategory] = useState(deck?.category || 'Umum');
  const [color, setColor] = useState(deck?.color || COLOR_PRESETS[0].value);
  const [language, setLanguage] = useState(deck?.language);
  const [cards, setCards] = useState<Flashcard[]>(
    deck?.cards || [
      { id: 'c-1', front: '', back: '', hint: '', mastered: false },
      { id: 'c-2', front: '', back: '', hint: '', mastered: false },
    ]
  );
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [importNotification, setImportNotification] = useState<string | null>(null);

  const handleAddCard = () => {
    const newCard: Flashcard = {
      id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      front: '',
      back: '',
      hint: '',
      mastered: false,
    };
    setCards([...cards, newCard]);
  };

  const handleUpdateCard = (id: string, field: 'front' | 'back' | 'hint', value: string) => {
    setCards(prev =>
      prev.map(c => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleDeleteCard = (id: string) => {
    if (cards.length <= 1) {
      alert('Dek minimal memiliki 1 kartu.');
      return;
    }
    setCards(prev => prev.filter(c => c.id !== id));
  };

  const handleBulkImport = () => {
    if (!bulkText.trim()) return;
    const parsed = parseCsvCards(bulkText);
    if (parsed.length === 0) {
      alert('Tidak ada kartu yang berhasil dibaca. Pastikan format: Pertanyaan;Jawaban per baris.');
      return;
    }
    const newFlashcards: Flashcard[] = parsed.map((p, idx) => ({
      id: `bulk-${Date.now()}-${idx}`,
      front: p.front,
      back: p.back,
      mastered: false,
    }));

    // Filter out empty placeholder cards before adding bulk cards
    const existing = cards.filter(c => c.front.trim() || c.back.trim());
    setCards([...existing, ...newFlashcards]);
    setBulkText('');
    setBulkMode(false);
  };

  const handleImportFromModal = (deckData: {
    language?: string;
    title?: string;
    description?: string;
    category?: string;
    color?: string;
    cards: Flashcard[];
  }) => {
    setLanguage(deckData.language);
    if (deckData.title) setTitle(deckData.title);
    if (deckData.description) setDescription(deckData.description);
    if (deckData.category) setCategory(deckData.category);
    if (deckData.color) setColor(deckData.color);

    if (deckData.cards.length > 0) {
      setCards(deckData.cards);
    }

    setImportNotification(`Berhasil mengimpor ${deckData.cards.length} kartu dari JSON! Silakan tinjau dan klik Simpan Dek.`);
    setTimeout(() => setImportNotification(null), 5000);
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert('Judul dek tidak boleh kosong.');
      return;
    }

    const validCards = cards.filter(c => c.front.trim() && c.back.trim());
    if (validCards.length === 0) {
      alert('Dek harus memiliki minimal 1 kartu yang terisi (Pertanyaan dan Jawaban).');
      return;
    }

    const newDeck: Deck = {
      language,
      id: deck?.id || `deck-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      category: category.trim() || 'Umum',
      color,
      cards: validCards,
      createdAt: deck?.createdAt || Date.now(),
      updatedAt: Date.now(),
      quizHighScore: deck?.quizHighScore,
    };

    onSave(newDeck);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 pb-28 space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onCancel}
          className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Batal</span>
        </button>

        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
          {deck ? 'Edit Dek' : 'Buat Dek Baru'}
        </h2>

        <button
          onClick={handleSave}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm shadow-indigo-600/30 transition-all active:scale-95"
        >
          <Save className="w-4 h-4" />
          <span>Simpan</span>
        </button>
      </div>

      {/* Import Notification Banner */}
      {importNotification && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-800 dark:text-emerald-200 animate-fadeIn">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="font-medium">{importNotification}</span>
          </div>
          <button
            onClick={() => setImportNotification(null)}
            className="text-emerald-600 dark:text-emerald-400 hover:opacity-75 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Quick JSON Auto-Create Banner */}
      <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20">
            <Wand2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              Punya Data JSON (Flashcard atau Soal Kuis)?
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Isi otomatis judul, kategori, serta seluruh kartu dan soal pilihan ganda dari file atau teks JSON.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsJsonModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-600/20 transition-all active:scale-95 shrink-0"
        >
          <FileCode className="w-4 h-4" />
          <span>⚡ Impor dari JSON</span>
        </button>
      </div>

      {/* Deck Metadata Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Judul Dek *
          </label>
          <input
            aria-label="Judul dek"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Contoh: Rumus Fisika SMA, Kosakata JLPT N4..."
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Deskripsi (Opsional)
          </label>
          <textarea
            aria-label="Deskripsi dek"
            rows={2}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Keterangan singkat tentang apa yang dipelajari di dek ini..."
            className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Kategori
            </label>
            <input
              aria-label="Kategori dek"
              type="text"
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="Bahasa, Sains, Teknologi, dsb."
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
              <Palette className="w-3.5 h-3.5" /> Tema Warna
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {COLOR_PRESETS.map(preset => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setColor(preset.value)}
                  aria-pressed={color === preset.value}
                  className={`w-11 h-11 shrink-0 rounded-full bg-gradient-to-r ${preset.value} flex items-center justify-center transition-transform ${
                    color === preset.value ? 'scale-110 ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-800' : 'opacity-80 hover:opacity-100'
                  }`}
                  title={preset.label}
                >
                  {color === preset.value && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cards Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span>Daftar Kartu</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {cards.length}
          </span>
        </h3>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsJsonModalOpen(true)}
            className="px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <FileCode className="w-3.5 h-3.5 text-indigo-500" />
            <span>Impor JSON</span>
          </button>

          <button
            type="button"
            onClick={() => setBulkMode(!bulkMode)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-500" />
            <span>{bulkMode ? 'Tutup Salin Cepat' : 'Tempel Massal (CSV)'}</span>
          </button>

          <button
            type="button"
            onClick={handleAddCard}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Kartu</span>
          </button>
        </div>
      </div>

      {/* Bulk Add Box (Optional) */}
      {bulkMode && (
        <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
              <ListPlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Salin-Tempel Massal (Dari ChatGPT / Excel / Catatan)
            </h4>
          </div>
          <p className="text-[11px] text-indigo-800/80 dark:text-indigo-300">
            Tulis atau tempel per baris format: <code>Pertanyaan;Jawaban</code> (bisa menggunakan titik koma <code>;</code>, tab, atau pipa <code>|</code>)
          </p>
          <textarea
            rows={5}
            value={bulkText}
            onChange={e => setBulkText(e.target.value)}
            placeholder={`Apple;Apel\nBook;Buku\nComputer;Komputer`}
            className="w-full p-3 font-mono text-xs bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={handleBulkImport}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
          >
            Tambahkan ke Daftar Kartu
          </button>
        </div>
      )}

      {/* Individual Cards List */}
      <div className="space-y-3">
        {cards.map((card, idx) => (
          <div
            key={card.id}
            className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                  #{idx + 1}
                </span>
                {card.type === 'quiz' || (card.options && card.options.length >= 2) ? (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    🎯 Soal Kuis {card.options ? `(${card.options.length} Opsi)` : ''}
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    🃏 Flashcard
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDeleteCard(card.id)}
                className="text-slate-400 hover:text-rose-500 p-1 rounded-lg transition-colors"
                title="Hapus Kartu"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Sisi Depan (Pertanyaan / Istilah) *
                </label>
                <textarea
                  aria-label={`Pertanyaan kartu ${idx + 1}`}
                  rows={2}
                  value={card.front}
                  onChange={e => handleUpdateCard(card.id, 'front', e.target.value)}
                  placeholder="Contoh: Photosynthesis"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Sisi Belakang (Jawaban / Definisi) *
                </label>
                <textarea
                  rows={2}
                  value={card.back}
                  aria-label={`Jawaban kartu ${idx + 1}`}
                  onChange={e => handleUpdateCard(card.id, 'back', e.target.value)}
                  placeholder="Contoh: Proses tumbuhan mengubah cahaya menjadi energi kimia."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <input
                type="text"
                value={card.hint || ''}
                onChange={e => handleUpdateCard(card.id, 'hint', e.target.value)}
                placeholder="Petunjuk opsional (muncul saat tombol bantuan ditekan)..."
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {card.options && card.options.length >= 2 && (
              <div className="text-[11px] bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Pilihan Jawaban Kuis:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {card.options.map((opt, oIdx) => (
                    <span
                      key={oIdx}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${
                        opt === card.back
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {String.fromCharCode(65 + oIdx)}. {opt} {opt === card.back && '✓'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {card.explanation && (
              <div className="text-[11px] bg-indigo-50/50 dark:bg-indigo-950/30 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/40 text-slate-700 dark:text-slate-300">
                <strong className="text-indigo-700 dark:text-indigo-400">Pembahasan: </strong>
                {card.explanation}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom Add Card Button */}
      <button
        type="button"
        onClick={handleAddCard}
        className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Tambah Kartu Berikutnya
      </button>

      {/* Floating Save on Mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 max-w-2xl mx-auto z-30 pb-safe">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
        >
          <Save className="w-4 h-4" />
          Simpan Dek
        </button>
      </div>

      {/* JSON Import Modal */}
      <JsonImportModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        onImportDeck={handleImportFromModal}
      />
    </div>
  );
};
