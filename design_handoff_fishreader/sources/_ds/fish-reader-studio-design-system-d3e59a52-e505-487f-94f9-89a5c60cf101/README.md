# Fish Reader Studio — Design System

> Lire longtemps, sans fatigue.

**Fish Reader** (FishReader) is a text‑reading app: it reads aloud any text shown on a screen — documents, EPUB/PDF, and text from other apps open on the phone. **Fish Reader Studio** is the desktop/web companion where people import texts, read them in a calm reading column with the sentence being spoken highlighted, pick a voice, and track their listening history. The interface should disappear: text first, tools second.

## Sources

- **Uploaded kit** (ground truth for visuals): `uploads/fish-reader-studio-design-system/` — tokens (`tokens.css`, `tokens.json`), self‑hosted fonts, a vanilla React bundle of 10 components + 3 screens (Accueil, Studio, Voix), and reference screenshots in three themes.
- **GitHub**: [armel474/Fish-Reader-Studio](https://github.com/armel474/Fish-Reader-Studio) (branch `main`) — a Next.js engineering showcase: interactive Android overlay simulator (floating Jetpack Compose widget, AccessibilityService text extraction, ML Kit OCR fallback, offline Sherpa‑ONNX / Piper neural TTS) and a Kotlin code workbench. Its own styling (dark `#0B0F17`, cyan, Plus Jakarta Sans / DM Sans / JetBrains Mono, lucide‑react) is a developer‑demo look, **not** the product brand — this system follows the uploaded kit. Explore the repo for product behaviour (overlay widget, TTS pipeline, prosody) when designing mobile/Android surfaces.

## Index

- `styles.css` — single entry point (imports only).
- `tokens/` — `fonts.css` (@font-face), `colors.css` (3 themes + semantic aliases), `typography.css`, `spacing.css`, `tokens.json` (source).
- `fonts/` — Literata 400/500/600, Source Sans 3 400/500/600 (woff2, latin).
- `components/components.css` — all component styles (`.fr-*` classes, token‑driven).
- `components/` — React primitives (see below), one `*.card.html` per folder.
- `ui_kits/studio/` — click‑through desktop app (Accueil, Studio, Voix).
- `guidelines/` — foundation specimen cards (Colors, Type, Spacing, Brand).
- `assets/screens/` — reference screenshots (accueil/studio/voix × light/sepia/dark).
- `SKILL.md` — Agent Skill entry point. `github.md` — source repo association.

## Components

All exported on `window.FishReaderStudioDesignSystem_d3e59a` (namespace from the compiled bundle). Wrap screens in `AppShell` (or an element with class `fr`) to get font, box-sizing and focus rings.

- **icon/** — `Icon` (+ `ICON_NAMES`)
- **actions/** — `Button`, `IconButton`
- **badge/** — `Badge`
- **inputs/** — `Segmented`, `Chip`, `SearchField`
- **navigation/** — `AppShell`, `Sidebar`, `NavItem`
- **banner/** — `Banner`
- **history/** — `SectionLabel`, `SessionList`, `SessionRow`
- **stats/** — `StatCard`
- **reader/** — `ReaderText`, `PlayerBar`
- **voices/** — `VoiceCard`, `Wave`

All of these exist in the source bundle (`components/bundle.js`); they were ported 1:1 to JSX. Layout helper classes from the source CSS are kept: `fr-main-inner`, `fr-col`, `fr-aside`, `fr-h1`, `fr-lede`, `fr-grid`, `fr-row`, `fr-reader-top`, `fr-reader-scroll`, `fr-meter`.

**Intentional additions:** none beyond exposing `Icon`, `Chip`, `SearchField`, `NavItem`, `AppShell`, `SectionLabel`, `SessionList`, `Wave` with their own `.d.ts` (they were internal/undocumented in the source bundle but used by the screens).

## UI kits

- `ui_kits/studio/` — Fish Reader Studio desktop: Accueil → Studio (reader + read‑aloud) → Voix. Bibliothèque / Signets / Statistiques are left intentionally blank (not designed in source).

---

## CONTENT FUNDAMENTALS

- **Language**: Quebec French first, compliant with Loi 96 — every label, message and email exists in French. Another language may be added, never substituted. Voice descriptions for English voices are in English (« Calm, even narration for English documents. »).
- **Address**: *vouvoiement* always. « Importez un document le matin, Fish Reader le lit à voix haute sur votre téléphone. » The product speaks in third person about itself (« Fish Reader le lit »), never « je » — except a voice sample: « Bonjour, je lirai vos textes. »
- **Tone**: calm, direct, warm. Greeting by first name: « Bon retour, Armel ». No hype, no exclamation marks.
- **Buttons**: action verbs — « Reprendre la lecture », « Importer un fichier », « Nouveau texte », « Me montrer comment », « Surligner ». Short, sentence case.
- **Errors**: say what happened and what to do, no jargon. « Ce fichier est protégé. Importez une version sans DRM. »
- **Casing**: sentence case everywhere; UPPERCASE only for small eyebrow labels (« AUJOURD’HUI », « EN COURS », « CHAPITRE 3 ») via CSS `text-transform`.
- **French typography**: narrow no‑break space before « : ; ! ? » and inside « guillemets »; typographic apostrophe ’; em dash « — » in titles (« Le Survenant — Chapitre 3 »); decimal comma (« 184,2 k », « 1,25× »); times as « 7 h 42 »; « 64 % » with space.
- **Content flavour**: Québécois literature (*Le Survenant*, Germaine Guèvremont), local professional documents (Loi 25 guide, Ordre des comptables newsletter, clinic annual report).
- **Emoji**: never.

## VISUAL FOUNDATIONS

- **Vibe**: paper, not screen. A quiet editorial reading tool — warm off‑white paper, brown ink, one petrol‑teal accent, a yellow highlighter.
- **Colour**: three user‑selectable themes — **Papier** (default), **Sépia**, **Nuit** — each defines `paper`, `paper-raised`, `ink`, `ink-muted`, `rule`, `accent`, `on-accent`, `highlight`, `danger`. Never pure white or black. **One acting colour**: `accent` marks only what's actionable (primary button, link, progress, focus, active nav icon, count pill). `highlight` is for highlighting / the spoken sentence and the « Studio » badge. `danger` always with a label. Contrast AA verified in all themes; `rule` (≈1.3:1) is decorative only — field borders use `ink-muted`.
- **Type**: Literata (serif) for anything read — headings, reading column, excerpts, stat numbers, voice names, the wordmark. Source Sans 3 for UI. Never serif in buttons, never sans in read text. Reading 19/30 at 66ch, adjustable 16–24 px.
- **Spacing**: 4 · 8 · 16 · 24 · 40 (`space-1/2/4/6/10`) plus a few literal 12 px gaps from source. Panel padding 40 px; reading paragraphs separated by 24 px.
- **Radii**: 4 (highlights, badges), 8 (buttons, nav, fields), 14 (panels, cards, banner), 999 (pills, avatars, progress bars). Segmented inner buttons 6 px.
- **Borders vs shadows**: surfaces separate with 1 px `rule` hairlines — **no drop shadows** anywhere. "Shadows" in the system are only inset 1 px rings (active nav = inset `rule`; selected segment = inset `ink-muted`; selected voice = inset `accent`) and the 3 px highlight spread around the active sentence.
- **Layout**: desktop shell — 232 px sidebar on `paper`, then one big `paper-raised` panel inset 8 px with `radius-lg` + rule border (inspired by Wispr Flow). Main column + 260 px right aside. Studio: top doc bar, scrolling reading column, player bar pinned at the bottom on `paper`.
- **Cards**: `paper-raised` (or `paper` for StatCard), 1 px `rule` border, 14 px radius, no shadow. Lists are a single bordered card with hairline row dividers.
- **Backgrounds / imagery**: flat colour only. No photos, gradients, textures or illustrations — the only graphic is the **ruled‑page + highlighter band** motif (banner art, cover): translucent `on-accent` hairlines at 24 px pitch, a page rectangle at 10 % opacity, a `highlight` bar.
- **Hover**: neutral elements gain `paper` (or `paper-raised` in the sidebar) background and ink colour; primary/play buttons `filter: brightness(1.08)`; voice cards border → `ink-muted`; session rows reveal action icons (opacity 0 → 1, .15 s); sentences get a `rule`‑coloured underline.
- **Press**: buttons `translateY(1px)`. No scale.
- **Focus**: 2 px `accent` outline, 2 px offset. Never removed.
- **Disabled**: opacity .5, `not-allowed` cursor, ideally with an explanatory label.
- **Animation**: minimal. Colour/border transitions .15 s; sentence highlight .25 s; progress width .3 s. Default easing, no bounces, no entrance animations.
- **Transparency / blur**: none, except banner art opacities and banner close hover `rgba(0,0,0,.18)`.
- **Targets**: ≥ 44 px (`target-min`) for primary actions; IconButton 36 px (44 at `lg`); buttons 40 px (44 at `lg`).

## ICONOGRAPHY

- A small **house icon set** (20 glyphs) defined as inline SVG paths in the source bundle, ported as `Icon`: 24×24 grid, **1.5 px stroke**, round caps and joins, `currentColor`. `play` and `pause` are filled; `more` uses a 3 px stroke for dots. Names: home, studio, library, voices, bookmark, stats, settings, help, rewind, forward, copy, search, close, check, upload, volume, more, plus, play, pause.
- Sizes: 18 (buttons, default), 20 (sidebar nav), 22 (play, lg IconButton), 14 (check disc).
- Colour: `ink-muted` at rest, `ink` on hover, `accent` for the active nav item.
- No icon font, no PNG icons, no emoji, no unicode glyph icons. Only « × » appears as a speed suffix in text.
- Icons never stand alone for a primary action — pair with a label, or use `IconButton` (which requires an aria‑label).
- The source README recommends this style for any future set; if you need a glyph that's missing, the closest CDN match is **Lucide** at `stroke-width: 1.5` (the GitHub repo already uses lucide‑react) — flag it as a substitution.

## Logo

There is **no logo**. The wordmark is « Fish Reader » set in Literata 600 (22 px in the sidebar), `ink`, followed by a `highlight` Badge « Studio ». Do not draw a fish or any mark.

## Fonts

Literata and Source Sans 3 are self‑hosted from `fonts/` (latin subsets, 400/500/600). The source CSS also referenced Google Fonts; this system uses only the local files. Literata here is the static (non‑optical‑size) cut.
