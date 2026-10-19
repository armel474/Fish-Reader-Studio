'use client';

import React, {useState} from 'react';
import {
  Download,
  CheckCircle2,
  Smartphone,
  Code2,
  Palette,
} from 'lucide-react';
import CommercialMobileAppExperience from '@/components/CommercialMobileAppExperience';
import DesignerHandoffSection from '@/components/DesignerHandoffSection';
import AndroidOverlaySimulator from '@/components/AndroidOverlaySimulator';
import ProsodyAndMobileDeploySection from '@/components/ProsodyAndMobileDeploySection';
import KotlinCodeWorkbench from '@/components/KotlinCodeWorkbench';
import HeuristicLabSection from '@/components/HeuristicLabSection';
import {
  KOTLIN_PROJECT_FILES,
  INTEGRATION_STEPS,
} from '@/lib/kotlin-project-data';
import {
  FrThemeId,
  FR_THEMES,
  NB,
  FrSegmented,
} from '@/lib/fishreader-ds';

export default function FishReaderStudioPage() {
  const [workspaceMode, setWorkspaceMode] = useState<
    'COMMERCIAL_APP' | 'DESIGN_SYSTEM' | 'DEVELOPER_STUDIO'
  >('COMMERCIAL_APP');
  const [themeId, setThemeId] = useState<FrThemeId>('papier');
  const theme = FR_THEMES[themeId];

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
    <div
      className={`min-h-screen flex flex-col transition-colors duration-150 ${theme.paperBg} ${theme.inkText}`}
    >
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header
        className={`sticky top-0 z-40 flex items-center justify-between gap-8 px-6 lg:px-10 py-3.5 border-b ${theme.paperBg} ${theme.ruleBorder}`}
      >
        {/* Zone 1: Single text element wordmark in Literata */}
        <a
          href="#top"
          className={`font-[family-name:var(--font-serif)] font-semibold text-[20px] leading-[24px] tracking-tight whitespace-nowrap shrink-0 ${theme.inkText}`}
        >
          Fish Reader
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-[14px] font-semibold">
          <a
            href="#application-mobile"
            onClick={() => setWorkspaceMode('COMMERCIAL_APP')}
            className={`hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
              workspaceMode === 'COMMERCIAL_APP'
                ? theme.accentText
                : `${theme.inkMutedText} hover:${theme.inkText}`
            }`}
          >
            Maquettes Interactives
          </a>
          <a
            href="#cahier-design"
            onClick={() => setWorkspaceMode('DESIGN_SYSTEM')}
            className={`hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
              workspaceMode === 'DESIGN_SYSTEM'
                ? theme.accentText
                : `${theme.inkMutedText} hover:${theme.inkText}`
            }`}
          >
            Système de Design
          </a>
          <a
            href="#prosodie-apk"
            className={`hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${theme.inkMutedText} hover:${theme.inkText}`}
          >
            Voix &amp; APK
          </a>
          <a
            href="#espace-developpeur"
            onClick={() => setWorkspaceMode('DEVELOPER_STUDIO')}
            className={`hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
              workspaceMode === 'DEVELOPER_STUDIO'
                ? theme.accentText
                : `${theme.inkMutedText} hover:${theme.inkText}`
            }`}
          >
            Code Kotlin (13 fichiers)
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={handleDownloadFullProject}
            className={`min-h-[40px] px-4 rounded-[8px] text-[13px] font-semibold flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 active:translate-y-[1px] ${theme.accentBg} ${theme.onAccentText}`}
          >
            <Download className="w-4 h-4" strokeWidth={1.5} />
            <span>Exporter le projet Kotlin</span>
          </button>
        </div>
      </header>

      {/* Main Content Container (1440px Desktop Presence) */}
      <main
        id="top"
        className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-10 py-8 space-y-14"
      >
        {/* Hero Header + Editorial Theme Switcher + 3-Way Mode Switcher */}
        <section className={`border-b pb-8 space-y-6 ${theme.ruleBorder}`}>
          <div
            className={`flex flex-wrap items-center gap-2 text-[12px] leading-[18px] font-semibold uppercase tracking-[0.08em] ${theme.inkMutedText}`}
          >
            <span className={theme.accentText}>
              Design System · Papier, Sépia &amp; Nuit
            </span>
            <span aria-hidden="true">·</span>
            <span>Polices Literata &amp; Source Sans 3</span>
            <span aria-hidden="true">·</span>
            <span>Bulle flottante à 6 états</span>
            <span aria-hidden="true">·</span>
            <span>Architecture Android Jetpack Compose</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <h1
                className={`m-0 font-[family-name:var(--font-serif)] font-semibold text-[32px] sm:text-[40px] leading-[1.12] tracking-[-0.01em] text-balance ${theme.inkText}`}
              >
                Fish Reader — Lecteur vocal d’écran et bulle flottante Android
              </h1>
              <p
                className={`m-0 text-[16px] leading-[25px] ${theme.inkMutedText}`}
              >
                Explorez les deux maquettes de référence haute fidélité
                (l’application compagnon et la bulle flottante à 6 états avec
                sauts configurables en secondes ou en phrases), les jetons de
                design officiels et le code Kotlin prêt pour Android Studio.
              </p>
            </div>

            {/* Theme & Mode Controls */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
              {/* Theme Switcher: Papier / Sépia / Nuit */}
              <div className="w-full sm:w-[270px]">
                <FrSegmented
                  label="Thème de l’interface"
                  value={themeId}
                  onChange={setThemeId}
                  theme={theme}
                  columnsClass="grid-cols-3"
                  options={[
                    {value: 'papier', label: 'Papier'},
                    {value: 'sepia', label: 'Sépia'},
                    {value: 'nuit', label: 'Nuit'},
                  ]}
                />
              </div>

              {/* 3-Way Workspace Mode Switcher */}
              <div
                className={`inline-flex flex-wrap p-[3px] gap-[2px] rounded-[8px] border ${theme.paperRaisedBg} ${theme.ruleBorder}`}
              >
                <button
                  type="button"
                  onClick={() => setWorkspaceMode('COMMERCIAL_APP')}
                  className={`min-h-[40px] px-3.5 rounded-[6px] text-[13px] font-semibold flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                    workspaceMode === 'COMMERCIAL_APP'
                      ? `${theme.accentBg} ${theme.onAccentText}`
                      : `${theme.inkMutedText} hover:${theme.inkText}`
                  }`}
                >
                  <Smartphone className="w-4 h-4" strokeWidth={1.5} />
                  <span>Maquettes Interactives</span>
                </button>

                <button
                  type="button"
                  onClick={() => setWorkspaceMode('DESIGN_SYSTEM')}
                  className={`min-h-[40px] px-3.5 rounded-[6px] text-[13px] font-semibold flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                    workspaceMode === 'DESIGN_SYSTEM'
                      ? `${theme.accentBg} ${theme.onAccentText}`
                      : `${theme.inkMutedText} hover:${theme.inkText}`
                  }`}
                >
                  <Palette className="w-4 h-4" strokeWidth={1.5} />
                  <span>Système de Design &amp; Theme.kt</span>
                </button>

                <button
                  type="button"
                  onClick={() => setWorkspaceMode('DEVELOPER_STUDIO')}
                  className={`min-h-[40px] px-3.5 rounded-[6px] text-[13px] font-semibold flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                    workspaceMode === 'DEVELOPER_STUDIO'
                      ? `${theme.accentBg} ${theme.onAccentText}`
                      : `${theme.inkMutedText} hover:${theme.inkText}`
                  }`}
                >
                  <Code2 className="w-4 h-4" strokeWidth={1.5} />
                  <span>Studio Kotlin Android</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 1: Interactive Prototypes (Companion App + 6-State Bubble) */}
        {workspaceMode === 'COMMERCIAL_APP' && (
          <section id="application-mobile" className="scroll-mt-24">
            <CommercialMobileAppExperience
              themeId={themeId}
              onThemeChange={setThemeId}
              onOpenDeveloperStudio={() => {
                setWorkspaceMode('DEVELOPER_STUDIO');
                const el = document.getElementById('espace-developpeur');
                if (el) el.scrollIntoView({behavior: 'smooth'});
              }}
            />
          </section>
        )}

        {/* SECTION 2: Design System & Handoff Specifications */}
        {workspaceMode === 'DESIGN_SYSTEM' && (
          <section id="cahier-design" className="scroll-mt-24">
            <DesignerHandoffSection themeId={themeId} />
          </section>
        )}

        {/* Section 02: Voice Calibration & APK Installation */}
        <section id="prosodie-apk" className="scroll-mt-24 space-y-6">
          <div className={`border-b pb-4 ${theme.ruleBorder}`}>
            <div
              className={`text-[12px] leading-[18px] font-semibold uppercase tracking-[0.08em] ${theme.accentText}`}
            >
              02. Calibration Vocale &amp; Installation Mobile
            </div>
            <h2
              className={`m-0 mt-1 font-[family-name:var(--font-serif)] font-semibold text-[26px] leading-[32px] ${theme.inkText}`}
            >
              Installer Fish Reader sur votre téléphone Android et calibrer les
              voix
            </h2>
          </div>

          <div className="rounded-[14px] overflow-hidden bg-[#0B0F17] text-slate-100 p-6 border border-[#3A352E]">
            <ProsodyAndMobileDeploySection />
          </div>
        </section>

        {/* Section 03: Developer Studio & Full Kotlin Codebase */}
        <section id="espace-developpeur" className="scroll-mt-24 space-y-12">
          {workspaceMode === 'DEVELOPER_STUDIO' && (
            <div className="space-y-6">
              <div className={`border-b pb-4 ${theme.ruleBorder}`}>
                <div
                  className={`text-[12px] leading-[18px] font-semibold uppercase tracking-[0.08em] ${theme.accentText}`}
                >
                  Inspecteur Technique d’Arborescence Android
                </div>
                <h2
                  className={`m-0 mt-1 font-[family-name:var(--font-serif)] font-semibold text-[26px] leading-[32px] ${theme.inkText}`}
                >
                  Simulateur d’extraction AccessibilityNodeInfo &amp; Repli OCR
                  ML Kit
                </h2>
              </div>
              <div className="rounded-[14px] overflow-hidden bg-[#0B0F17] text-slate-100 p-6 border border-[#3A352E]">
                <AndroidOverlaySimulator />
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div className={`border-b pb-4 ${theme.ruleBorder}`}>
              <div
                className={`text-[12px] leading-[18px] font-semibold uppercase tracking-[0.08em] ${theme.accentText}`}
              >
                03. Code Source Android Natif Prêt pour la Production (13
                Fichiers Kotlin)
              </div>
              <h2
                className={`m-0 mt-1 font-[family-name:var(--font-serif)] font-semibold text-[26px] leading-[32px] ${theme.inkText}`}
              >
                Code Kotlin Complet{NB}: Theme.kt (Papier/Sépia/Nuit), Bulle
                Compose, Accessibilité &amp; TTS
              </h2>
            </div>

            <div className="rounded-[14px] overflow-hidden bg-[#0B0F17] text-slate-100 p-6 border border-[#3A352E]">
              <KotlinCodeWorkbench />
            </div>
          </div>

          {workspaceMode === 'DEVELOPER_STUDIO' && (
            <div className="space-y-6">
              <div className={`border-b pb-4 ${theme.ruleBorder}`}>
                <div
                  className={`text-[12px] leading-[18px] font-semibold uppercase tracking-[0.08em] ${theme.accentText}`}
                >
                  04. Filtrage Heuristique &amp; Découpage en Phrases
                </div>
                <h2
                  className={`m-0 mt-1 font-[family-name:var(--font-serif)] font-semibold text-[26px] leading-[32px] ${theme.inkText}`}
                >
                  Laboratoire de nettoyage d’arborescence UI
                </h2>
              </div>
              <div className="rounded-[14px] overflow-hidden bg-[#0B0F17] text-slate-100 p-6 border border-[#3A352E]">
                <HeuristicLabSection />
              </div>
            </div>
          )}
        </section>

        {/* Section 04: Step-by-Step Integration Guide */}
        <section id="guide-integration" className="scroll-mt-24 space-y-6">
          <div className={`border-b pb-4 ${theme.ruleBorder}`}>
            <div
              className={`text-[12px] leading-[18px] font-semibold uppercase tracking-[0.08em] ${theme.accentText}`}
            >
              04. Guide de Compilation &amp; Déploiement Mobile
            </div>
            <h2
              className={`m-0 mt-1 font-[family-name:var(--font-serif)] font-semibold text-[26px] leading-[32px] ${theme.inkText}`}
            >
              Récapitulatif des 4 étapes clés sur appareil physique
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {INTEGRATION_STEPS.map((step) => (
              <div
                key={step.number}
                className={`rounded-[14px] border p-6 flex flex-col justify-between space-y-4 ${theme.paperRaisedBg} ${theme.ruleBorder}`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[12px] font-semibold uppercase tracking-[0.08em] ${theme.accentText}`}
                    >
                      Étape {step.number}
                    </span>
                    <span
                      className={`text-[13px] tabular-nums ${theme.inkMutedText}`}
                    >
                      {step.subtitle}
                    </span>
                  </div>

                  <h3
                    className={`m-0 font-[family-name:var(--font-serif)] font-semibold text-[20px] leading-[26px] ${theme.inkText}`}
                  >
                    {step.title}
                  </h3>

                  <ul className="space-y-2 pt-1">
                    {step.details.map((detail, idx) => (
                      <li
                        key={idx}
                        className={`text-[14px] leading-[21px] flex items-start gap-2.5 ${theme.inkText}`}
                      >
                        <span className={`font-semibold ${theme.accentText}`}>
                          ·
                        </span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div
                  className={`pt-3 border-t flex items-start gap-2 text-[13px] ${theme.ruleBorder} ${theme.accentText}`}
                >
                  <CheckCircle2
                    className="w-4 h-4 shrink-0 mt-0.5"
                    strokeWidth={1.5}
                  />
                  <span>{step.verificationCheck}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Quiet Editorial Footer */}
      <footer className={`border-t py-6 px-6 lg:px-10 mt-12 ${theme.ruleBorder}`}>
        <div
          className={`max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] ${theme.inkMutedText}`}
        >
          <div>
            Fish Reader · Système de design éditorial (Papier, Sépia, Nuit) &amp;
            Architecture Android Kotlin
          </div>
          <button
            type="button"
            onClick={handleDownloadFullProject}
            className={`font-semibold hover:underline cursor-pointer ${theme.accentText}`}
          >
            Télécharger l’archive complète du code Kotlin (.txt)
          </button>
        </div>
      </footer>
    </div>
  );
}
