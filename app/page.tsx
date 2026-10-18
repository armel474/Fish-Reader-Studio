'use client';

import React from 'react';
import {Download, CheckCircle2, ArrowRight} from 'lucide-react';
import AndroidOverlaySimulator from '@/components/AndroidOverlaySimulator';
import ProsodyAndMobileDeploySection from '@/components/ProsodyAndMobileDeploySection';
import KotlinCodeWorkbench from '@/components/KotlinCodeWorkbench';
import HeuristicLabSection from '@/components/HeuristicLabSection';
import {
  KOTLIN_PROJECT_FILES,
  INTEGRATION_STEPS,
} from '@/lib/kotlin-project-data';

export default function FishReaderStudioPage() {
  const handleDownloadFullProject = () => {
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

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F17] text-slate-100">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-8 px-6 lg:px-10 py-4 bg-[#0B0F17]/90 backdrop-blur-md border-b border-slate-800/80">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0"
        >
          FishReader Studio
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <a
            href="#simulateur"
            className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Simulateur &amp; App Mobile
          </a>
          <a
            href="#prosodie-apk"
            className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Prosodie &amp; Test Téléphone
          </a>
          <a
            href="#code-kotlin"
            className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Code Kotlin (11 fichiers)
          </a>
          <a
            href="#heuristiques"
            className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Pipeline Heuristique
          </a>
          <a
            href="#guide-integration"
            className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Guide Android Studio
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            onClick={handleDownloadFullProject}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-500 hover:bg-cyan-400 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter le Projet Kotlin</span>
          </button>
        </div>
      </header>

      {/* Main Content Container (1440px Desktop Presence) */}
      <main
        id="top"
        className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-10 py-10 space-y-20"
      >
        {/* Hero Section */}
        <section className="space-y-6">
          {/* Clean Unboxed Metadata (Zero-Pill Discipline) */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono">
            <span className="text-cyan-400 font-medium">
              Android API 30+ (Android 11 à 15)
            </span>
            <span aria-hidden="true">·</span>
            <span>Piper VITS Medium/High (22.05 kHz)</span>
            <span aria-hidden="true">·</span>
            <span>Contrôle Vitesse (0.75x–1.50x) &amp; Pitch</span>
            <span aria-hidden="true">·</span>
            <span>Installation APK Directe (Sans Play Store)</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8 space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.12] text-balance">
                FishReader : Overlay Android, Rythme Prosodique VITS &amp;
                Installation Directe sur Mobile
              </h1>
              <p className="text-base text-slate-300 max-w-3xl leading-relaxed">
                Application mobile Material 3 et superposition système
                escamotable propulsées par{' '}
                <code className="font-mono text-cyan-300">
                  SherpaOnnxTtsManager.kt
                </code>{' '}
                et{' '}
                <code className="font-mono text-cyan-300">
                  ProsodyRhythmEngine.kt
                </code>
                . Inclut le réglage en direct de la vitesse de lecture (
                <code className="font-mono text-cyan-300">0.75x à 1.50x</code>),
                du pitch en demi-tons, les modèles{' '}
                <code className="font-mono text-cyan-300">
                  fr_FR-siwis-medium
                </code>{' '}
                et{' '}
                <code className="font-mono text-cyan-300">
                  en_US-lessac-high
                </code>
                , ainsi que le guide d&apos;installation APK sur votre téléphone
                sans passer par le Play Store.
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-wrap lg:justify-end gap-3">
              <a
                href="#prosodie-apk"
                className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
              >
                <span>Prosodie &amp; Installer sur mon Téléphone</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#code-kotlin"
                className="px-4 py-2.5 rounded-xl bg-[#111827] hover:bg-slate-800 border border-slate-700 text-slate-100 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap shrink-0"
              >
                Voir les 11 fichiers Kotlin
              </a>
            </div>
          </div>

          {/* 4-Column Architectural KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-800/80">
            <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-4">
              <div className="text-xs text-slate-400">
                Modèles Piper VITS Medium &amp; High
              </div>
              <div className="text-2xl font-bold font-mono text-white mt-1 tabular-nums">
                22 050 Hz
              </div>
              <div className="text-xs text-slate-400 mt-1">
                192 canaux latents · SIWIS &amp; Lessac High
              </div>
            </div>

            <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-4">
              <div className="text-xs text-slate-400">
                Vitesse &amp; Pitch Indépendants
              </div>
              <div className="text-2xl font-bold font-mono text-white mt-1 tabular-nums">
                0.75x – 1.50x
              </div>
              <div className="text-xs text-slate-400 mt-1">
                VITS Length Scale + AudioTrack Pitch
              </div>
            </div>

            <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-4">
              <div className="text-xs text-slate-400">
                Installation sur Téléphone
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1 tabular-nums">
                Sans Store
              </div>
              <div className="text-xs text-slate-400 mt-1">
                APK Direct, QR Code Wi-Fi ou Cloud GitHub
              </div>
            </div>

            <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-4">
              <div className="text-xs text-slate-400">
                Confidentialité &amp; Réseau
              </div>
              <div className="text-2xl font-bold font-mono text-cyan-400 mt-1 tabular-nums">
                100 % Local
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Aucune permission INTERNET dans le Manifest
              </div>
            </div>
          </div>
        </section>

        {/* Section 01: Interactive Android Simulator (Overlay + Mobile App UI) */}
        <section id="simulateur" className="scroll-mt-24 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <div className="text-xs font-mono text-cyan-400">
              01. Simulateur Interactif : Bulle Overlay + Interface Mobile
              Material 3
            </div>
            <h2 className="text-2xl font-bold text-white mt-1">
              Testez le Widget Flottant, l&apos;Application Mobile FishReader et
              la Vitesse de Lecture
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              Utilisez le bouton <strong>« App Mobile FishReader »</strong> en
              haut du téléphone simulé pour explorer la nouvelle interface
              mobile Android (<code className="font-mono text-cyan-300">MainActivity.kt</code>
              ) avec ses 3 onglets, ou restez sur{' '}
              <strong>« Bulle Overlay Active »</strong> pour changer la vitesse
              directement depuis la bulle flottante.
            </p>
          </div>

          <AndroidOverlaySimulator />
        </section>

        {/* Section 02: Prosody Rhythm Studio, High-Fidelity Piper Models & Direct Phone Installation */}
        <section id="prosodie-apk" className="scroll-mt-24 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <div className="text-xs font-mono text-cyan-400">
              02. Rythme Prosodique Sherpa-ONNX, Modèles VITS High/Medium &amp;
              Test sur votre Téléphone
            </div>
            <h2 className="text-2xl font-bold text-white mt-1">
              Calibrage Vitesse / Pitch et Installation sur Mobile sans Google
              Play Store
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              Ajustez les paramètres de{' '}
              <code className="font-mono text-cyan-300">
                SherpaOnnxTtsManager.kt
              </code>{' '}
              et{' '}
              <code className="font-mono text-cyan-300">
                ProsodyRhythmEngine.kt
              </code>
              , découvrez comment configurer les modèles haute fidélité dans{' '}
              <code className="font-mono text-cyan-300">assets/models/</code>, et
              suivez les 3 méthodes gratuites pour installer{' '}
              <code className="font-mono text-cyan-300">app-debug.apk</code> sur
              votre smartphone.
            </p>
          </div>

          <ProsodyAndMobileDeploySection />
        </section>

        {/* Section 03: Complete Production Kotlin Codebase */}
        <section id="code-kotlin" className="scroll-mt-24 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <div className="text-xs font-mono text-cyan-400">
              03. Code Source Natif Prêt pour la Production (11 Fichiers)
            </div>
            <h2 className="text-2xl font-bold text-white mt-1">
              Code Kotlin Complet : TtsManager, ProsodyRhythmEngine,
              PiperModelAssetConfig, MainActivity &amp; Workflow APK
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              Inclut les nouveaux fichiers{' '}
              <code className="font-mono text-cyan-300">
                PiperModelAssetConfig.kt
              </code>
              ,{' '}
              <code className="font-mono text-cyan-300">
                ProsodyRhythmEngine.kt
              </code>
              ,{' '}
              <code className="font-mono text-cyan-300">
                SherpaOnnxTtsManager.kt
              </code>
              , la nouvelle interface mobile Material 3 dans{' '}
              <code className="font-mono text-cyan-300">MainActivity.kt</code>{' '}
              et le workflow GitHub Actions{' '}
              <code className="font-mono text-cyan-300">build-apk.yml</code>.
            </p>
          </div>

          <KotlinCodeWorkbench />
        </section>

        {/* Section 04: Interactive Heuristic Filter Lab */}
        <section id="heuristiques" className="scroll-mt-24 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <div className="text-xs font-mono text-cyan-400">
              04. Filtrage Heuristique &amp; Segmentation en Groupes de Souffle
            </div>
            <h2 className="text-2xl font-bold text-white mt-1">
              Laboratoire de test des règles de nettoyage d&apos;arborescence UI
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              Testez comment{' '}
              <code className="font-mono text-cyan-300">
                ScreenTextCleaner.kt
              </code>{' '}
              élimine les éléments parasites (barres système, compteurs de
              likes, horodatages courts, boutons d&apos;action) avant d&apos;envoyer
              les phrases au moteur prosodique.
            </p>
          </div>

          <HeuristicLabSection />
        </section>

        {/* Section 05: Step-by-Step Integration Guide */}
        <section id="guide-integration" className="scroll-mt-24 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <div className="text-xs font-mono text-cyan-400">
              05. Synthèse d&apos;Architecture &amp; Déploiement Mobile
            </div>
            <h2 className="text-2xl font-bold text-white mt-1">
              Récapitulatif des 4 étapes clés sur appareil physique
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {INTEGRATION_STEPS.map((step) => (
              <div
                key={step.number}
                className="bg-[#111827] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-cyan-400">
                      Étape {step.number}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {step.subtitle}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-white">
                    {step.title}
                  </h3>

                  <ul className="space-y-2 pt-1">
                    {step.details.map((detail, idx) => (
                      <li
                        key={idx}
                        className="text-xs sm:text-sm text-slate-300 leading-relaxed flex items-start gap-2.5"
                      >
                        <span className="font-mono text-cyan-400 text-xs mt-0.5">
                          •
                        </span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3 border-t border-slate-800/90 flex items-start gap-2 text-xs text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{step.verificationCheck}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-800/80 py-6 px-6 lg:px-10 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            FishReader Studio · Architecture Android Kotlin, Jetpack Compose,
            ML Kit OCR v2 &amp; Sherpa-ONNX Piper VITS High/Medium
          </div>
          <button
            onClick={handleDownloadFullProject}
            className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
          >
            Télécharger l&apos;archive complète du code Kotlin (.txt)
          </button>
        </div>
      </footer>
    </div>
  );
}
