'use client';

import React from 'react';
import {
  Check,
  Volume2,
  Play,
  Pause,
  Square,
  Minus,
  Plus,
} from 'lucide-react';

export type FrThemeId = 'papier' | 'sepia' | 'nuit';
export type DeviceWidthId = '375' | '412' | '430';
export type BubbleShapeId = 'edge' | 'pill';
export type HostAppId = 'article' | 'mail' | 'pdf';
export type BubbleModeId =
  | 'idle'
  | 'menu'
  | 'scan'
  | 'reading'
  | 'pick'
  | 'hidden';

export const NB = '\u202F';
export const NBS = '\u00A0';

export const SPEEDS: number[] = [0.75, 1, 1.15, 1.25, 1.5];
export const SEC_PER_CHAR = 0.065;

export function fmtSpeed(v: number): string {
  return (Math.round(v * 100) / 100).toString().replace('.', ',') + '×';
}

export function fmtTime(s: number): string {
  const clamped = Math.max(0, Math.round(s));
  return (
    Math.floor(clamped / 60) + ':' + String(clamped % 60).padStart(2, '0')
  );
}

export function splitTextIntoParagraphs(raw: string): string[][] {
  return raw
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .map((p) =>
      (p.match(/[^.!?…]+[.!?…]+[»"”)]*|[^.!?…]+$/g) || [p])
        .map((s) => s.trim())
        .filter(Boolean)
    );
}

export interface FrThemePalette {
  id: FrThemeId;
  label: string;
  hex: {
    paper: string;
    paperRaised: string;
    ink: string;
    inkMuted: string;
    rule: string;
    accent: string;
    onAccent: string;
    highlight: string;
    danger: string;
  };
  paperBg: string;
  paperRaisedBg: string;
  inkText: string;
  inkMutedText: string;
  ruleBorder: string;
  ruleBg: string;
  accentBg: string;
  accentText: string;
  accentBorder: string;
  onAccentText: string;
  highlightBg: string;
  highlightRing: string;
  dangerText: string;
  dangerBorder: string;
  dangerBgHover: string;
  dangerFillBg: string;
  inkBg: string;
  paperText: string;
  inkMutedBorder: string;
  chipSelected: string;
  segActive: string;
}

export const FR_THEMES: Record<FrThemeId, FrThemePalette> = {
  papier: {
    id: 'papier',
    label: 'Papier',
    hex: {
      paper: '#F7F2E8',
      paperRaised: '#FFFCF5',
      ink: '#2A241D',
      inkMuted: '#6B6155',
      rule: '#E2D8C6',
      accent: '#1F5F63',
      onAccent: '#FFFCF5',
      highlight: '#F3DC9A',
      danger: '#A3392B',
    },
    paperBg: 'bg-[#F7F2E8]',
    paperRaisedBg: 'bg-[#FFFCF5]',
    inkText: 'text-[#2A241D]',
    inkMutedText: 'text-[#6B6155]',
    ruleBorder: 'border-[#E2D8C6]',
    ruleBg: 'bg-[#E2D8C6]',
    accentBg: 'bg-[#1F5F63]',
    accentText: 'text-[#1F5F63]',
    accentBorder: 'border-[#1F5F63]',
    onAccentText: 'text-[#FFFCF5]',
    highlightBg: 'bg-[#F3DC9A]',
    highlightRing: 'ring-3 ring-[#F3DC9A]',
    dangerText: 'text-[#A3392B]',
    dangerBorder: 'border-[#A3392B]',
    dangerBgHover: 'hover:bg-[#A3392B] hover:text-[#FFFCF5]',
    dangerFillBg: 'bg-[#A3392B] text-[#FFFCF5] border-[#A3392B]',
    inkBg: 'bg-[#2A241D]',
    paperText: 'text-[#F7F2E8]',
    inkMutedBorder: 'border-[#6B6155]',
    chipSelected: 'bg-[#2A241D] text-[#F7F2E8] border-[#2A241D]',
    segActive: 'bg-[#FFFCF5] text-[#2A241D] ring-1 ring-inset ring-[#6B6155]',
  },
  sepia: {
    id: 'sepia',
    label: 'Sépia',
    hex: {
      paper: '#EFE3CC',
      paperRaised: '#F6ECD9',
      ink: '#3B2F22',
      inkMuted: '#6A5843',
      rule: '#D9C7A6',
      accent: '#1D5458',
      onAccent: '#FFFCF5',
      highlight: '#E6C97F',
      danger: '#97342A',
    },
    paperBg: 'bg-[#EFE3CC]',
    paperRaisedBg: 'bg-[#F6ECD9]',
    inkText: 'text-[#3B2F22]',
    inkMutedText: 'text-[#6A5843]',
    ruleBorder: 'border-[#D9C7A6]',
    ruleBg: 'bg-[#D9C7A6]',
    accentBg: 'bg-[#1D5458]',
    accentText: 'text-[#1D5458]',
    accentBorder: 'border-[#1D5458]',
    onAccentText: 'text-[#FFFCF5]',
    highlightBg: 'bg-[#E6C97F]',
    highlightRing: 'ring-3 ring-[#E6C97F]',
    dangerText: 'text-[#97342A]',
    dangerBorder: 'border-[#97342A]',
    dangerBgHover: 'hover:bg-[#97342A] hover:text-[#FFFCF5]',
    dangerFillBg: 'bg-[#97342A] text-[#FFFCF5] border-[#97342A]',
    inkBg: 'bg-[#3B2F22]',
    paperText: 'text-[#EFE3CC]',
    inkMutedBorder: 'border-[#6A5843]',
    chipSelected: 'bg-[#3B2F22] text-[#EFE3CC] border-[#3B2F22]',
    segActive: 'bg-[#F6ECD9] text-[#3B2F22] ring-1 ring-inset ring-[#6A5843]',
  },
  nuit: {
    id: 'nuit',
    label: 'Nuit',
    hex: {
      paper: '#1C1A17',
      paperRaised: '#26231F',
      ink: '#ECE4D6',
      inkMuted: '#A89E8F',
      rule: '#3A352E',
      accent: '#7FB8B3',
      onAccent: '#1C1A17',
      highlight: '#5A4A1F',
      danger: '#E08A7C',
    },
    paperBg: 'bg-[#1C1A17]',
    paperRaisedBg: 'bg-[#26231F]',
    inkText: 'text-[#ECE4D6]',
    inkMutedText: 'text-[#A89E8F]',
    ruleBorder: 'border-[#3A352E]',
    ruleBg: 'bg-[#3A352E]',
    accentBg: 'bg-[#7FB8B3]',
    accentText: 'text-[#7FB8B3]',
    accentBorder: 'border-[#7FB8B3]',
    onAccentText: 'text-[#1C1A17]',
    highlightBg: 'bg-[#5A4A1F]',
    highlightRing: 'ring-3 ring-[#5A4A1F]',
    dangerText: 'text-[#E08A7C]',
    dangerBorder: 'border-[#E08A7C]',
    dangerBgHover: 'hover:bg-[#E08A7C] hover:text-[#1C1A17]',
    dangerFillBg: 'bg-[#E08A7C] text-[#1C1A17] border-[#E08A7C]',
    inkBg: 'bg-[#ECE4D6]',
    paperText: 'text-[#1C1A17]',
    inkMutedBorder: 'border-[#A89E8F]',
    chipSelected: 'bg-[#ECE4D6] text-[#1C1A17] border-[#ECE4D6]',
    segActive: 'bg-[#26231F] text-[#ECE4D6] ring-1 ring-inset ring-[#A89E8F]',
  },
};

export interface FrVoiceSpec {
  id: 'clara' | 'thomas' | 'emma';
  name: string;
  lang: string;
  desc: string;
  sample: string;
  bcp: 'fr-CA' | 'en-US';
  geminiVoiceName: 'Kore' | 'Charon' | 'Zephyr';
  defaultPitchSemitones: number;
  waveHeights: string[];
}

export const FR_VOICES: FrVoiceSpec[] = [
  {
    id: 'clara',
    name: 'Clara',
    lang: 'Français (Québec) · Studio 24 kHz',
    desc: 'Voix neuronale chaleureuse, fluide et posée, idéale pour les longs articles et essais.',
    sample:
      'Bonjour, je lirai vos textes à voix haute avec une fluidité naturelle, au rythme qui vous convient.',
    bcp: 'fr-CA',
    geminiVoiceName: 'Kore',
    defaultPitchSemitones: 0.0,
    waveHeights: [
      'h-[8px]',
      'h-[16px]',
      'h-[22px]',
      'h-[12px]',
      'h-[18px]',
      'h-[24px]',
      'h-[14px]',
      'h-[10px]',
      'h-[20px]',
      'h-[15px]',
      'h-[9px]',
      'h-[18px]',
      'h-[12px]',
      'h-[7px]',
    ],
  },
  {
    id: 'thomas',
    name: 'Thomas',
    lang: 'Français (Québec) · Posé 24 kHz',
    desc: 'Timbre grave, enveloppant et calme, pensé pour les romans, rapports et récits.',
    sample:
      'Bonjour, je lirai vos textes avec un timbre posé, chaleureux et parfaitement régulier.',
    bcp: 'fr-CA',
    geminiVoiceName: 'Charon',
    defaultPitchSemitones: 0.0,
    waveHeights: [
      'h-[10px]',
      'h-[14px]',
      'h-[19px]',
      'h-[23px]',
      'h-[13px]',
      'h-[17px]',
      'h-[11px]',
      'h-[21px]',
      'h-[16px]',
      'h-[12px]',
      'h-[20px]',
      'h-[14px]',
      'h-[9px]',
      'h-[13px]',
    ],
  },
  {
    id: 'emma',
    name: 'Emma',
    lang: 'English (US) · Studio 24 kHz',
    desc: 'Warm, expressive neural narration for English articles and books.',
    sample:
      'Hello, I will read your texts aloud with a warm, fluid, and natural editorial cadence.',
    bcp: 'en-US',
    geminiVoiceName: 'Zephyr',
    defaultPitchSemitones: 0.0,
    waveHeights: [
      'h-[7px]',
      'h-[15px]',
      'h-[21px]',
      'h-[14px]',
      'h-[24px]',
      'h-[16px]',
      'h-[11px]',
      'h-[19px]',
      'h-[22px]',
      'h-[13px]',
      'h-[17px]',
      'h-[10px]',
      'h-[15px]',
      'h-[8px]',
    ],
  },
];

export interface FrDocItem {
  id: string;
  when: string;
  kicker: string;
  title: string;
  progress: number;
  paragraphs: string[][];
}

export const INITIAL_FR_DOCS: FrDocItem[] = [
  {
    id: 'clinique',
    when: `Aujourd’hui · 7${NBS}h${NBS}42`,
    kicker: 'Section 2 · Activités',
    title: 'Rapport annuel 2025 — Clinique Saint-Roch',
    progress: 64,
    paragraphs: [
      [
        'La hausse des consultations en télémédecine s’est confirmée au deuxième trimestre.',
        'Près d’un rendez-vous sur trois a eu lieu à distance, surtout pour les suivis en santé mentale.',
        'Les patients des rangs éloignés ont gagné en moyenne quarante minutes de route par visite.',
      ],
      [
        'L’équipe infirmière a été renforcée par deux postes à temps plein.',
        `Ce renfort a permis d’ouvrir la clinique sans rendez-vous le samedi matin, de 8${NBS}h à midi.`,
        'Le temps d’attente moyen est passé de 52 à 31 minutes.',
      ],
      [
        'Pour 2026, la clinique prévoit d’offrir la prise de rendez-vous en ligne en français et en anglais.',
        'Un comité de patients sera consulté avant chaque changement d’horaire.',
      ],
    ],
  },
  {
    id: 'loi25',
    when: 'Hier',
    kicker: 'Chapitre 1',
    title: 'Guide Loi 25 — Ce qui change pour vous',
    progress: 20,
    paragraphs: [
      [
        'Depuis septembre 2023, toute entreprise du Québec doit nommer une personne responsable de la protection des renseignements personnels.',
        'Par défaut, ce rôle revient à la personne ayant la plus haute autorité dans l’organisation.',
      ],
      [
        'Vous avez le droit de savoir quels renseignements une entreprise détient à votre sujet.',
        'Vous pouvez aussi demander qu’ils soient corrigés ou retirés.',
        'L’entreprise dispose de trente jours pour vous répondre.',
      ],
    ],
  },
  {
    id: 'ordre',
    when: 'Lundi',
    kicker: 'Infolettre',
    title: 'Infolettre de l’Ordre — Octobre',
    progress: 0,
    paragraphs: [
      [
        'Le prochain congrès annuel se tiendra à Québec les 14 et 15 novembre.',
        'Les inscriptions ferment le 31 octobre.',
      ],
      [
        'Les heures de formation continue doivent être déclarées avant le 31 mars.',
        'Un rappel vous sera envoyé deux semaines avant l’échéance.',
      ],
    ],
  },
];

export interface FrHostSpec {
  id: HostAppId;
  app: string;
  url: string;
  kicker: string;
  title: string;
  meta: string;
  paragraphs: string[][];
}

export const FR_HOSTS: Record<HostAppId, FrHostSpec> = {
  article: {
    id: 'article',
    app: 'Journal régional',
    url: 'journal-regional.ca/traversier',
    kicker: 'Actualités régionales',
    title: 'Le traversier reprend ses départs réguliers',
    meta: `Publié aujourd’hui à 6${NBS}h${NBS}30`,
    paragraphs: [
      [
        'Le traversier entre Sorel-Tracy et Saint-Ignace-de-Loyola reprendra ses départs réguliers lundi matin.',
        'Les travaux sur le quai ont été terminés avec une semaine d’avance.',
      ],
      [
        `Le service rappelle que les départs de 6${NBS}h${NBS}15 sont souvent complets.`,
        'Les usagers sont invités à réserver leur place en ligne la veille.',
        'Les cyclistes pourront embarquer sans réservation.',
      ],
      [
        'Un horaire réduit restera en vigueur les jours fériés jusqu’à la fin de l’automne.',
        'La traversée dure environ dix minutes.',
      ],
      [
        'La municipalité étudie aussi l’ajout d’un abri chauffé pour les piétons.',
        'Une consultation publique aura lieu à l’hôtel de ville le 12 novembre.',
      ],
    ],
  },
  mail: {
    id: 'mail',
    app: 'Courriel',
    url: 'Boîte de réception',
    kicker: 'Clinique Saint-Roch',
    title: 'Confirmation de votre rendez-vous',
    meta: `De${NB}: accueil@clinique-stroch.ca · 8${NBS}h${NBS}05`,
    paragraphs: [
      [
        'Bonjour Armel,',
        `Votre rendez-vous est confirmé pour le jeudi 23 octobre à 14${NBS}h${NBS}30.`,
      ],
      [
        'Présentez-vous à l’accueil dix minutes avant l’heure prévue.',
        'Apportez votre carte d’assurance maladie et la liste de vos médicaments.',
      ],
      [
        'Si vous devez annuler, appelez-nous au moins vingt-quatre heures à l’avance.',
        'Le stationnement est gratuit derrière la clinique.',
      ],
      ['Au plaisir de vous voir,', 'L’équipe de la Clinique Saint-Roch'],
    ],
  },
  pdf: {
    id: 'pdf',
    app: 'Lecteur de documents',
    url: 'Rapport-Clinique-2025.pdf',
    kicker: 'Document PDF · Reconnaissance optique',
    title: 'Bilan des cliniques mobiles en région',
    meta: `Page 4 sur 18 · Format numérisé`,
    paragraphs: [
      [
        'Les cliniques mobiles ont desservi douze municipalités rurales au cours de l’année écoulée.',
        'Chaque halte hebdomadaire a permis d’effectuer des bilans préventifs sans déplacement vers le centre hospitalier.',
      ],
      [
        'Les résidents âgés ont particulièrement apprécié le suivi sur place et la remise immédiate des ordonnances renouvelées.',
        'Le programme sera reconduit dès le printemps prochain avec une unité supplémentaire.',
      ],
    ],
  },
};

const PROGRESS_WIDTH_CLASSES: Record<number, string> = {
  0: 'w-0',
  5: 'w-[5%]',
  10: 'w-[10%]',
  15: 'w-[15%]',
  20: 'w-[20%]',
  25: 'w-[25%]',
  30: 'w-[30%]',
  35: 'w-[35%]',
  40: 'w-[40%]',
  45: 'w-[45%]',
  50: 'w-[50%]',
  55: 'w-[55%]',
  60: 'w-[60%]',
  65: 'w-[65%]',
  70: 'w-[70%]',
  75: 'w-[75%]',
  80: 'w-[80%]',
  85: 'w-[85%]',
  90: 'w-[90%]',
  95: 'w-[95%]',
  100: 'w-full',
};

export function getProgressWidthClass(pct: number): string {
  const clamped = Math.max(0, Math.min(100, Math.round(pct / 5) * 5));
  return PROGRESS_WIDTH_CLASSES[clamped] || 'w-0';
}

const TOP_PCT_CLASSES: Record<number, string> = {
  10: 'top-[10%]',
  15: 'top-[15%]',
  20: 'top-[20%]',
  25: 'top-[25%]',
  30: 'top-[30%]',
  35: 'top-[35%]',
  40: 'top-[40%]',
  45: 'top-[45%]',
  50: 'top-[50%]',
  55: 'top-[55%]',
  60: 'top-[60%]',
  65: 'top-[65%]',
  70: 'top-[70%]',
  75: 'top-[75%]',
  80: 'top-[80%]',
};

export function getBubbleTopClass(yf: number): string {
  const pct = Math.max(10, Math.min(80, Math.round((yf * 100) / 5) * 5));
  return TOP_PCT_CLASSES[pct] || 'top-[55%]';
}

const READING_SIZE_CLASSES: Record<number, string> = {
  16: 'text-[16px] leading-[26px]',
  17: 'text-[17px] leading-[27px]',
  18: 'text-[18px] leading-[28px]',
  19: 'text-[19px] leading-[30px]',
  20: 'text-[20px] leading-[32px]',
  21: 'text-[21px] leading-[33px]',
  22: 'text-[22px] leading-[35px]',
  23: 'text-[23px] leading-[36px]',
  24: 'text-[24px] leading-[38px]',
};

export function getReadingSizeClass(px: number): string {
  const clamped = Math.max(16, Math.min(24, Math.round(px)));
  return READING_SIZE_CLASSES[clamped] || 'text-[19px] leading-[30px]';
}

// ==================== REUSABLE EDITORIAL PRIMITIVES ====================

export function FrSwitch({
  checked,
  onChange,
  label,
  theme,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  theme: FrThemePalette;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="min-w-[56px] min-h-[44px] p-0 border-0 bg-transparent grid place-items-center cursor-pointer shrink-0"
    >
      <span
        className={`w-[52px] h-[32px] rounded-full border p-[3px] box-border flex items-center transition-colors duration-150 ${
          checked
            ? `${theme.accentBg} ${theme.accentBorder}`
            : `${theme.paperBg} ${theme.inkMutedBorder}`
        }`}
      >
        <span
          className={`w-[24px] h-[24px] rounded-full transition-transform duration-150 ${
            checked
              ? `translate-x-[20px] ${theme.paperRaisedBg}`
              : `translate-x-0 ${theme.inkBg}`
          }`}
        />
      </span>
    </button>
  );
}

export function FrSegmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
  theme,
  columnsClass = 'grid-cols-5',
}: {
  label: string;
  value: T;
  options: {value: T; label: string}[];
  onChange: (val: T) => void;
  theme: FrThemePalette;
  columnsClass?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`grid ${columnsClass} p-[3px] gap-[2px] rounded-[8px] border ${theme.paperBg} ${theme.ruleBorder} w-full box-border`}
    >
      {options.map((opt) => {
        const active =
          typeof value === 'number' && typeof opt.value === 'number'
            ? Math.abs(value - opt.value) < 0.005
            : value === opt.value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={`min-h-[38px] px-2 rounded-[6px] text-[13px] leading-[18px] font-semibold tabular-nums cursor-pointer transition-colors duration-150 whitespace-nowrap ${
              active
                ? theme.segActive
                : `bg-transparent ${theme.inkMutedText} hover:${theme.inkText}`
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function FrChip({
  selected,
  onClick,
  children,
  theme,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  theme: FrThemePalette;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`min-h-[44px] px-3.5 rounded-full border text-[14px] leading-[20px] font-medium cursor-pointer transition-colors duration-150 flex items-center justify-center tabular-nums active:translate-y-[1px] ${
        selected
          ? theme.chipSelected
          : `bg-transparent ${theme.inkText} ${theme.inkMutedBorder} hover:${theme.paperRaisedBg}`
      }`}
    >
      {children}
    </button>
  );
}

export function FrLiveWave({
  playing,
  theme,
}: {
  playing: boolean;
  theme: FrThemePalette;
}) {
  return (
    <span
      className="flex items-center gap-[3px] h-[24px] shrink-0"
      aria-hidden="true"
    >
      <i
        className={`block w-[3px] rounded-[2px] ${theme.accentBg} transition-all duration-300 ${
          playing ? 'h-[14px] animate-pulse' : 'h-[6px]'
        }`}
      />
      <i
        className={`block w-[3px] rounded-[2px] ${theme.accentBg} transition-all duration-300 ${
          playing ? 'h-[22px] animate-pulse' : 'h-[6px]'
        }`}
      />
      <i
        className={`block w-[3px] rounded-[2px] ${theme.accentBg} transition-all duration-300 ${
          playing ? 'h-[10px] animate-pulse' : 'h-[6px]'
        }`}
      />
      <i
        className={`block w-[3px] rounded-[2px] ${theme.accentBg} transition-all duration-300 ${
          playing ? 'h-[20px] animate-pulse' : 'h-[6px]'
        }`}
      />
      <i
        className={`block w-[3px] rounded-[2px] ${theme.accentBg} transition-all duration-300 ${
          playing ? 'h-[12px] animate-pulse' : 'h-[6px]'
        }`}
      />
    </span>
  );
}

export function FrVoiceCard({
  voice,
  selected,
  sampling,
  onSelect,
  onSample,
  theme,
}: {
  voice: FrVoiceSpec;
  selected: boolean;
  sampling: boolean;
  onSelect: () => void;
  onSample: () => void;
  theme: FrThemePalette;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
        className={`w-full flex flex-col gap-3 p-4 rounded-[14px] border text-left cursor-pointer transition-colors duration-150 ${
          theme.paperRaisedBg
        } ${
          selected
            ? `${theme.accentBorder} ring-1 ring-inset ${
                theme.id === 'nuit'
                  ? 'ring-[#7FB8B3]'
                  : theme.id === 'sepia'
                    ? 'ring-[#1D5458]'
                    : 'ring-[#1F5F63]'
              }`
            : `${theme.ruleBorder} hover:${theme.inkMutedBorder}`
        }`}
      >
        <div className="flex items-center gap-3 pr-8">
          <span
            aria-hidden="true"
            className={`w-9 h-9 rounded-full grid place-items-center shrink-0 font-[family-name:var(--font-serif)] font-semibold text-[14px] ${theme.highlightBg} ${theme.inkText}`}
          >
            {voice.name[0]}
          </span>
          <div className="min-w-0">
            <p
              className={`m-0 font-[family-name:var(--font-serif)] font-semibold text-[18px] leading-[24px] ${theme.inkText}`}
            >
              {voice.name}
            </p>
            <p
              className={`m-0 text-[13px] leading-[18px] ${theme.inkMutedText}`}
            >
              {voice.lang}
            </p>
          </div>
        </div>

        <p className={`m-0 text-[15px] leading-[22px] ${theme.inkText}`}>
          {voice.desc}
        </p>

        <div className="flex items-center justify-between pr-12">
          <div
            className="flex items-center gap-[3px] h-[24px]"
            aria-hidden="true"
          >
            {voice.waveHeights.map((hClass, idx) => (
              <i
                key={idx}
                className={`block w-[3px] rounded-[2px] ${hClass} ${
                  selected ? theme.accentBg : theme.ruleBg
                }`}
              />
            ))}
          </div>
        </div>

        {selected && (
          <span
            aria-hidden="true"
            className={`absolute top-4 right-4 w-[22px] h-[22px] rounded-full grid place-items-center ${theme.accentBg} ${theme.onAccentText}`}
          >
            <Check className="w-3.5 h-3.5" strokeWidth={2} />
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSample();
        }}
        aria-label={
          (sampling ? 'Arrêter l’extrait de ' : 'Écouter un extrait de ') +
          voice.name
        }
        className={`absolute right-3 bottom-3 w-[44px] h-[44px] rounded-full border grid place-items-center cursor-pointer transition-colors duration-150 active:translate-y-[1px] ${theme.paperBg} ${theme.ruleBorder} ${theme.inkText} hover:${theme.inkMutedBorder}`}
      >
        {sampling ? (
          <Pause className="w-[18px] h-[18px]" strokeWidth={1.5} />
        ) : (
          <Play className="w-[18px] h-[18px]" strokeWidth={1.5} />
        )}
      </button>
    </div>
  );
}

export function FrStepper({
  value,
  min,
  max,
  step,
  unit,
  onChange,
  label,
  theme,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (nextVal: number) => void;
  label: string;
  theme: FrThemePalette;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="grid grid-cols-[44px_1fr_44px] items-center"
    >
      <button
        type="button"
        aria-label="Diminuer"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - step))}
        className={`w-[44px] h-[44px] grid place-items-center border rounded-full cursor-pointer transition-colors duration-150 active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed ${theme.paperBg} ${theme.inkMutedBorder} ${theme.inkText}`}
      >
        <Minus className="w-5 h-5" strokeWidth={1.5} />
      </button>

      <span
        aria-live="polite"
        className={`text-center font-[family-name:var(--font-serif)] font-medium text-[28px] leading-none tabular-nums ${theme.inkText}`}
      >
        {value}
        <small
          className={`font-[family-name:var(--font-sans)] font-normal text-[14px] leading-none ${theme.inkMutedText}`}
        >
          {unit}
        </small>
      </span>

      <button
        type="button"
        aria-label="Augmenter"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + step))}
        className={`w-[44px] h-[44px] grid place-items-center border rounded-full cursor-pointer transition-colors duration-150 active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed ${theme.paperBg} ${theme.inkMutedBorder} ${theme.inkText}`}
      >
        <Plus className="w-5 h-5" strokeWidth={1.5} />
      </button>
    </div>
  );
}

export function StopSquareIcon() {
  return <Square className="w-3.5 h-3.5 fill-current" strokeWidth={1.5} />;
}

export function VolumeStrokeIcon({size = 22}: {size?: number}) {
  return (
    <Volume2
      className={size === 18 ? 'w-[18px] h-[18px]' : 'w-[22px] h-[22px]'}
      strokeWidth={1.5}
    />
  );
}
