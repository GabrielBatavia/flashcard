import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Plus, ArrowUpRight, Ellipsis, Pencil, Trash2, Layers, Download, X, ListChecks, BookOpen, FileCode, Zap } from 'lucide-react';
import type { Deck } from '../types';
import { useDialog } from './useDialog';
import { usePresence } from './usePresence';

interface DeckListProps {
  decks: Deck[];
  onSelectDeck: (deck: Deck, mode: 'flashcards' | 'quiz' | 'hybrid' | 'handwriting') => void;
  onEditDeck: (deck: Deck) => void;
  onCreateDeck: () => void;
  onDeleteDeck: (deckId: string) => void;
  onOpenImportExport: () => void;
  onOpenJsonImport: () => void;
}

export function DeckList({ decks, onSelectDeck, onEditDeck, onCreateDeck, onDeleteDeck, onOpenImportExport, onOpenJsonImport }: DeckListProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Semua');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Deck | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { present: deletePresent, closing: deleteClosing } = usePresence(deleteOpen);
  const deleteRef = useDialog(deletePresent, () => setDeleteOpen(false));
  const menuRef = useRef<HTMLDivElement>(null);
  const categories = useMemo(() => ['Semua', ...new Set(decks.map(d => d.category).filter(Boolean))], [decks]);
  const total = decks.reduce((n, d) => n + d.cards.length, 0);
  const mastered = decks.reduce((n, d) => n + d.cards.filter(c => c.mastered).length, 0);
  const percent = total ? Math.round(mastered / total * 100) : 0;
  const filtered = decks.filter(d => (category === 'Semua' || category === d.category) && [d.title, d.description, ...d.cards.flatMap(c => [c.front, c.back])].some(text => text.toLocaleLowerCase().includes(search.toLocaleLowerCase())));

  useEffect(() => {
    if (!openMenu) return;
    const dismiss = (event: PointerEvent) => { if (!menuRef.current?.contains(event.target as Node)) setOpenMenu(null); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { menuRef.current?.querySelector('button')?.focus(); setOpenMenu(null); } };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', escape); };
  }, [openMenu]);

  return (
    <div className="library">
      <section className="library-heading" aria-labelledby="library-title">
        <div><p className="eyebrow">Sedikit demi sedikit, semakin paham.</p><h1 id="library-title">Waktunya belajar.</h1><p className="intro">Pilih materi. Balik kartunya. Ingat lebih banyak.</p></div>
        <div className="learning-progress">
          <svg viewBox="0 0 64 64" role="img" aria-label={`${percent}% kartu dipahami`}><circle className="ring-track" cx="32" cy="32" r="27" /><circle className="ring-value" cx="32" cy="32" r="27" pathLength="100" strokeDasharray={`${percent} 100`} /><text x="32" y="36" textAnchor="middle">{percent}%</text></svg>
          <div><strong>{mastered} <span>/ {total} kartu</span></strong><small>Sudah kamu pahami</small></div>
        </div>
      </section>

      <section aria-labelledby="collection-title">
        <div className="section-heading">
          <div><h2 id="collection-title">Koleksi materi <span>{decks.length}</span></h2><p>Satu dek, satu langkah lebih dekat.</p></div>
          <div className="desktop-create flex items-center gap-2">
            <button className="button secondary" onClick={onOpenJsonImport}><FileCode size={18} />Impor JSON</button>
            <button className="button primary" onClick={onCreateDeck}><Plus size={18} />Buat dek</button>
          </div>
        </div>
        <div className="collection-tools">
          <div className="search-field"><Search size={19} /><input aria-label="Cari materi atau isi kartu" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari materi atau isi kartu" />{search && <button className="icon-button" onClick={() => setSearch('')} aria-label="Hapus pencarian"><X size={16} /></button>}</div>
          <button className="button" aria-label="Impor JSON" onClick={onOpenJsonImport}><FileCode size={18} /><span>Impor JSON</span></button>
          <button className="button backup-button" aria-label="Cadangkan" onClick={onOpenImportExport}><Download size={18} /><span>Cadangkan</span></button>
        </div>
        <div className="category-tabs" aria-label="Kategori materi">{categories.map(cat => <button key={cat} aria-pressed={category === cat} className={cat === category ? 'selected' : ''} onClick={() => setCategory(cat)}>{cat}</button>)}</div>

        {filtered.length ? <div className="deck-grid">{filtered.map((deck, index) => {
          const count = deck.cards.filter(c => c.mastered).length;
          const progress = deck.cards.length ? Math.round(count / deck.cards.length * 100) : 0;
          const quizCount = deck.cards.filter(c => c.type === 'quiz' || (Array.isArray(c.options) && c.options.length >= 2)).length;
          const writingCount = deck.cards.filter(c => c.type === 'handwriting').length;
          const flashcardCount = deck.cards.length - quizCount - writingCount;
          const isHybrid = quizCount > 0 && flashcardCount > 0;
          return (
            <article className="deck-card" key={deck.id} style={{ animationDelay: `${Math.min(index, 5) * 40}ms` }}>
              <div className="deck-topline"><span className={`deck-symbol bg-gradient-to-br ${deck.color || 'from-blue-500 to-cyan-600'}`}><Layers size={23} /></span><span className="deck-category">{deck.category || 'Umum'}</span>
                <div className="deck-menu" ref={openMenu === deck.id ? menuRef : undefined}><button className="icon-button" aria-label={`Opsi ${deck.title}`} aria-expanded={openMenu === deck.id} onClick={() => setOpenMenu(openMenu === deck.id ? null : deck.id)}><Ellipsis size={22} /></button>
                  {openMenu === deck.id && <div className="menu-popover"><button onClick={() => { setOpenMenu(null); onEditDeck(deck); }}><Pencil size={16} />Edit dek</button><button className="danger" onClick={() => { setOpenMenu(null); setDeleteCandidate(deck); setDeleteOpen(true); }}><Trash2 size={16} />Hapus dek</button></div>}
                </div>
              </div>
              <div className="deck-copy">
                <span className="deck-index">
                  {isHybrid 
                    ? `${flashcardCount} Kartu • ${quizCount} Kuis (Gabungan)` 
                    : quizCount > 0 
                    ? `${quizCount} Soal Kuis` 
                    : `${deck.cards.length} kartu`}
                </span>
                <h3>{deck.title}</h3>
                <p>{deck.description || 'Materi siap untuk dipelajari.'}</p>
              </div>
              <div className="deck-progress"><div><span>{count} materi dipahami</span><span>{progress}%</span></div><progress max="100" value={progress} aria-label={`Pemahaman ${deck.title}`} /></div>
              {writingCount > 0 && <button className="button primary w-full mb-3" onClick={() => onSelectDeck(deck, 'handwriting')}><Pencil size={17} />Latihan menulis ({writingCount})</button>}
              {isHybrid ? (
                <div className="deck-actions-hybrid">
                  <button 
                    className="hybrid-primary-btn" 
                    disabled={!deck.cards.length} 
                    onClick={() => onSelectDeck(deck, 'hybrid')}
                    title="Mulai Mode Gabungan: Flashcard dan Kuis sesuai urutan alur"
                  >
                    <div className="flex items-center gap-2">
                      <Zap size={17} className="text-amber-500 fill-amber-500 shrink-0" />
                      <span className="font-bold">Mode Gabungan</span>
                    </div>
                    <span className="hybrid-tag">Alur Campuran</span>
                    <ArrowUpRight size={17} className="arrow-icon ml-auto opacity-70" />
                  </button>
                  <div className="deck-sub-actions">
                    <button 
                      className="sub-action-btn" 
                      disabled={flashcardCount === 0} 
                      onClick={() => onSelectDeck(deck, 'flashcards')}
                      title="Pelajari hanya kartu Flashcard"
                    >
                      <BookOpen size={15} />
                      <span>Flashcard ({flashcardCount})</span>
                    </button>
                    <button 
                      className="sub-action-btn" 
                      disabled={quizCount === 0} 
                      onClick={() => onSelectDeck(deck, 'quiz')}
                      title="Kerjakan hanya Kuis"
                    >
                      <ListChecks size={15} />
                      <span>Kuis ({quizCount})</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="deck-actions">
                  <button className="study-button" disabled={!flashcardCount} onClick={() => onSelectDeck(deck, 'flashcards')}>
                    <BookOpen size={17} />Pelajari<ArrowUpRight size={17} />
                  </button>
                  <button className="quiz-button" disabled={deck.cards.length - writingCount < 2} title={deck.cards.length - writingCount < 2 ? 'Tambahkan minimal 2 kartu non-menulis untuk kuis' : 'Mulai kuis'} onClick={() => onSelectDeck(deck, 'quiz')}>
                    <ListChecks size={17} />Kuis
                  </button>
                </div>
              )}
            </article>
          );
        })}</div> : <div className="empty-state"><Layers size={32} /><h3>{decks.length ? 'Materinya belum ketemu.' : 'Koleksi pertamamu dimulai di sini.'}</h3><p>{decks.length ? 'Coba kata kunci lain atau tampilkan semua kategori.' : 'Buat dek dan tambahkan hal yang ingin kamu ingat.'}</p><button className="button primary" onClick={decks.length ? () => { setSearch(''); setCategory('Semua'); } : onCreateDeck}>{decks.length ? 'Tampilkan semua materi' : 'Buat dek pertama'}</button></div>}
      </section>
      <p className="library-footnote">Materi dan progres tersimpan di perangkat ini.</p>
      {deletePresent && deleteCandidate && <div data-closing={deleteClosing} className="sheet-overlay fixed inset-0 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setDeleteOpen(false); }}>
        <div inert={deleteClosing} className="sheet-panel rounded-3xl w-full max-w-md border" ref={deleteRef} role="dialog" aria-modal="true" aria-labelledby="delete-title" tabIndex={-1}>
          <h2 id="delete-title" className="text-xl font-semibold">Hapus materi ini?</h2>
          <p className="mt-3 text-sm leading-relaxed">Dek “{deleteCandidate.title}” dan {deleteCandidate.cards.length} kartunya akan dihapus dari perangkat ini. Tindakan ini tidak dapat dibatalkan.</p>
          <div className="flex gap-3 mt-6"><button className="button flex-1" onClick={() => setDeleteOpen(false)}>Batal</button><button className="button danger flex-1" disabled={deleteClosing} onClick={() => { onDeleteDeck(deleteCandidate.id); setDeleteOpen(false); }}>Hapus dek</button></div>
        </div>
      </div>}
    </div>
  );
}
