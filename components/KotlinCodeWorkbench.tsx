'use client';

import React, {useState} from 'react';
import {
  Copy,
  Check,
  Download,
  FileCode2,
  FolderGit2,
  CheckCircle2,
  Search,
} from 'lucide-react';
import {
  KOTLIN_PROJECT_FILES,
  KotlinProjectFile,
} from '@/lib/kotlin-project-data';

const CATEGORIES: Array<KotlinProjectFile['category'] | 'Tous les fichiers'> = [
  'Tous les fichiers',
  'Configuration & Manifest',
  'Service Overlay & Compose',
  'Extraction UI & OCR Fallback',
  'Moteur Audio Sherpa-ONNX',
];

export default function KotlinCodeWorkbench() {
  const [selectedCategory, setSelectedCategory] = useState<
    KotlinProjectFile['category'] | 'Tous les fichiers'
  >('Tous les fichiers');
  const [selectedFileId, setSelectedFileId] = useState<string>(
    KOTLIN_PROJECT_FILES[5].id // FishOverlayService.kt by default
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredFiles = KOTLIN_PROJECT_FILES.filter((file) => {
    const matchesCategory =
      selectedCategory === 'Tous les fichiers' ||
      file.category === selectedCategory;
    const matchesQuery =
      searchQuery.trim() === '' ||
      file.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const activeFile =
    filteredFiles.find((f) => f.id === selectedFileId) ||
    filteredFiles[0] ||
    KOTLIN_PROJECT_FILES[0];

  const handleCopyCode = async (file: KotlinProjectFile) => {
    try {
      await navigator.clipboard.writeText(file.code);
      setCopiedId(file.id);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback copy
    }
  };

  const handleDownloadCurrentFile = (file: KotlinProjectFile) => {
    const blob = new Blob([file.code], {type: 'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.filename.replace(/\s+\(.*\)/, '');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportFullBundle = () => {
    const bundleContent = KOTLIN_PROJECT_FILES.map(
      (f) =>
        `================================================================================\nFILE: ${f.path}\nSUMMARY: ${f.summary}\n================================================================================\n\n${f.code}\n\n`
    ).join('\n');

    const blob = new Blob([bundleContent], {type: 'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'FishReader_Android_Kotlin_Project_Complete.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const codeLines = activeFile.code.split('\n');

  return (
    <div className="space-y-6">
      {/* Category Filter Bar + Search + Export Full Project */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#111827] border border-slate-800 rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORIES.map((category) => {
            const active = selectedCategory === category;
            return (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category);
                  const firstMatch = KOTLIN_PROJECT_FILES.find(
                    (f) =>
                      category === 'Tous les fichiers' ||
                      f.category === category
                  );
                  if (firstMatch) setSelectedFileId(firstMatch.id);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-cyan-500 text-slate-950 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher classe, API..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#0B0F17] border border-slate-800 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            onClick={handleExportFullBundle}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-100 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Télécharger Tout (10 fichiers)</span>
          </button>
        </div>
      </div>

      {/* Main Code Explorer Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar : File List */}
        <div className="lg:col-span-4 bg-[#111827] border border-slate-800 rounded-2xl p-3 space-y-1.5">
          <div className="px-2.5 py-2 flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 mb-1">
            <span className="flex items-center gap-1.5 font-medium text-slate-200">
              <FolderGit2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Arborescence Clean Architecture</span>
            </span>
            <span className="font-mono tabular-nums">
              {filteredFiles.length} fichiers
            </span>
          </div>

          {filteredFiles.map((file) => {
            const isSelected = file.id === activeFile.id;
            return (
              <button
                key={file.id}
                onClick={() => setSelectedFileId(file.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-cyan-950/35 border-cyan-500/60 text-white'
                    : 'bg-[#0B0F17]/60 border-transparent text-slate-300 hover:bg-slate-900 hover:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileCode2
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? 'text-cyan-400' : 'text-slate-400'
                      }`}
                    />
                    <span className="text-xs font-mono font-semibold truncate">
                      {file.filename}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono uppercase shrink-0">
                    {file.language}
                  </span>
                </div>
                <div className="mt-1 text-[11px] font-mono text-slate-400 truncate">
                  {file.path}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Area : Active File Details + Full Code Viewer */}
        <div className="lg:col-span-8 bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden">
          {/* File Header & Architectural Highlights */}
          <div className="p-5 border-b border-slate-800 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs font-mono text-cyan-400">
                  {activeFile.path}
                </div>
                <h3 className="text-lg font-semibold text-white mt-0.5">
                  {activeFile.filename}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                  {activeFile.summary}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleDownloadCurrentFile(activeFile)}
                  className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Fichier</span>
                </button>

                <button
                  onClick={() => handleCopyCode(activeFile)}
                  className="px-3.5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-xs font-semibold text-slate-950 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                >
                  {copiedId === activeFile.id ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copier le code</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Key Production Takeaways */}
            <div className="bg-[#0B0F17] border border-slate-800/90 rounded-xl p-3.5 space-y-1.5">
              <div className="text-xs font-semibold text-slate-200 mb-1">
                Points d&apos;ingénierie clés dans ce fichier :
              </div>
              {activeFile.keyTakeaways.map((point, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 text-xs text-slate-300"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Monospace Code Content with Tabular Line Numbers */}
          <div className="bg-[#080B11] overflow-x-auto max-h-[640px] overflow-y-auto p-4 font-mono text-xs leading-relaxed">
            <table className="w-full border-collapse">
              <tbody>
                {codeLines.map((line, i) => (
                  <tr
                    key={i}
                    className="hover:bg-slate-900/60 transition-colors"
                  >
                    <td className="select-none pr-4 text-right text-slate-600 tabular-nums w-10 align-top">
                      {i + 1}
                    </td>
                    <td className="text-slate-200 whitespace-pre">
                      {line || ' '}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
