# Handoff : FishReader — application Android + bulle flottante

## Vue d'ensemble
FishReader lit à voix haute le texte affiché sur l'écran du téléphone, avec une voix naturelle. L'application tourne au premier plan : une **bulle flottante** reste visible par-dessus toutes les autres applications. Un toucher ouvre le **menu de lecture** ; la lecture surligne la phrase en cours directement sur l'écran de l'autre application.

Deux surfaces :
1. **Bulle flottante + menu + lecteur** (`maquettes/FishReader-Bulle-standalone.html`) — le cœur du produit.
2. **Application compagnon** (`maquettes/FishReader-Mobile-standalone.html`) — Accueil, Liseuse, Voix et vitesse.

## À propos des fichiers
Les fichiers HTML sont des **références de design** (prototypes cliquables), pas du code de production. La tâche est de **recréer ces écrans en Kotlin / Jetpack Compose (Material 3)** — ou en PWA si besoin — en reprenant exactement l'apparence et le comportement. La lecture y est **simulée** (minuterie par phrase) : le moteur vocal réel reste à brancher.

Ouvrez les fichiers `*-standalone.html` dans un navigateur : ils fonctionnent hors ligne. Le panneau « Tweaks » (bouton dans la barre d'outils) permet de changer le thème, la largeur d'écran, la forme de la bulle.

## Fidélité
**Haute fidélité.** Couleurs, typographie, espacements, rayons et états sont définitifs. Reproduire au pixel près. Les jetons sont dans `design-system/` et `Theme.kt`.

## Architecture Android recommandée
- **Overlay** : `Service` au premier plan + `WindowManager` avec `TYPE_APPLICATION_OVERLAY` (permission `SYSTEM_ALERT_WINDOW`), contenu en `ComposeView`.
- **Lecture du texte à l'écran** : `AccessibilityService` (parcours de `AccessibilityNodeInfo`, ordre de lecture, coordonnées `getBoundsInScreen` pour le surlignage). Repli : capture `MediaProjection` + OCR ML Kit quand l'arbre d'accessibilité est vide.
- **Voix** : moteur TTS neuronal hors ligne (ex. Piper / Sherpa-ONNX) ou `TextToSpeech` Android. Découper en phrases, lire phrase par phrase, exposer callbacks début/fin de phrase pour le surlignage.
- **Surlignage** : seconde fenêtre overlay non touchable (`FLAG_NOT_TOUCHABLE`) qui dessine un rectangle `highlight` (rayon 4 dp, débord 3 dp) aux coordonnées de la phrase en cours.
- **Suivre la lecture** : `AccessibilityNodeInfo.ACTION_SCROLL_FORWARD` sur le conteneur défilant quand la phrase sort des 60 % supérieurs de l'écran.
- Aucun nom de fichier, modèle ou terme technique visible par l'utilisateur.

---

## Écran 1 — Bulle flottante (overlay)

### États (machine d'état `mode`)
| mode | Affichage | Déclencheur |
|---|---|---|
| `idle` | Bulle au bord (ou pilule « Lire » en bas, option) | défaut, fin de lecture, « Arrêter » |
| `menu` | Feuille « Menu de lecture » en bas | toucher la bulle |
| `scan` | Pilule « Lecture de l’écran… » + contours accent sur les blocs détectés | « Lire cet écran » (~1,5 s) |
| `reading` | Pilule de lecture réduite **ou** lecteur déplié (`expanded`) | fin du scan, choix d'une phrase |
| `pick` | Barre « Touchez la phrase où commencer » ; phrases soulignées | « Choisir où commencer » / « Choisir un autre endroit » |
| `hidden` | Toast « La bulle est masquée… » + « Annuler » | glisser sur « Masquer » ou bouton « Masquer la bulle » |

### Bulle au repos
- Cercle 56 dp, fond `accent`, icône `volume` 22 dp couleur `on-accent`, anneau 3 dp `paper-raised` (séparation du contenu dessous, pas d'ombre).
- Aimantée au bord gauche ou droit, marge 8 dp ; position verticale libre (bornée 6 %–80 % de la hauteur).
- **Glisser** : suit le doigt (seuil 6 dp avant de considérer un glisser) ; au relâchement, s'aimante au bord le plus proche (transition 250 ms). Pendant le glisser : anneau `highlight` + cible « Masquer » (cercle 80 dp, centrée, 24 dp du bas, bordure `ink-muted`) ; au survol de la cible (rayon 56 dp) elle passe en fond `danger`. Relâcher dessus → `hidden`.
- **Rétraction automatique** (option, après 3 s sans action) : devient une languette 14 × 64 dp collée au bord, coins arrondis côté intérieur seulement ; zone tactile conservée 44 × 72 dp. Toucher → déplie et ouvre le menu.
- Variante « Pilule en bas » : 44 dp de haut, centrée, 12 dp du bas, icône 18 + « Lire » (Source Sans 3 600 14/20).

### Menu de lecture (feuille)
Carte ancrée en bas : marges 8 dp, padding 8/16/12, fond `paper`, bordure 1 dp `rule`, rayon 14, colonne avec gap 12. Toucher hors de la feuille → ferme.
1. En-tête : « Fish Reader » (Literata 600 18/24) · Badge neutre « Clara · 1,25× » · bouton fermer 44 dp.
2. Bouton primaire pleine largeur 48 dp « Lire cet écran » (icône play).
3. Bouton secondaire 48 dp « Choisir où commencer » (icône bookmark).
4. Libellé VITESSE + valeur ; contrôle segmenté 5 cases : 0,75× · 1× · 1,15× · 1,25× · 1,5× (hauteur 44).
5. Libellé VOIX ; 3 puces 44 dp : Clara, Thomas, Emma.
6. Filet `rule`.
7. Ligne « Suivre la lecture » + légende « Fish Reader fait défiler l’écran au rythme de la voix. » + interrupteur (piste 52 × 32, zone 56 × 44).
8. Bouton fantôme 48 dp « Masquer la bulle ».

### Pilule de lecture (réduite)
Centrée en bas, 12 dp du bas, largeur `100% − 32 dp` (max 360), hauteur min 64, fond `paper`, bordure `rule`, rayon 999, padding 8/8/8/16, gap 12.
- Zone ouvrable (toute la partie gauche) : onde animée 5 barres 3 dp (`accent`, 5→22 dp, 0,9 s alterné, décalage 0,12 s ; figée en pause et si « réduire les animations ») + « Clara lit » / « En pause » (600 14/20) + « Phrase 3 sur 9 · 1,25× » (400 13/18 `ink-muted`, chiffres tabulaires). Toucher → lecteur déplié.
- Bouton Play/Pause 48 dp `accent`.
- Bouton Arrêter 44 dp (carré plein 12 dp, bordure `rule`).

### Lecteur déplié
Carte en bas, marges 8, padding 12, gap 8, fond `paper`, bordure `rule`, rayon 14.
1. En-tête : avatar 36 dp (`highlight`, initiale Literata 600) · « Clara lit cet écran » / « Lecture en pause » · « Phrase 3 sur 9 » · bouton fantôme « Réduire ».
2. Barre de progression 3 dp (`rule` / `accent`, transition 300 ms) + temps écoulé / durée (12/16 tabulaires).
3. Transport (grille 1fr · auto · 1fr, gap 12) : **Reculer** (pilule 56 dp, bordure `rule`, icône rewind 22 + « −15 s ») · **Play/Pause** 64 dp · **Avancer** (« +15 s »). Les libellés suivent le réglage : « −2 phr. » en mode phrases.
4. Rangée (grille 64 · 1fr · auto) : bouton vitesse « 1,25× » (cycle entre les 5 paliers) · bouton « Sauts ±15 s » (ouvre le réglage) · bouton **Arrêter** (bordure et texte `danger`, survol fond `danger`).
5. Réglage des sauts (repliable) : libellé « AVANCER ET RECULER DE » · segmenté Secondes / Phrases · sélecteur − valeur + (Literata 500 28) : secondes 5–120 pas de 5, phrases 1–10 · raccourcis 5/10/15/30 s ou 1/2/3/5. **Persisté** (préférences).
6. Bouton fantôme « Choisir un autre endroit ».

### Saut en secondes
Converti en nombre de phrases selon la durée estimée de chaque phrase à la vitesse courante (avec un vrai TTS : utiliser les horodatages audio).

### Surlignage dans l'application dessous
Phrase en cours : fond `highlight` + débord 3 dp, rayon 4, transition 250 ms. En mode `pick`, phrases soulignées `rule` décalage 4 dp ; survol/pression = surlignage.

---

## Écran 2 — Application compagnon
En-tête 52 dp + barre d'onglets 60 dp (≤ 15 % de la hauteur). Onglets : Accueil, Liseuse, Voix (icônes 20 dp dans une pastille 56 × 28, active = `paper-raised` + anneau `rule` + icône `accent`).

- **Accueil** : « Bon retour, Armel » (Literata 600 26/32) ; liste « RÉCENTS » (lignes 64 dp, titre 600 15/22, méta 13/18, barre de progression) ; en bas (zone du pouce) carte Réglages rapides : interrupteur Bulle de lecture + badge Active/En pause, bouton « Voir la bulle en action », segmenté vitesse 5 paliers, puces voix.
- **Liseuse** : colonne de lecture Literata 19/30 (réglable 16–24), titre 26/32, mode karaoké, toucher une phrase = lire depuis là, défilement automatique ; lecteur 60 dp au-dessus des onglets (−15 s, play 48, suivant, vitesse) ; bouton « Nouveau texte » → feuille plein écran (zone de texte Literata 17/27, compteur de mots, « Coller depuis le presse-papiers », « Lire ce texte » désactivé si vide, message d'erreur presse-papiers).
- **Voix et vitesse** : 3 cartes de voix (Clara — Français (Québec) · Studio ; Thomas — Français (Québec) · Posé ; Emma — English (US)) avec bouton d'écoute d'extrait 44 dp ; curseur 0,5×–2× pas 0,05 + valeur Literata 44 tabulaire + raccourcis ; segmenté Timbre : Plus doux / Naturel / Plus clair.

---

## Règles d'interaction communes
- Survol : éléments neutres → fond `paper`/`paper-raised` ; primaires → luminosité ×1,08. Pression : translation 1 dp vers le bas (jamais d'agrandissement). Focus : contour 2 dp `accent`, décalage 2 dp. Désactivé : opacité 0,5.
- Transitions : couleurs 150 ms, surlignage 250 ms, progression 300 ms, aimantation 250 ms. Pas de rebond, pas d'animation d'entrée.
- Cibles tactiles ≥ 44 dp partout, 48 dp pour les actions principales.
- **Aucune ombre portée**, aucun dégradé, aucun emoji, aucun logo de poisson.

## Rédaction
Français du Québec, vouvoiement, ton calme, pas de point d'exclamation. Virgule décimale (« 1,25× »), espace insécable fine avant « : ; ! ? », « 7 h 42 », « 64 % ». L'application parle d'elle-même à la 3e personne (« Fish Reader fait défiler… »).

## Jetons de design
Voir `design-system/tokens/*.css`, `design-tokens.json` et `Theme.kt`. Trois thèmes : Papier (défaut), Sépia, Nuit.
| Jeton | Papier | Sépia | Nuit |
|---|---|---|---|
| paper | #F7F2E8 | #EFE3CC | #1C1A17 |
| paper-raised | #FFFCF5 | #F6ECD9 | #26231F |
| ink | #2A241D | #3B2F22 | #ECE4D6 |
| ink-muted | #6B6155 | #6A5843 | #A89E8F |
| rule (décoratif) | #E2D8C6 | #D9C7A6 | #3A352E |
| accent | #1F5F63 | #1D5458 | #7FB8B3 |
| on-accent | #FFFCF5 | #FFFCF5 | #1C1A17 |
| highlight | #F3DC9A | #E6C97F | #5A4A1F |
| danger | #A3392B | #97342A | #E08A7C |

Espacements 4 · 8 · 12 · 16 · 24 · 40. Rayons 4 · 8 · 14 · 999. Polices : **Literata** (tout ce qui se lit, titres, chiffres de vitesse) et **Source Sans 3** (interface) — fichiers dans `design-system/fonts/`. Chiffres toujours tabulaires (`fontFeatureSettings = "tnum"`).

## Icônes
Jeu maison, grille 24, trait 1,5, extrémités rondes : home, studio, voices, rewind, forward, play, pause, volume, close, bookmark, plus, copy… (voir `sources/_ds/.../_ds_bundle.js`). Substituts ajoutés : **stop** (carré plein 12 dp, rayon 2) et **moins** (trait horizontal) — équivalents Lucide `square` / `minus` à trait 1,5.

## Fichiers
- `maquettes/` — prototypes autonomes à ouvrir dans un navigateur.
- `sources/` — code source des prototypes (HTML + JSX) : `fr-bubble.jsx` (bulle, menu, lecteur, sauts), `fr-mobile-screens.jsx` (écrans compagnon), `fr-mobile-parts.jsx` (données, logique de lecture `usePlayback`, transport).
- `design-system/` — jetons CSS, styles des composants, polices.
- `design-tokens.json`, `Theme.kt` — jetons prêts pour Compose.
- `PROMPT_AI_STUDIO.md` — consigne à coller dans Google AI Studio.
