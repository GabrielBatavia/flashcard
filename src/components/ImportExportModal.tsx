import React, { useState } from 'react';
import { X, Download, Upload, Copy, Check, FileJson, AlertCircle } from 'lucide-react';
import type { Deck } from '../types';
import { exportDecksToJson, importDecksFromJson } from '../utils/storage';

interface ImportExportModalProps {
  decks: Deck[];
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (importedDecks: Deck[]) => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  decks,
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [jsonInput, setJsonInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const jsonString = exportDecksToJson(decks);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flashquiz-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const content = event.target?.result as string;
        const parsed = importDecksFromJson(content);
        onImportSuccess(parsed);
        onClose();
      } catch (err: unknown) {
        setErrorMsg((err as Error).message || 'Gagal memproses file backup.');
      }
    };
    reader.readAsText(file);
  };

  const handleImportText = () => {
    setErrorMsg(null);
    if (!jsonInput.trim()) return;
    try {
      const parsed = importDecksFromJson(jsonInput);
      onImportSuccess(parsed);
      onClose();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Format JSON tidak valid.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-5 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileJson className="w-5 h-5 text-indigo-500" />
            Cadangkan & Pulihkan Data
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-900 p-1 text-xs font-semibold">
          <button
            onClick={() => {
              setActiveTab('export');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === 'export'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Ekspor (Cadangkan)
          </button>
          <button
            onClick={() => {
              setActiveTab('import');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === 'import'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Impor (Pulihkan)
          </button>
        </div>

        {/* EXPORT TAB */}
        {activeTab === 'export' ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Semua dek dan kartu kamu ({decks.length} dek) dapat diunduh sebagai file cadangan JSON atau disalin ke clipboard untuk dipindahkan ke HP / perangkat lain.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownload}
                className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors active:scale-95"
              >
                <Download className="w-4 h-4" />
                Unduh JSON
              </button>

              <button
                onClick={handleCopy}
                className="py-2.5 px-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-95"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Tersalin!' : 'Salin JSON'}
              </button>
            </div>
          </div>
        ) : (
          /* IMPORT TAB */
          <div className="space-y-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Unggah file JSON atau tempel kode JSON cadangan kamu di bawah ini:
            </p>

            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block w-full py-3 px-4 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-xl text-center cursor-pointer transition-colors text-xs text-slate-600 dark:text-slate-300">
                <Upload className="w-5 h-5 mx-auto mb-1 text-indigo-500" />
                Pilih File JSON Cadangan
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="relative">
              <textarea
                rows={3}
                value={jsonInput}
                onChange={e => setJsonInput(e.target.value)}
                placeholder="Atau tempel teks JSON di sini..."
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              onClick={handleImportText}
              disabled={!jsonInput.trim()}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
            >
              Terapkan Impor JSON
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
