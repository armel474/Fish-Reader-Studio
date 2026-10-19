'use client';

import React, {useState} from 'react';
import {
  Check,
  Copy,
  Download,
  FileCode2,
  FileText,
  Table,
  Play,
  Pause,
} from 'lucide-react';
import {
  FrThemeId,
  FR_THEMES,
  SPEEDS,
  fmtSpeed,
  NB,
  NBS,
  FrSegmented,
  FrChip,
  FrStepper,
  StopSquareIcon,
} from '@/lib/fishreader-ds';

interface ComponentSpec {
  id: string;
  name: string;
  screen: string;
  category: 'Bulle & États' | 'Lecteur & Sauts' | 'Application Compagnon';
  dimensions: string;
  radius: string;
  states: string[];
  designNotes: string;
}

const UI_COMPONENTS_SPEC: ComponentSpec[] = [
  {
    id: 'bubble-idle',
    name: 'Bulle au repos & Languette rétractée',
    screen: 'Écran 1 · Superposition (idle)',
    category: 'Bulle & États',
    dimensions: 'Cercle 56 dp · Languette 14 × 64 dp (zone 44 × 72 dp)',
    radius: '999 dp (cercle) · 8 dp intérieur (languette)',
    states: [
      'Repos au bord (marge 8 dp)',
      'Glisser (anneau highlight #F3DC9A)',
      'Aimantation 250 ms',
      'Rétractée après 3 s (autoTuck)',
      'Variante Pilule en bas (44 dp)',
    ],
    designNotes:
      'Fond accent (#1F5F63), icône volume 22 dp on-accent (#FFFCF5), anneau 3 dp paper-raised. Aucune ombre portée.',
  },
  {
    id: 'bubble-trash-target',
    name: 'Cible « Masquer » pendant le glisser',
    screen: 'Écran 1 · Superposition (drag → hidden)',
    category: 'Bulle & États',
    dimensions: 'Cercle 80 dp (rayon de capture 56 dp)',
    radius: '999 dp',
    states: [
      'Apparition au glisser (> 6 dp)',
      'Survol actif (fond danger #A3392B)',
      'Relâcher → Toast « La bulle est masquée »',
    ],
    designNotes:
      'Centrée à 24 dp du bas, bordure ink-muted au repos, passe en fond danger et texte on-accent au survol.',
  },
  {
    id: 'bubble-menu-sheet',
    name: 'Feuille Menu de lecture',
    screen: 'Écran 1 · Superposition (menu)',
    category: 'Bulle & États',
    dimensions: 'Marges 8 dp · Boutons 48 dp · Contrôles 44 dp',
    radius: '14 dp (carte) · 8 dp (boutons)',
    states: [
      'Lire cet écran (→ scan)',
      'Choisir où commencer (→ pick)',
      'Vitesse 5 paliers',
      '3 puces Voix',
      'Suivre la lecture (Switch 52 × 32 dp)',
    ],
    designNotes:
      'En-tête en Literata 600 18/24 « Fish Reader » + badge neutre « Clara · 1,25× » + bouton fermer 44 dp.',
  },
  {
    id: 'bubble-pill-reading',
    name: 'Pilule de lecture réduite',
    screen: 'Écran 1 · Superposition (reading réduit)',
    category: 'Lecteur & Sauts',
    dimensions: 'Largeur 100 % − 32 dp (max 360 dp) × 64 dp min',
    radius: '999 dp (pilule)',
    states: [
      'En lecture (onde 5 barres animée)',
      'En pause (onde figée)',
      'Play/Pause 48 dp',
      'Arrêter 44 dp (carré plein 12 dp)',
    ],
    designNotes:
      'Toute la partie gauche est cliquable pour ouvrir le lecteur déplié. Chiffres tabulaires (« Phrase 3 sur 9 · 1,25× »).',
  },
  {
    id: 'bubble-player-expanded',
    name: 'Lecteur déplié & Transport grand format',
    screen: 'Écran 1 · Superposition (reading déplié)',
    category: 'Lecteur & Sauts',
    dimensions: 'Play/Pause 64 dp · Sauts 56 dp · Rangée 44 dp',
    radius: '14 dp (carte) · 999 dp (transport)',
    states: [
      'Reculer (−15 s / −2 phr.)',
      'Play/Pause 64 dp',
      'Avancer (+15 s / +2 phr.)',
      'Sauts ±15 s (repliable)',
      'Arrêter (bordure et texte danger)',
    ],
    designNotes:
      'Avatar 36 dp (fond highlight, initiale Literata 600), barre de progression 3 dp (transition 300 ms).',
  },
  {
    id: 'skip-settings-panel',
    name: 'Réglage des sauts (Secondes / Phrases)',
    screen: 'Écran 1 · Lecteur déplié',
    category: 'Lecteur & Sauts',
    dimensions: 'Stepper 44 dp − valeur + · 4 puces raccourcis 44 dp',
    radius: '8 dp (panneau) · 999 dp (boutons)',
    states: [
      'Mode Secondes (5 à 120 s, pas de 5)',
      'Mode Phrases (1 à 10, pas de 1)',
      'Raccourcis 5/10/15/30 s ou 1/2/3/5',
      'Persisté (DataStore / localStorage)',
    ],
    designNotes:
      'Valeur centrale affichée en Literata 500 28 sp tabulaire avec unité en Source Sans 3 14 sp.',
  },
  {
    id: 'companion-liseuse',
    name: 'Liseuse Karaoké & Feuille « Nouveau texte »',
    screen: 'Écran 2 · Application compagnon (Liseuse)',
    category: 'Application Compagnon',
    dimensions: 'En-tête 52 dp · Lecteur bas 60 dp · Onglets 60 dp',
    radius: '4 dp (surlignage phrase) · 14 dp (champ texte)',
    states: [
      'Phrase active (fond highlight + débord 3 dp)',
      'Phrase déjà lue (ink-muted)',
      'Corps réglable 16 à 24 sp',
      'Feuille plein écran Nouveau texte',
    ],
    designNotes:
      'Colonne de lecture en Literata 19/30. Défilement automatique doux pour garder la phrase active visible.',
  },
  {
    id: 'companion-voices',
    name: 'Cartes de Voix & Curseur de Vitesse 0,5×–2×',
    screen: 'Écran 2 · Application compagnon (Voix)',
    category: 'Application Compagnon',
    dimensions: 'Bouton extrait 44 dp · Curseur 36 dp · Timbre 3 segments',
    radius: '14 dp (cartes) · 8 dp (segments)',
    states: [
      'Clara (Français Québec · Studio)',
      'Thomas (Français Québec · Posé)',
      'Emma (English US)',
      'Timbre : Plus doux / Naturel / Plus clair',
    ],
    designNotes:
      'Grand chiffre de vitesse en Literata 500 44 sp tabulaire. Coche de sélection accent (22 dp) en haut à droite.',
  },
];

const THEME_COMPARISON_ROWS = [
  {
    token: 'paper',
    role: 'Surface principale de lecture',
    papier: '#F7F2E8',
    sepia: '#EFE3CC',
    nuit: '#1C1A17',
  },
  {
    token: 'paper-raised',
    role: 'Cartes, feuilles et contrôles actifs',
    papier: '#FFFCF5',
    sepia: '#F6ECD9',
    nuit: '#26231F',
  },
  {
    token: 'ink',
    role: 'Texte principal et titres Literata',
    papier: '#2A241D',
    sepia: '#3B2F22',
    nuit: '#ECE4D6',
  },
  {
    token: 'ink-muted',
    role: 'Métadonnées, légendes et phrases lues',
    papier: '#6B6155',
    sepia: '#6A5843',
    nuit: '#A89E8F',
  },
  {
    token: 'rule',
    role: 'Filets de séparation et bordures 1 dp',
    papier: '#E2D8C6',
    sepia: '#D9C7A6',
    nuit: '#3A352E',
  },
  {
    token: 'accent',
    role: 'Bulle, bouton Play et progression',
    papier: '#1F5F63',
    sepia: '#1D5458',
    nuit: '#7FB8B3',
  },
  {
    token: 'on-accent',
    role: 'Icône et texte sur fond accent',
    papier: '#FFFCF5',
    sepia: '#FFFCF5',
    nuit: '#1C1A17',
  },
  {
    token: 'highlight',
    role: 'Surlignage de la phrase active et avatars',
    papier: '#F3DC9A',
    sepia: '#E6C97F',
    nuit: '#5A4A1F',
  },
  {
    token: 'danger',
    role: 'Bouton Arrêter et cible Masquer',
    papier: '#A3392B',
    sepia: '#97342A',
    nuit: '#E08A7C',
  },
];

const COMPOSE_THEME_KT_SOURCE = `package app.fishreader.ui.theme

import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import app.fishreader.R

// Fish Reader — jetons de design. Toujours le jeton, jamais la valeur en dur.

@Immutable
data class FrColors(
    val paper: Color, val paperRaised: Color, val ink: Color, val inkMuted: Color,
    val rule: Color, val accent: Color, val onAccent: Color, val highlight: Color, val danger: Color,
)

val Papier = FrColors(Color(0xFFF7F2E8), Color(0xFFFFFCF5), Color(0xFF2A241D), Color(0xFF6B6155), Color(0xFFE2D8C6), Color(0xFF1F5F63), Color(0xFFFFFCF5), Color(0xFFF3DC9A), Color(0xFFA3392B))
val Sepia = FrColors(Color(0xFFEFE3CC), Color(0xFFF6ECD9), Color(0xFF3B2F22), Color(0xFF6A5843), Color(0xFFD9C7A6), Color(0xFF1D5458), Color(0xFFFFFCF5), Color(0xFFE6C97F), Color(0xFF97342A))
val Nuit = FrColors(Color(0xFF1C1A17), Color(0xFF26231F), Color(0xFFECE4D6), Color(0xFFA89E8F), Color(0xFF3A352E), Color(0xFF7FB8B3), Color(0xFF1C1A17), Color(0xFF5A4A1F), Color(0xFFE08A7C))

enum class FrTheme { Papier, Sepia, Nuit }

val Literata = FontFamily(
    Font(R.font.literata_400, FontWeight.Normal), Font(R.font.literata_500, FontWeight.Medium), Font(R.font.literata_600, FontWeight.SemiBold),
)
val SourceSans3 = FontFamily(
    Font(R.font.source_sans_3_400, FontWeight.Normal), Font(R.font.source_sans_3_500, FontWeight.Medium), Font(R.font.source_sans_3_600, FontWeight.SemiBold),
)

private const val TNUM = "tnum"

@Immutable
data class FrType(
    val display: TextStyle = TextStyle(fontFamily = Literata, fontWeight = FontWeight.SemiBold, fontSize = 40.sp, lineHeight = 44.sp, letterSpacing = (-0.01).em),
    val title: TextStyle = TextStyle(fontFamily = Literata, fontWeight = FontWeight.SemiBold, fontSize = 26.sp, lineHeight = 32.sp),
    val headerTitle: TextStyle = TextStyle(fontFamily = Literata, fontWeight = FontWeight.SemiBold, fontSize = 20.sp, lineHeight = 24.sp),
    val wordmark: TextStyle = TextStyle(fontFamily = Literata, fontWeight = FontWeight.SemiBold, fontSize = 18.sp, lineHeight = 24.sp),
    val reading: TextStyle = TextStyle(fontFamily = Literata, fontSize = 19.sp, lineHeight = 30.sp), // réglable 16–24 sp
    val bigNumber: TextStyle = TextStyle(fontFamily = Literata, fontWeight = FontWeight.Medium, fontSize = 44.sp, lineHeight = 44.sp, fontFeatureSettings = TNUM),
    val stepperNumber: TextStyle = TextStyle(fontFamily = Literata, fontWeight = FontWeight.Medium, fontSize = 28.sp, lineHeight = 28.sp, fontFeatureSettings = TNUM),
    val uiLabel: TextStyle = TextStyle(fontFamily = SourceSans3, fontWeight = FontWeight.SemiBold, fontSize = 14.sp, lineHeight = 20.sp, fontFeatureSettings = TNUM),
    val uiBody: TextStyle = TextStyle(fontFamily = SourceSans3, fontSize = 15.sp, lineHeight = 22.sp),
    val uiCaption: TextStyle = TextStyle(fontFamily = SourceSans3, fontSize = 13.sp, lineHeight = 18.sp, fontFeatureSettings = TNUM),
    val eyebrow: TextStyle = TextStyle(fontFamily = SourceSans3, fontWeight = FontWeight.SemiBold, fontSize = 12.sp, lineHeight = 18.sp, letterSpacing = 0.08.em),
)

object FrSpace { val s1 = 4.dp; val s2 = 8.dp; val s3 = 12.dp; val s4 = 16.dp; val s6 = 24.dp; val s10 = 40.dp }
object FrRadius { val sm = 4.dp; val md = 8.dp; val lg = 14.dp; val segment = 6.dp; val pill = 999.dp }
object FrSize {
    val targetMin = 44.dp; val targetPrimary = 48.dp; val bubble = 56.dp; val playLarge = 64.dp
    val header = 52.dp; val tabBar = 60.dp; val player = 60.dp; val bubbleRing = 3.dp; val highlightSpread = 3.dp
}
object FrMotion { const val COLOR_MS = 150; const val SENTENCE_MS = 250; const val PROGRESS_MS = 300; const val SNAP_MS = 250 }

val SPEEDS = listOf(0.75f, 1.0f, 1.15f, 1.25f, 1.5f)
fun formatSpeed(v: Float): String = ("%.2f".format(v).trimEnd('0').trimEnd('.', ',')).replace('.', ',') + "×"
`;

export default function DesignerHandoffSection({
  themeId = 'papier',
}: {
  themeId?: FrThemeId;
}) {
  const theme = FR_THEMES[themeId];
  const [filterCat, setFilterCat] = useState<string>('ALL');
  const [copiedThemeKt, setCopiedThemeKt] = useState(false);
  const [copiedTokens, setCopiedTokens] = useState(false);

  // Interactive Sandbox state
  const [sandboxSpeed, setSandboxSpeed] = useState<number>(1.25);
  const [sandboxSkipSec, setSandboxSkipSec] = useState<number>(15);
  const [sandboxPlaying, setSandboxPlaying] = useState<boolean>(true);

  const filteredSpecs = UI_COMPONENTS_SPEC.filter((c) =>
    filterCat === 'ALL' ? true : c.category === filterCat
  );

  const handleCopyThemeKt = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(COMPOSE_THEME_KT_SOURCE);
      setCopiedThemeKt(true);
      window.setTimeout(() => setCopiedThemeKt(false), 2000);
    }
  };

  const handleDownloadDesignTokensJson = () => {
    const jsonObj = {
      themes: {
        papier: FR_THEMES.papier.hex,
        sepia: FR_THEMES.sepia.hex,
        nuit: FR_THEMES.nuit.hex,
      },
      fonts: {
        serif: 'Literata (400/500/600)',
        sans: 'Source Sans 3 (400/500/600)',
        numerals: 'tabular (tnum)',
      },
      spacing: [4, 8, 12, 16, 24, 40],
      radius: {sm: 4, md: 8, lg: 14, pill: 999, segmentInner: 6},
      targets: {min: 44, primary: 48, bubble: 56, playLarge: 64},
      bars: {header: 52, tabBar: 60, player: 60},
      speeds: [0.75, 1.0, 1.15, 1.25, 1.5],
      skip: {
        seconds: {min: 5, max: 120, step: 5, default: 15, presets: [5, 10, 15, 30]},
        sentences: {min: 1, max: 10, step: 1, default: 1, presets: [1, 2, 3, 5]},
      },
    };
    const jsonStr = JSON.stringify(jsonObj, null, 2);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(jsonStr);
      setCopiedTokens(true);
      window.setTimeout(() => setCopiedTokens(false), 2000);
    }
    const blob = new Blob([jsonStr], {type: 'application/json;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'design-tokens.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-10">
      {/* Header Card */}
      <div
        className={`rounded-[14px] border p-6 lg:p-8 space-y-6 ${theme.paperRaisedBg} ${theme.ruleBorder}`}
      >
        <div
          className={`flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b pb-6 ${theme.ruleBorder}`}
        >
          <div className="space-y-2 max-w-3xl">
            <div
              className={`text-[12px] leading-[18px] font-semibold uppercase tracking-[0.08em] ${theme.accentText}`}
            >
              Système de design éditorial · design_handoff_fishreader
            </div>
            <h2
              className={`m-0 font-[family-name:var(--font-serif)] font-semibold text-[28px] leading-[34px] ${theme.inkText}`}
            >
              Jetons Papier / Sépia / Nuit, Typographie Literata &amp; Machine
              d’état
            </h2>
            <p className={`m-0 text-[15px] leading-[22px] ${theme.inkMutedText}`}>
              Spécification intégrale issue du dossier{' '}
              <code className="font-mono text-[13px]">
                design_handoff_fishreader
              </code>
              {NB}: trois thèmes chauds reposants pour la lecture, zéro ombre
              portée, zéro dégradé, zéro emoji, et rédaction en français du
              Québec avec virgule décimale («{NB}1,25×{NB}»).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleCopyThemeKt}
              className={`min-h-[44px] px-4 rounded-[8px] border flex items-center gap-2 text-[14px] font-semibold cursor-pointer ${theme.paperBg} ${theme.inkMutedBorder} ${theme.inkText}`}
            >
              {copiedThemeKt ? (
                <>
                  <Check className="w-4 h-4" strokeWidth={1.5} />
                  <span>Theme.kt copié</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" strokeWidth={1.5} />
                  <span>Copier Theme.kt (Compose)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadDesignTokensJson}
              className={`min-h-[44px] px-4 rounded-[8px] flex items-center gap-2 text-[14px] font-semibold cursor-pointer ${theme.accentBg} ${theme.onAccentText}`}
            >
              <Download className="w-4 h-4" strokeWidth={1.5} />
              <span>
                {copiedTokens
                  ? 'Tokens JSON téléchargés'
                  : 'Télécharger design-tokens.json'}
              </span>
            </button>
          </div>
        </div>

        {/* 4 Non-Negotiable Editorial Rules */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              kicker: 'Esthétique',
              title: 'Zéro ombre, zéro dégradé, zéro emoji',
              desc: 'Séparation franche par filets de 1 dp (rule) et anneaux de 3 dp (paper-raised ou highlight).',
            },
            {
              kicker: 'Typographie 2+0',
              title: 'Literata & Source Sans 3',
              desc: 'Literata pour tout ce qui se lit (titres, articles, chiffres de vitesse) et Source Sans 3 pour l’interface.',
            },
            {
              kicker: 'Ergonomie Tactile',
              title: 'Cibles 44 dp / 48 dp / 64 dp',
              desc: 'Boutons secondaires ≥ 44 dp, actions principales 48 dp, bulle 56 dp et grand Play/Pause 64 dp.',
            },
            {
              kicker: 'Rédaction Québec',
              title: 'Vouvoiement & virgule décimale',
              desc: 'Ton calme sans point d’exclamation, « 1,25× », « 7 h 42 », « 64 % » et chiffres toujours tabulaires (tnum).',
            },
          ].map((rule, idx) => (
            <div
              key={idx}
              className={`rounded-[14px] border p-4 space-y-1.5 ${theme.paperBg} ${theme.ruleBorder}`}
            >
              <div
                className={`text-[12px] leading-[18px] font-semibold uppercase tracking-[0.08em] ${theme.accentText}`}
              >
                {rule.kicker}
              </div>
              <div
                className={`font-[family-name:var(--font-serif)] font-semibold text-[16px] leading-[22px] ${theme.inkText}`}
              >
                {rule.title}
              </div>
              <p
                className={`m-0 text-[13px] leading-[18px] ${theme.inkMutedText}`}
              >
                {rule.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Table 1: 3 Themes Color Tokens Matrix (Papier, Sépia, Nuit) */}
      <div
        className={`rounded-[14px] border p-6 lg:p-8 space-y-5 ${theme.paperRaisedBg} ${theme.ruleBorder}`}
      >
        <div className={`border-b pb-4 ${theme.ruleBorder}`}>
          <div
            className={`text-[12px] leading-[18px] font-semibold uppercase tracking-[0.08em] ${theme.accentText}`}
          >
            Table 01 · Jetons de couleur (colors.css &amp; Theme.kt)
          </div>
          <h3
            className={`m-0 mt-1 font-[family-name:var(--font-serif)] font-semibold text-[22px] leading-[28px] ${theme.inkText}`}
          >
            Matrice des 3 thèmes de lecture{NB}: Papier (défaut), Sépia et Nuit
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px] border-collapse">
            <thead>
              <tr
                className={`border-b text-[12px] uppercase tracking-[0.08em] ${theme.ruleBorder} ${theme.inkMutedText}`}
              >
                <th className="py-3 px-4 font-semibold">Jeton</th>
                <th className="py-3 px-4 font-semibold">Rôle dans l’interface</th>
                <th className="py-3 px-4 font-semibold">Papier (défaut)</th>
                <th className="py-3 px-4 font-semibold">Sépia</th>
                <th className="py-3 px-4 font-semibold">Nuit</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.ruleBorder}`}>
              {THEME_COMPARISON_ROWS.map((row) => (
                <tr key={row.token}>
                  <td
                    className={`py-3 px-4 font-mono font-semibold text-[13px] ${theme.inkText}`}
                  >
                    --{row.token}
                  </td>
                  <td className={`py-3 px-4 ${theme.inkMutedText}`}>
                    {row.role}
                  </td>
                  <td className="py-3 px-4 font-mono text-[13px] tabular-nums">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className={`w-4 h-4 rounded-[4px] border ${theme.ruleBorder} ${
                          row.token === 'paper'
                            ? 'bg-[#F7F2E8]'
                            : row.token === 'paper-raised'
                              ? 'bg-[#FFFCF5]'
                              : row.token === 'ink'
                                ? 'bg-[#2A241D]'
                                : row.token === 'ink-muted'
                                  ? 'bg-[#6B6155]'
                                  : row.token === 'rule'
                                    ? 'bg-[#E2D8C6]'
                                    : row.token === 'accent'
                                      ? 'bg-[#1F5F63]'
                                      : row.token === 'on-accent'
                                        ? 'bg-[#FFFCF5]'
                                        : row.token === 'highlight'
                                          ? 'bg-[#F3DC9A]'
                                          : 'bg-[#A3392B]'
                        }`}
                      />
                      <span>{row.papier}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[13px] tabular-nums">
                    {row.sepia}
                  </td>
                  <td className="py-3 px-4 font-mono text-[13px] tabular-nums">
                    {row.nuit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table 2: Complete Component & State Machine Specifications */}
      <div
        className={`rounded-[14px] border p-6 lg:p-8 space-y-5 ${theme.paperRaisedBg} ${theme.ruleBorder}`}
      >
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 ${theme.ruleBorder}`}
        >
          <div>
            <div
              className={`text-[12px] leading-[18px] font-semibold uppercase tracking-[0.08em] ${theme.accentText}`}
            >
              Table 02 · Spécifications des composants (README.md)
            </div>
            <h3
              className={`m-0 mt-1 font-[family-name:var(--font-serif)] font-semibold text-[22px] leading-[28px] ${theme.inkText}`}
            >
              Inventaire des composants, dimensions exactes et états
            </h3>
          </div>

          <div
            className={`inline-flex p-[3px] gap-[2px] rounded-[8px] border ${theme.paperBg} ${theme.ruleBorder}`}
          >
            {['ALL', 'Bulle & États', 'Lecteur & Sauts', 'Application Compagnon'].map(
              (cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterCat(cat)}
                  className={`min-h-[36px] px-3 rounded-[6px] text-[13px] font-semibold cursor-pointer ${
                    filterCat === cat
                      ? theme.segActive
                      : `${theme.inkMutedText} hover:${theme.inkText}`
                  }`}
                >
                  {cat === 'ALL' ? 'Tous (8)' : cat}
                </button>
              )
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px] border-collapse">
            <thead>
              <tr
                className={`border-b text-[12px] uppercase tracking-[0.08em] ${theme.ruleBorder} ${theme.inkMutedText}`}
              >
                <th className="py-3 px-4 font-semibold">Composant</th>
                <th className="py-3 px-4 font-semibold">Écran</th>
                <th className="py-3 px-4 font-semibold">Dimensions &amp; Cibles</th>
                <th className="py-3 px-4 font-semibold">Rayon</th>
                <th className="py-3 px-4 font-semibold">États &amp; Transitions</th>
                <th className="py-3 px-4 font-semibold">Règles d’intégration</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.ruleBorder}`}>
              {filteredSpecs.map((spec) => (
                <tr key={spec.id}>
                  <td className="py-3.5 px-4">
                    <div
                      className={`font-[family-name:var(--font-serif)] font-semibold text-[15px] ${theme.inkText}`}
                    >
                      {spec.name}
                    </div>
                    <div className={`text-[12px] ${theme.accentText}`}>
                      {spec.category}
                    </div>
                  </td>
                  <td className={`py-3.5 px-4 text-[13px] ${theme.inkText}`}>
                    {spec.screen}
                  </td>
                  <td
                    className={`py-3.5 px-4 font-mono text-[12px] tabular-nums ${theme.inkText}`}
                  >
                    {spec.dimensions}
                  </td>
                  <td
                    className={`py-3.5 px-4 font-mono text-[12px] tabular-nums ${theme.inkMutedText}`}
                  >
                    {spec.radius}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {spec.states.map((st, i) => (
                        <span
                          key={i}
                          className={`px-2 py-0.5 rounded-[4px] border text-[12px] ${theme.paperBg} ${theme.ruleBorder} ${theme.inkText}`}
                        >
                          {st}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td
                    className={`py-3.5 px-4 text-[13px] leading-[18px] max-w-xs ${theme.inkMutedText}`}
                  >
                    {spec.designNotes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Component Sandbox + Theme.kt Code Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 5 Cols: Live Primitives Sandbox */}
        <div
          className={`lg:col-span-5 rounded-[14px] border p-6 space-y-5 ${theme.paperRaisedBg} ${theme.ruleBorder}`}
        >
          <div className={`border-b pb-3 ${theme.ruleBorder}`}>
            <div
              className={`text-[12px] leading-[18px] font-semibold uppercase tracking-[0.08em] ${theme.accentText}`}
            >
              Composants interactifs de référence
            </div>
            <h3
              className={`m-0 mt-1 font-[family-name:var(--font-serif)] font-semibold text-[20px] leading-[26px] ${theme.inkText}`}
            >
              Test des contrôles du système de design
            </h3>
          </div>

          {/* 1. Segmented 5 speeds */}
          <div className="space-y-1.5">
            <div
              className={`flex items-center justify-between text-[12px] font-semibold uppercase tracking-[0.08em] ${theme.inkMutedText}`}
            >
              <span>Contrôle segmenté (5 vitesses)</span>
              <span className={`tabular-nums ${theme.inkText}`}>
                {fmtSpeed(sandboxSpeed)}
              </span>
            </div>
            <FrSegmented
              label="Vitesse"
              value={sandboxSpeed}
              onChange={setSandboxSpeed}
              theme={theme}
              options={SPEEDS.map((s) => ({value: s, label: fmtSpeed(s)}))}
            />
          </div>

          {/* 2. Stepper Secondes (5-120s) */}
          <div className="space-y-2">
            <div
              className={`text-[12px] font-semibold uppercase tracking-[0.08em] ${theme.inkMutedText}`}
            >
              <span>Stepper de saut (Literata 28 sp tabulaire)</span>
            </div>
            <FrStepper
              value={sandboxSkipSec}
              min={5}
              max={120}
              step={5}
              unit={`${NBS}s`}
              onChange={setSandboxSkipSec}
              label="Durée du saut"
              theme={theme}
            />
            <div className="grid grid-cols-4 gap-2 pt-1">
              {[5, 10, 15, 30].map((preset) => (
                <FrChip
                  key={preset}
                  selected={sandboxSkipSec === preset}
                  onClick={() => setSandboxSkipSec(preset)}
                  theme={theme}
                >
                  {preset}
                  {NBS}s
                </FrChip>
              ))}
            </div>
          </div>

          {/* 3. Play 64 dp + Arrêter danger */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setSandboxPlaying((p) => !p)}
              className={`w-[64px] h-[64px] rounded-full border-0 grid place-items-center cursor-pointer active:translate-y-[1px] ${theme.accentBg} ${theme.onAccentText}`}
            >
              {sandboxPlaying ? (
                <Pause className="w-[26px] h-[26px]" strokeWidth={1.5} />
              ) : (
                <Play className="w-[26px] h-[26px]" strokeWidth={1.5} />
              )}
            </button>

            <button
              type="button"
              onClick={() => setSandboxPlaying(false)}
              className={`min-h-[44px] px-4 rounded-[8px] border flex items-center gap-2 text-[14px] font-semibold cursor-pointer transition-colors duration-150 active:translate-y-[1px] bg-transparent ${theme.dangerBorder} ${theme.dangerText} ${theme.dangerBgHover}`}
            >
              <StopSquareIcon />
              <span>Arrêter</span>
            </button>
          </div>
        </div>

        {/* Right 7 Cols: Theme.kt Jetpack Compose File */}
        <div
          className={`lg:col-span-7 rounded-[14px] border p-6 space-y-4 ${theme.paperRaisedBg} ${theme.ruleBorder}`}
        >
          <div
            className={`flex items-center justify-between gap-2 border-b pb-3 ${theme.ruleBorder}`}
          >
            <div>
              <div
                className={`text-[12px] leading-[18px] font-semibold uppercase tracking-[0.08em] ${theme.accentText}`}
              >
                Jetpack Compose · app/fishreader/ui/theme/Theme.kt
              </div>
              <h3
                className={`m-0 mt-0.5 font-[family-name:var(--font-serif)] font-semibold text-[20px] leading-[26px] ${theme.inkText}`}
              >
                Fichier Theme.kt officiel prêt pour Android Studio
              </h3>
            </div>

            <button
              type="button"
              onClick={handleCopyThemeKt}
              className={`min-h-[40px] px-3 rounded-[8px] border flex items-center gap-1.5 text-[13px] font-semibold cursor-pointer ${theme.paperBg} ${theme.inkMutedBorder} ${theme.inkText}`}
            >
              {copiedThemeKt ? (
                <>
                  <Check className="w-4 h-4" strokeWidth={1.5} />
                  <span>Copié</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" strokeWidth={1.5} />
                  <span>Copier</span>
                </>
              )}
            </button>
          </div>

          <pre
            className={`p-4 rounded-[8px] border font-mono text-[12px] leading-[18px] overflow-x-auto max-h-[340px] ${theme.paperBg} ${theme.ruleBorder} ${theme.inkText}`}
          >
            {COMPOSE_THEME_KT_SOURCE}
          </pre>
        </div>
      </div>
    </div>
  );
}
