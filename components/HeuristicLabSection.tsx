'use client';

import React, {useState} from 'react';
import {
  CheckCircle2,
  XCircle,
  Plus,
  RotateCcw,
  Filter,
  Sparkles,
} from 'lucide-react';

interface TestCandidateNode {
  id: string;
  className: string;
  text: string;
  topPx: number;
  isClickable: boolean;
}

const DEFAULT_TEST_NODES: TestCandidateNode[] = [
  {
    id: 't1',
    className: 'android.widget.TextView',
    text: '10:15 · 5G · Batterie 94%',
    topPx: 14,
    isClickable: false,
  },
  {
    id: 't2',
    className: 'android.widget.Button',
    text: "S'abonner",
    topPx: 68,
    isClickable: true,
  },
  {
    id: 't3',
    className: 'android.widget.TextView',
    text: 'Il y a 5 min',
    topPx: 110,
    isClickable: false,
  },
  {
    id: 't4',
    className: 'android.widget.TextView',
    text: "L'exécution locale de Piper TTS via Sherpa-ONNX élimine tout besoin de connexion réseau. La synthèse démarre dès la première phrase extraite.",
    topPx: 165,
    isClickable: false,
  },
  {
    id: 't5',
    className: 'android.widget.TextView',
    text: '24.5K likes',
    topPx: 290,
    isClickable: true,
  },
  {
    id: 't6',
    className: 'android.widget.TextView',
    text: "Lorsque l'arbre d'accessibilité est vide sur un Canvas ou un PDF, la méthode takeScreenshot d'Android 11 prend automatiquement le relais avec ML Kit v2.",
    topPx: 340,
    isClickable: false,
  },
];

function evaluateNodeWithKotlinHeuristics(
  node: TestCandidateNode,
  screenHeight = 800
): {accepted: boolean; ruleTriggered: string} {
  const topCutoff = Math.floor(screenHeight * 0.055); // 44px
  const bottomCutoff = Math.floor(screenHeight * 0.92); // 736px
  const candidate = node.text.trim();

  const ignoredClasses = [
    'android.widget.Button',
    'android.widget.ImageButton',
    'android.widget.CheckBox',
    'android.widget.Switch',
  ];

  const socialMetricRegex =
    /^(\d+[.,]?\d*\s*[kKmM]?|\d+[.,]?\d*\s*[kKmM]?\s*(likes?|j'aime|reposts?|partages?|vues?|views?|commentaires?))$/i;
  const relativeTimeRegex =
    /^(il y a \d+\s*(min|s|h|j)|\d+[smhdw]|just now|à l'instant|sponsored|sponsorisé|suivre|follow|s'abonner)$/i;

  if (node.topPx < topCutoff) {
    return {
      accepted: false,
      ruleTriggered: `Exclu (Géométrie) : top=${node.topPx}px < seuil StatusBar (${topCutoff}px)`,
    };
  }
  if (node.topPx > bottomCutoff) {
    return {
      accepted: false,
      ruleTriggered: `Exclu (Géométrie) : top=${node.topPx}px > seuil BottomNav (${bottomCutoff}px)`,
    };
  }
  if (candidate.length < 3 || ignoredClasses.includes(node.className)) {
    return {
      accepted: false,
      ruleTriggered: `Exclu (Classe Widget) : ${node.className} ignoré`,
    };
  }
  if (
    node.isClickable &&
    candidate.split(/\s+/).length <= 3 &&
    candidate.length < 24
  ) {
    return {
      accepted: false,
      ruleTriggered:
        'Exclu (Action courte cliquable) : isClickable=true et <= 3 mots',
    };
  }
  if (socialMetricRegex.test(candidate)) {
    return {
      accepted: false,
      ruleTriggered:
        'Exclu (Regex Compteur Social) : correspond à socialMetricRegex',
    };
  }
  if (relativeTimeRegex.test(candidate)) {
    return {
      accepted: false,
      ruleTriggered:
        'Exclu (Regex Horodatage) : correspond à relativeTimestampRegex',
    };
  }

  return {
    accepted: true,
    ruleTriggered: `Retenu (Corps informatif pertinent · ${candidate.length} caractères)`,
  };
}

export default function HeuristicLabSection() {
  const [nodes, setNodes] = useState<TestCandidateNode[]>(DEFAULT_TEST_NODES);
  const [newText, setNewText] = useState<string>(
    "Les modèles ONNX quantifiés en 8 bits offrent une qualité vocale naturelle tout en préservant l'autonomie de la batterie."
  );
  const [newClass, setNewClass] = useState<string>('android.widget.TextView');
  const [newTopPx, setNewTopPx] = useState<number>(420);
  const [newClickable, setNewClickable] = useState<boolean>(false);

  const handleAddNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    const created: TestCandidateNode = {
      id: `custom-${Date.now()}`,
      className: newClass,
      text: newText.trim(),
      topPx: newTopPx,
      isClickable: newClickable,
    };
    setNodes((prev) => [...prev, created]);
    setNewText('');
  };

  const evaluated = nodes.map((n) => ({
    node: n,
    verdict: evaluateNodeWithKotlinHeuristics(n, 800),
  }));

  const acceptedSentences = evaluated
    .filter((item) => item.verdict.accepted)
    .sort((a, b) => a.node.topPx - b.node.topPx)
    .flatMap((item) =>
      item.node.text
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length >= 4)
    );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left 7 Cols : Node List + Custom Node Tester */}
      <div className="lg:col-span-7 bg-[#111827] border border-slate-800 rounded-2xl p-5 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Filter className="w-4 h-4 text-cyan-400" />
              <span>
                Banc d&apos;essai interactif de{' '}
                <code className="font-mono text-cyan-300">
                  ScreenTextCleaner.kt
                </code>
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ajoutez un nœud{' '}
              <code className="font-mono text-slate-300">
                AccessibilityNodeInfo
              </code>{' '}
              personnalisé pour vérifier s&apos;il est transmis ou filtré avant
              Sherpa-ONNX.
            </p>
          </div>
          <button
            onClick={() => setNodes(DEFAULT_TEST_NODES)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réinitialiser</span>
          </button>
        </div>

        {/* Form to inject a custom AccessibilityNodeInfo */}
        <form
          onSubmit={handleAddNode}
          className="bg-[#0B0F17] border border-slate-800/90 rounded-xl p-4 space-y-3"
        >
          <div className="text-xs font-semibold text-slate-200">
            Simuler un nouveau nœud UI Android (hauteur d&apos;écran de référence :
            800 px)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Classe Android
              </label>
              <select
                value={newClass}
                onChange={(e) => setNewClass(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#111827] border border-slate-700 rounded-lg text-xs font-mono text-slate-100"
              >
                <option value="android.widget.TextView">
                  android.widget.TextView
                </option>
                <option value="android.widget.Button">
                  android.widget.Button
                </option>
                <option value="android.widget.ImageButton">
                  android.widget.ImageButton
                </option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Position verticale (bounds.top px)
              </label>
              <input
                type="number"
                min={0}
                max={800}
                value={newTopPx}
                onChange={(e) => setNewTopPx(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-[#111827] border border-slate-700 rounded-lg text-xs font-mono text-slate-100 tabular-nums"
              />
            </div>

            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newClickable}
                  onChange={(e) => setNewClickable(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500"
                />
                <span>isClickable = true</span>
              </label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Saisissez un texte (ex. '12.4K likes', 'Il y a 3 min', ou un paragraphe d'article)..."
              className="flex-1 px-3 py-2 bg-[#111827] border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-xs font-semibold text-slate-950 flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tester le nœud</span>
            </button>
          </div>
        </form>

        {/* Evaluated Nodes Table */}
        <div className="space-y-2">
          {evaluated.map(({node, verdict}) => (
            <div
              key={node.id}
              className={`p-3 rounded-xl border text-xs flex flex-col gap-1.5 ${
                verdict.accepted
                  ? 'bg-emerald-950/15 border-emerald-500/40'
                  : 'bg-rose-950/15 border-rose-500/30'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-slate-300">
                  {node.className} · top:{node.topPx}px · clickable:
                  {String(node.isClickable)}
                </span>
                <span
                  className={`font-mono font-semibold flex items-center gap-1 ${
                    verdict.accepted ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {verdict.accepted ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>RETENU</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      <span>REJETÉ</span>
                    </>
                  )}
                </span>
              </div>
              <div className="text-white font-medium">
                &ldquo;{node.text}&rdquo;
              </div>
              <div className="text-slate-400 font-mono text-[11px]">
                {verdict.ruleTriggered}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right 5 Cols : Resulting Segmented Sentences for Sherpa-ONNX */}
      <div className="lg:col-span-5 bg-[#111827] border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <h4 className="text-base font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Sortie BreakIterator envoyée à OfflineTts.generate()</span>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Seuls les nœuds retenus sont triés par ordonnée{' '}
            <code className="font-mono text-slate-300">bounds.top</code> puis
            découpés en phrases unitaires pour garantir une latence &lt; 400 ms.
          </p>
        </div>

        <div className="space-y-2.5">
          {acceptedSentences.map((sentence, index) => (
            <div
              key={index}
              className="p-3.5 rounded-xl bg-[#0B0F17] border border-slate-800 flex items-start gap-3"
            >
              <span className="font-mono text-xs text-cyan-400 font-semibold tabular-nums mt-0.5">
                #{index + 1}
              </span>
              <div className="flex-1 space-y-1">
                <p className="text-xs sm:text-sm text-slate-100 leading-relaxed">
                  {sentence}
                </p>
                <div className="text-[11px] font-mono text-slate-500 tabular-nums">
                  {sentence.length} caractères · Latence synthèse estimée :{' '}
                  {Math.min(340, 110 + sentence.length * 1.4).toFixed(0)} ms
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
