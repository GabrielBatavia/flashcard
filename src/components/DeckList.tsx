import React, { useState, useMemo } from 'react';
import { Search, Plus, Trophy, CheckCircle2, Play, Sparkles, MoreVertical, Edit3, Trash2, FileText, DownloadCloud } from 'lucide-react';
import type { Deck } from '../types';

interface DeckListProps {
  decks: Deck[];
  onSelectDeck: (deck: Deck, mode: 'flashcards' | 'quiz') => void;
  onEditDeck: (deck: Deck) => void;
  onCreateDeck: () => void;
  onDeleteDeck: (deckId: string) => void;
  onOpenImportExport: () => void;
}

export const DeckList: React.FC<DeckListProps> = ({
  decks,
  onSelectDeck,
  onEditDeck,
  onCreateDeck,
  onDeleteDeck,
  onOpenImportExport,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [menuOpenDeckId, setMenuOpenDeckId] = useState<string | null>(null);

  // Extract categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    decks.forEach(d => {
      if (d.category) set.add(d.category);
    });
    return ['Semua', ...Array.from(set)];
  }, [decks]);

  // Overall statistics
  const overallStats = useMemo(() => {
    let totalCards = 0;
    let masteredCards = 0;
    decks.forEach(deck => {
      totalCards += deck.cards.length;
      masteredCards += deck.cards.filter(c => c.mastered).length;
    });
    const percentage = totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0;
    return { totalCards, masteredCards, percentage };
  }, [decks]);

  // Filtered decks
  const filteredDecks = useMemo(() => {
    return decks.filter(deck => {
      const matchCategory = selectedCategory === 'Semua' || deck.category === selectedCategory;
      const matchSearch =
        deck.title.toLowerCase().includes(search.toLowerCase()) ||
        deck.description.toLowerCase().includes(search.toLowerCase()) ||
        deck.cards.some(
          c =>
            c.front.toLowerCase().includes(search.toLowerCase()) ||
            c.back.toLowerCase().includes(search.toLowerCase())
        );
      return matchCategory && matchSearch;
    });
  }, [decks, selectedCategory, search]);

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto px-4 pt-4">
      {/* Top Banner / Progress Summary */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white p-5 shadow-lg shadow-indigo-500/15">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="inline-block px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider bg-white/20 backdrop-blur-sm rounded-full mb-1.5">
              Ruang Belajar Cepat
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Siap Belajar Hari Ini? 🚀
            </h2>
            <p className="text-xs sm:text-sm text-indigo-100 mt-1 max-w-md">
              Gunakan Flashcard untuk mengingat konsep dan Kuis untuk menguji pemahamanmu secara interaktif.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10">
            <div>
              <p className="text-xs text-indigo-200">Kartu Dipahami</p>
              <p className="text-lg font-bold">
                {overallStats.masteredCards} <span className="text-xs font-normal text-indigo-200">/ {overallStats.totalCards} ({overallStats.percentage}%)</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
              🎯
            </div>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute -right-8 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Action Bar & Search */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari materi, kartu, atau kata kunci..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={onOpenImportExport}
            className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl shadow-sm transition-colors flex items-center gap-1.5 text-xs font-medium"
            title="Import / Export Data"
          >
            <DownloadCloud className="w-4 h-4 text-indigo-500" />
            <span className="hidden sm:inline">Cadangkan</span>
          </button>

          <button
            onClick={onCreateDeck}
            className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm shadow-indigo-600/30 transition-all flex items-center gap-1.5 text-xs font-semibold active:scale-95 flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Dek</span>
          </button>
        </div>

        {/* Categories Chips */}
        {categories.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Deck Grid */}
      {filteredDecks.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
            Tidak ada dek yang ditemukan
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {search ? `Tidak ada kartu yang cocok dengan "${search}". Coba kata kunci lain.` : 'Mulai buat dek flashcard pertamamu sekarang!'}
          </p>
          <button
            onClick={onCreateDeck}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Buat Dek Baru
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredDecks.map(deck => {
            const masteredCount = deck.cards.filter(c => c.mastered).length;
            const progress = deck.cards.length > 0 ? Math.round((masteredCount / deck.cards.length) * 100) : 0;
            const isMenuOpen = menuOpenDeckId === deck.id;

            return (
              <div
                key={deck.id}
                className="relative bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Color strip top */}
                <div className={`h-2.5 bg-gradient-to-r ${deck.color || 'from-indigo-500 to-purple-600'}`} />

                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Top row: Category & Menu */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {deck.category || 'Umum'}
                      </span>

                      <div className="relative">
                        <button
                          onClick={() => setMenuOpenDeckId(isMenuOpen ? null : deck.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          title="Opsi Dek"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                          <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 py-1 text-xs">
                            <button
                              onClick={() => {
                                setMenuOpenDeckId(null);
                                onEditDeck(deck);
                              }}
                              className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                              Edit Dek
                            </button>
                            <button
                              onClick={() => {
                                setMenuOpenDeckId(null);
                                if (window.confirm(`Hapus dek "${deck.title}" beserta seluruh kartunya?`)) {
                                  onDeleteDeck(deck.id);
                                }
                              }}
                              className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Hapus Dek
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {deck.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {deck.description || 'Tidak ada deskripsi.'}
                    </p>
                  </div>

                  {/* Progress & Stats Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                      <span className="flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        {masteredCount} / {deck.cards.length} Dipahami
                      </span>
                      {deck.quizHighScore !== undefined && (
                        <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                          <Trophy className="w-3.5 h-3.5" />
                          Skor: {deck.quizHighScore}%
                        </span>
                      )}
                    </div>

                    {/* Progress line */}
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <button
                      onClick={() => onSelectDeck(deck, 'flashcards')}
                      disabled={deck.cards.length === 0}
                      className="w-full py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Flashcard
                    </button>

                    <button
                      onClick={() => onSelectDeck(deck, 'quiz')}
                      disabled={deck.cards.length < 2}
                      title={deck.cards.length < 2 ? 'Minimal 2 kartu untuk kuis' : 'Mulai Kuis'}
                      className="w-full py-2.5 px-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-xs rounded-xl shadow-sm shadow-indigo-500/20 transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Mulai Kuis
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
