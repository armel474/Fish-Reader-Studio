# FishReader — Refonte de l'Overlay Android, Surbrillance Directe sur l'Écran & Fluidité Vocale

Cette mise à jour transforme l'expérience de lecture par-dessus les applications Android (comme Facebook, Chrome ou X) en remplaçant la pilule horizontale encombrante et l'aperçu de texte redondant par un petit bouton rond discret au repos, une sélection directe du paragraphe de départ sur l'écran après un bref scan visuel, une surbrillance en direct sur la publication, et un repli automatique en **petite pilule verticale** (`cercle animé + trois petits points`).

### User Review & Critical Decisions

> [!IMPORTANT]
> Les décisions suivantes intègrent directement vos réponses confirmées :

- **Décision confirmée 1 — Au repos : Petit bouton rond semi-transparent (`44×44 dp`)** :
  - En navigation normale, seule une petite bulle ronde semi-transparente (opacité ~62 %) affichant le logo FishReader est visible sur le bord de l'écran.
  - Un appui court lorsqu'aucune lecture n'est en cours lance un **bref scan visuel de l'écran (~450 ms)** et affiche les **blocs de paragraphes encadrés et cliquables** directement par-dessus l'application cible.
- **Décision confirmée 2 — Sélection tactile du point de départ & Surbrillance directe sur l'écran** :
  - Après le scan (qui filtre les en-têtes parasites comme « *FAN theory · Suivre · 4 h · Public* »), l'utilisateur **touche directement le paragraphe encadré de son choix sur l'écran** pour commencer la lecture à partir de cet endroit précis.
  - Pendant la lecture, le paragraphe ou la phrase en cours est **surligné directement par-dessus le post original** sur l'écran (aucune zone de texte redondante dans le lecteur flottant).
- **Décision confirmée 3 — En lecture : Repli automatique en petite pilule orientée verticalement (`[ ◉ / ⋯ ]`)** :
  - Dès que la lecture commence, le lecteur se replie automatiquement dans une **petite pilule verticale** discrète collée au bord de l'écran, contenant :
    1. **Un petit cercle animé** (logo entouré d'un halo lumineux animé pendant la lecture, permettant de mettre en Pause / Lecture d'un simple toucher sans jamais repartir au début).
    2. **Les trois petits points (`⋯`)** juste en dessous pour ouvrir à la demande le **panneau de configuration compact (sans zone de texte redondante)** afin de régler la voix (`Clara`, `Thomas`, `Nicolas`), la vitesse WPM (`0,85×` à `2×`), le saut de phrase (`-1` / `+1`), le bouton `Stop (⏹)` et le bouton `Texte copié`.
- **Décision confirmée 4 — Périmètre de cette étape (Report du défilement automatique)** :
  - Nous concentrons cette version sur le bon fonctionnement et la fluidité de ces améliorations (bulle ronde, scan, sélection sur l'écran, surbrillance directe, pilule verticale, voix masculines naturelles, WPM, `Stop` et `Texte copié`). Le défilement automatique de l'écran sera abordé dans une étape ultérieure une fois ces fondations validées.

---

### 1. Overview & Core Concept

- **What It Does** : FishReader agit comme un lecteur vocal universel superposé aux applications Android. Il scanne visuellement l'écran d'un toucher sur son petit bouton rond, encadre les paragraphes détectés pour que l'utilisateur touche exactement là où il souhaite démarrer la lecture, surligne le texte lu en direct sur l'application cible, et se replie automatiquement en une fine pilule verticale (`cercle animé + ⋯`).
- **Target Audience / Persona** : Utilisateurs mobiles souhaitant écouter de longues publications (Facebook, articles web, fils de discussion) tout en suivant visuellement le texte directement sur leur écran sans qu'une carte flottante ne masque le contenu.
- **Key Value** : Navigation sans gêne visuelle grâce à la pilule verticale ultra-compacte, liberté totale de choisir à partir de quel paragraphe lire, suivi visuel naturel par surbrillance directe sur le post, et synthèse vocale fluide avec de vraies voix masculines distinctes et un débit WPM sans distorsion.

---

### 2. User Experience & Visual Design

- **Key User Flows** :
  1. **État de veille (Petit rond discret)** :
     - Un bouton rond de `44×44 dp` semi-transparent flotte au bord de l'écran.
  2. **Scan rapide & Choix tactile du paragraphe de départ** :
     - L'utilisateur touche le petit rond : une brève ligne lumineuse balaie l'écran (`450 ms`).
     - Les paragraphes du post (débarrassés des en-têtes « *Suivre · 4 h · Public* ») s'entourent d'un cadre fin cliquable directement sur l'écran, accompagné d'une petite bannière discrète en haut (« *Touchez un paragraphe pour lire à partir d'ici (ou Tout lire)* »).
     - Dès que l'utilisateur touche un paragraphe encadré, la lecture démarre immédiatement à ce paragraphe.
  3. **Lecture active : Pilule verticale (`[ ◉ / ⋯ ]`) + Surbrillance directe sur l'écran** :
     - Les cadres de sélection disparaissent pour laisser place à **une seule surbrillance douce** qui suit en direct le paragraphe/la phrase lu(e) sur le post Facebook.
     - Le widget flottant se replie automatiquement en une **petite pilule verticale** (`44 dp` de large par `84 dp` de haut) contenant :
       - **En haut** : le petit cercle avec le logo et un halo lumineux pulsant (un toucher met en pause ou reprend la lecture à l'endroit exact).
       - **En bas** : le bouton `⋯` (trois petits points) permettant d'ouvrir le panneau de configuration.
  4. **Panneau de configuration compact (via `⋯`, sans zone de texte redondante)** :
     - Un appui sur `⋯` déploie une barre/carte compacte contenant uniquement les contrôles essentiels :
       - Choix de la voix : `Clara (Femme)`, `Thomas (Homme - Grave)`, `Nicolas (Homme - Narrateur)`.
       - Débit de parole WPM : `0,85×`, `1×`, `1,25×`, `1,5×`, `1,75×`, `2×` (à hauteur vocale fixe).
       - Contrôles de transport : `-1 phr.`, `Pause / Lire`, `+1 phr.`, et bouton **`Stop (⏹)`** qui arrête réellement toute la lecture et ramène le widget au petit rond de veille.
       - Actions rapides : `Relire / Scanner l'écran` et `Texte copié`.

- **Visual Identity & Theme** :
  - *Aesthetic Direction* : Éditorial épuré et utilitaire mobile (« Encre & Papier »), privilégiant la transparence optique, les cibles tactiles confortables ($\ge 44 \times 44\text{px}$) et une empreinte visuelle minimale.
  - *Color Palette & Mood* :
    - Petit rond de veille et pilule verticale : surface sombre/ardoise translucide (`rgba(20, 19, 17, 0.68)`) avec fine bordure et halo vert sauge (`#4BA37E`) animé autour du cercle lorsque la voix parle.
    - Cadres de sélection & Surbrillance directe sur l'écran : fond vert sauge très léger (`rgba(75, 163, 126, 0.16)`) et bordure nette (`2dp solid #1E4D3B`) permettant de lire parfaitement le texte noir sur blanc en dessous.
  - *Typography & Hierarchy* : `Literata` pour les titres de l'application, `Source Sans 3` pour les étiquettes de boutons sur une seule ligne, et `JetBrains Mono` (`tabular-nums`) pour l'affichage du débit WPM.
  - *Component Styling & Layout* : Alignement complet entre le nouvel APK Android généré (`FishReader.apk`) et le simulateur interactif de l'application web.

- **Interactive Feedback & Motion** :
  - Balayage lumineux de `450 ms` lors du scan de l'écran.
  - Halo respirant fluide autour du petit cercle supérieur de la pilule verticale pendant la lecture.
  - Déplacement fluide du rectangle de surbrillance d'un paragraphe au suivant au fil de la lecture.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1 — Calque de sélection puis de surbrillance directe via `AccessibilityNodeInfo.getBoundsInScreen(Rect)`**
  - *Chosen Approach* : Utiliser une fenêtre superposée plein écran transparente qui est *cliquable* uniquement pendant la phase de choix du paragraphe de départ, puis passe immédiatement en mode *totalement perméable aux touchers* (`FLAG_NOT_TOUCHABLE`) dès que la lecture commence afin de dessiner la surbrillance sur le post tout en laissant l'utilisateur interagir librement avec son téléphone.
  - *Why* : Offre à la fois la sélection tactile directe sur le texte à l'écran et le suivi visuel en direct sans jamais bloquer l'application en arrière-plan pendant l'écoute.
  - *Alternatives Considered* : Garder la boîte de texte dans la carte flottante (rejeté car redondant et encombrant).

- **Decision 2 — Repli automatique en petite pilule verticale (`[ Cercle animé / ⋯ ]`)**
  - *Chosen Approach* : Dès qu'un paragraphe est touché et que la lecture démarre, réduire l'interface flottante en une pilule verticale étroite accolée au bord de l'écran avec le cercle animé en haut et les trois petits points en bas.
  - *Why* : Une pilule verticale épouse le bord latéral du téléphone sans empiéter sur la largeur des paragraphes du post, tout en gardant la pause (`◉`) et les réglages (`⋯`) accessibles d'un seul pouce.
  - *Alternatives Considered* : Pilule horizontale (rejetée car elle coupe les fins de lignes de texte sur l'écran).

- **Decision 3 — Différenciation acoustique réelle des voix masculines (`Thomas` vs `Nicolas`) et régulation WPM**
  - *Chosen Approach* : Attribuer à `Thomas` et `Nicolas` deux voix masculines distinctes du moteur TTS Android (en inspectant `tts.voices` par locale `fr-FR` / `fr-CA` et caractéristiques vocales) complétées par des formants et cadences distincts, tout en contrôlant le débit WPM sans jamais décaler la hauteur tonale vers les aigus à `1,5×`–`2×`.
  - *Why* : Corrige les voix masculines identiques/saccadées et l'effet « voix aiguë » observés lors du test vidéo.
  - *Alternatives Considered* : Simple changement d'étiquette sur la même voix par défaut (rejeté).

- **Decision 4 — Correction franche du bouton `Stop (⏹)` et lecture fiable du `Texte copié` sur Android 10+**
  - *Chosen Approach* :
    - Le bouton `Stop (⏹)` coupe immédiatement la synthèse (`tts.stop()`), vide les phrases en mémoire, retire la surbrillance à l'écran et ramène le widget au petit rond de veille.
    - Le bouton `Texte copié` combine la détection de sélection dans l'arbre d'accessibilité (`TYPE_VIEW_TEXT_SELECTION_CHANGED`) avec une prise de focus éphémère (`80 ms`) de la fenêtre flottante au moment du clic pour autoriser la lecture de `ClipboardManager.getPrimaryClip()` sur Android 10 à 16.
  - *Why* : Garantit que `Stop` n'enchaîne plus sur la phrase `1/20` et que `Texte copié` fonctionne immédiatement après un « Copier » dans Facebook ou un navigateur.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram** :

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Couche Superposée Android (WindowManager)            │
├───────────────────────────────────┬─────────────────────────────────────┤
│  1. Calque Visuel Plein Écran     │  2. Widget Flottant à 4 États       │
│  • Phase Scan : Onde 450 ms       │  • Veille : Petit rond 44dp (62%)   │
│  • Phase Choix : Cadres tactiles  │  • Lecture : Pilule verticale       │
│    sur chaque paragraphe détecté  │    ┌─────┐                          │
│  • Phase Lecture : Surbrillance   │    │  ◉  │ <- Cercle animé (Pause)  │
│    directe non-bloquante (Rect)   │    │ ─── │                          │
│                                   │    │  ⋯  │ <- Menu configuration    │
│                                   │    └─────┘                          │
│                                   │  • Menu (⋯) : Barre compacte sans   │
│                                   │    zone de texte (Voix, WPM, Stop)  │
└─────────────────▲─────────────────┴──────────────────▲──────────────────┘
                  │ Coordonnées Rect & Index actif     │ Commandes UI
┌─────────────────┴────────────────────────────────────┴──────────────────┐
│                Contrôleur d'Orchestration & Service Accessibilité       │
│  • Extraction AccessibilityNodeInfo + BoundsInScreen(Rect)              │
│  • Filtrage anti-bruit social (En-têtes Facebook, "Suivre", "4 h")      │
│  • Capture Presse-Papiers Android 10-16 (Focus éphémère 80ms + Copie)   │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │ Paragraphes indexés & Débit WPM
┌───────────────────────────────────▼─────────────────────────────────────┐
│               Moteur Audio & Prosodie WPM (Clara / Thomas / Nicolas)    │
│  • Sélection de voix distinctes (Femme, Homme Baryton, Homme Narrateur) │
│  • Régulation WPM (130 à 310 mots/min) à hauteur F0 strictement fixe    │
│  • Arrêt franc (Stop ⏹) avec purge complète et retour au petit rond     │
└─────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State** :
  - `ScreenParagraphBlock` : Associe chaque paragraphe extrait à son texte nettoyé et à ses coordonnées exactes sur l'écran (`bounds: Rect`).
  - `OverlayUiState` : Machine à états explicite :
    1. `IDLE_CIRCLE` : Petit rond semi-transparent avec le logo.
    2. `SCANNING_AND_SELECTING` : Balayage lumineux (`450 ms`), puis affichage des cadres de paragraphes cliquables directement sur l'écran pour choisir à partir d'où lire.
    3. `PLAYING_VERTICAL_PILL` : Petite pilule verticale (`[ ◉ / ⋯ ]`) au bord de l'écran + surbrillance directe sur le paragraphe en cours de lecture sur le post.
    4. `CONFIG_PANEL_OPEN` : Panneau compact sans zone de texte redondante, ouvert via `⋯` (sélection de voix, débit WPM, `-1/+1 phr.`, `Stop ⏹`, `Texte copié`, `Nouveau scan`).

- **Interactive Component & State Mapping** :
  - **Appui sur le Petit Rond (`IDLE_CIRCLE`)** : Déclenche l'onde de scan (`450 ms`), extrait les paragraphes du post (en filtrant l'en-tête social), et affiche les cadres cliquables sur l'écran (`SCANNING_AND_SELECTING`).
  - **Toucher sur un paragraphe encadré à l'écran (`SCANNING_AND_SELECTING`)** : Lance la lecture à partir de ce paragraphe précis, active la surbrillance directe sur l'écran, et replie automatiquement le contrôleur dans la **petite pilule verticale** (`PLAYING_VERTICAL_PILL`).
  - **Toucher sur le Cercle animé (`◉`) de la pilule verticale** : Met en pause ou reprend la lecture au mot/paragraphe courant sans ouvrir de panneau ni recommencer au début.
  - **Toucher sur les trois petits points (`⋯`) de la pilule verticale** : Ouvre ou referme le panneau compact de configuration (`CONFIG_PANEL_OPEN`) pour changer de voix, de vitesse WPM ou sauter une phrase.
  - **Toucher sur `Stop (⏹)`** : Arrête immédiatement l'audio, efface la surbrillance sur l'écran, vide la liste de lecture et ramène le bouton flottant au **petit rond discret** (`IDLE_CIRCLE`).
  - **Toucher sur `Texte copié`** : Acquiert brièvement le focus fenêtre (`80 ms`) pour lire le presse-papiers Android 10+ (ou la sélection d'accessibilité active), lance la lecture du texte copié et replie le lecteur dans la petite pilule verticale.
