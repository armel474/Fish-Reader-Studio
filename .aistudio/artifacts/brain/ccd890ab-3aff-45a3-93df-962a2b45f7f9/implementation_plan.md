# FishReader — Studio de Simulation Android & Architecture Kotlin (Sherpa-ONNX / Piper TTS)

Cet environnement combine un **simulateur interactif fidèle de l'overlay Android FishReader** (ancrage magnétique, inspection de l'arborescence `AccessibilityNodeInfo`, filtrage heuristique des bruits d'interface, canal de secours OCR et lecture vocale temps réel) avec un **explorateur d'architecture Kotlin complet et exportable** prêt à être compilé dans Android Studio.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Les choix d'architecture suivants ont été validés lors de la phase de clarification et gouvernent l'implémentation du code natif Kotlin ainsi que le simulateur interactif :

- **Environnement de travail hybride confirmé** : Un espace de travail unifié associant un simulateur interactif d'appareil Android (avec contrôle en direct de la bulle flottante FishReader au-dessus de vraies applications simulées) et l'intégralité du code source Kotlin, de la configuration Gradle et du Manifeste Android avec copie/export en un clic.
- **Capture d'écran pour le Fallback OCR ML Kit** : Implémentation basée sur l'API native `AccessibilityService.takeScreenshot()` (Android 11 / API 30+), permettant de capturer l'écran instantanément en mémoire (`HardwareBuffer` converti en `Bitmap`) sans déclencher la boîte de dialogue système intrusive de `MediaProjection`.
- **Approvisionnement des modèles vocaux Piper TTS** : Les modèles ONNX quantifiés (`fr_FR-upmc-medium.onnx` et `en_US-amy-low.onnx` + `tokens.txt` + `espeak-ng-data`) sont pré-embarqués dans le dossier `assets/` de l'APK puis extraits de manière asynchrone vers `context.filesDir` au premier démarrage afin de permettre à l'API C++ JNI de Sherpa-ONNX d'y accéder par chemin de fichier POSIX.

---

## 1. Overview & Core Concept

- **Fonctionnement** : FishReader agit comme un service d'accessibilité et de superposition permanent sur Android. Une bulle escamotable en forme de poisson s'aimante aux bords gauche ou droit de l'écran. D'un simple appui, le système parcourt l'arbre des nœuds UI visibles (`AccessibilityNodeInfo`), élimine les éléments parasites (barres d'état, compteurs sociaux, menus de navigation, boutons isolés), segmente le texte pertinent en phrases, détecte la langue (FR/EN) et lance immédiatement la synthèse vocale neuronale hors ligne via Sherpa-ONNX et Piper TTS.
- **Public cible & Persona** : Utilisateurs mobiles multi-tâches (professionnels, étudiants, lecteurs d'articles longs ou de fils sociaux) souhaitant écouter le contenu affiché à l'écran sans fatigue visuelle et avec une confidentialité absolue (zéro donnée envoyée dans le cloud).
- **Valeur ajoutée** : Latence de première phrase inférieure à 400 ms grâce au découpage incrémental, compatibilité universelle grâce au basculement automatique entre l'arbre d'accessibilité et la reconnaissance optique ML Kit v2, et code Kotlin structuré selon les standards Clean Architecture modernes.

---

## 2. User Experience & Visual Design

### Parcours Utilisateur Clés
1. **Simulation Interactive de l'Overlay (Appareil Android Virtuel)** :
   - L'utilisateur choisit une application active sur l'écran Android simulé : *Article de Presse Long*, *Fil Social X/Twitter*, *Client Email Pro*, ou *Application Canvas / PDF verrouillé (Test Fallback OCR)*.
   - L'utilisateur fait glisser verticalement et horizontalement la bulle **FishReader** ; lorsqu'il la relâche, un ressort physique (`Spring`) l'aimante automatiquement au bord gauche ou droit de l'écran.
   - Un appui sur le poisson déploie le panneau de contrôle flottant (Play/Pause, Saut `-30s` / phrase précédente, jauge de progression par phrase, langue détectée FR/EN et bouton de repli).
2. **Inspection Visuelle du Pipeline d'Extraction & Filtrage** :
   - Un mode « Rayons X (Inspecteur de Nœuds) » met en évidence sur l'écran Android les rectangles englobants (`Rect`) des nœuds `AccessibilityNodeInfo` retenus en vert émeraude et les nœuds parasites rejetés (compteurs, barres de navigation, horodatages courts) en rouge atténué, illustrant en temps réel l'algorithme heuristique.
   - Lorsque l'application *Canvas / PDF verrouillé* est sélectionnée, l'arbre UI renvoie une liste vide et déclenche visiblement le pipeline de secours `takeScreenshot()` + `ML Kit Text Recognition v2`.
3. **Consultation & Export du Code Production Kotlin** :
   - L'utilisateur navigue entre les modules architecturaux (Service Overlay Compose + `WindowManager`, `FishAccessibilityService` + Heuristiques, `MlKitOcrFallbackManager`, `SherpaOnnxTtsEngine` + copie `assets`, `ForegroundService` MediaPlayback, `AndroidManifest.xml` et `build.gradle.kts` / `libs.versions.toml`).
   - Chaque module affiche le code Kotlin complet, commenté et prêt pour la production, accompagné d'un guide d'intégration pas à pas et d'un bouton de copie ou de téléchargement d'archive.

### Identité Visuelle & Thème
- **Direction Esthétique** : Console d'ingénierie Android & Audio de haute précision — sobre, technique et lisible, privilégiant l'espace négatif, des bordures fines de `1px` et une hiérarchie typographique nette.
- **Palette de Couleurs (Discipline 60-30-10)** :
  - *60 % Surface Dominante* : Ardoise profonde (`#0B0F17` / `--background`) pour le canevas de travail, réduisant la fatigue visuelle lors de la lecture du code et faisant ressortir l'écran Android.
  - *30 % Surfaces Structurelles* : Gris acier sombre (`#111827` et `#1E293B`) avec séparateurs subtils (`rgba(255, 255, 255, 0.08)`) et typographie secondaire (`#94A3B8`).
  - *10 % Budget d'Accentuation* : Cyan bioluminescent (`#06B6D4` / `--primary`) pour le widget FishReader et les contrôles audio actifs, complété par des couleurs sémantiques strictement fonctionnelles : Émeraude (`#10B981`) pour les nœuds UI retenus et Ambre (`#F59E0B`) lors de l'activation du fallback OCR ML Kit.
- **Typographie & Hiérarchie (Règle 2+1)** :
  - *Titres & Navigation* : `Plus Jakarta Sans` (SemiBold/Bold, suivi serré) pour une structure nette.
  - *Corps & Documentation* : `DM Sans` (Regular/Medium) pour une lecture fluide des explications architecturales.
  - *Code Kotlin & Métriques Audio* : `JetBrains Mono` avec chiffres tabulaires (`tabular-nums`) pour l'alignement strict des latences (ms), coordonnées de nœuds (`px`) et compteurs temporels.

---

## 3. Key Product Decisions & Trade-Offs

- **Décision 1 : Hôte Jetpack Compose dans un `WindowManager` Service (`ComposeView` + `LifecycleOwner` personnalisé)**
  - *Approche choisie* : Création d'une classe `OverlayLifecycleOwner` implémentant `LifecycleOwner`, `ViewModelStoreOwner` et `SavedStateRegistryOwner` attachée au `ComposeView` via `ViewTreeLifecycleOwner`.
  - *Pourquoi* : Un `Service` Android ne possède pas de cycle de vie d'activité par défaut ; sans cet adaptateur, `ComposeView` lève une exception au moment de la recomposition et des animations `Animatable`.
  - *Alternative écartée* : Les vues XML classiques (`RemoteViews` ou `FrameLayout` impératif), plus difficiles à maintenir pour les transitions fluides entre la bulle poisson et le lecteur déployé.
- **Décision 2 : Heuristique de filtrage des nœuds `AccessibilityNodeInfo` par densité sémantique et géométrie**
  - *Approche choisie* : Élimination des nœuds invisibles (`!isVisibleToUser`), des contrôles purement interactifs (`Button`, `CheckBox`, `Switch`), des zones situées dans les barres système (haut/bas extrêmes), et des chaînes courtes purement numériques ou horodatées (ex. `"12.4K"`, `"Il y a 5 min"`), suivie d'un tri spatial de haut en bas (`rect.top`) puis de gauche à droite (`rect.left`).
  - *Pourquoi* : Garantit que seuls les paragraphes et titres porteurs d'information sont envoyés au moteur TTS, évitant la lecture fastidieuse des menus et compteurs.
- **Décision 3 : Découpage par phrases (Sentence Chunking) et file d'attente Coroutines `Channel` pour Sherpa-ONNX**
  - *Approche choisie* : Le texte nettoyé est découpé selon la ponctuation forte (`.`, `!`, `?`, `\n`) avant d'être envoyé phrase par phrase à `OfflineTts.generate()`, tandis qu'un `AudioTrack` en mode `MODE_STREAM` joue le tampon PCM 16-bit dès que la première phrase est synthétisée.
  - *Pourquoi* : Synthétiser un article entier de 2 000 mots d'un seul bloc bloquerait la première parole pendant plusieurs secondes ; le découpage par phrase abaisse la latence initiale sous la barre des 350 ms et permet un saut `-30s` (ou recul de 2 phrases) instantané.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Diagramme des Composants

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                     ESPACE DE TRAVAIL WEB FISHREADER STUDIO                  │
├──────────────────────────────────────┬───────────────────────────────────────┤
│   SIMULATEUR INTERACTIF ANDROID      │    EXPLORATEUR D'ARCHITECTURE KOTLIN  │
│                                      │                                       │
│  ┌────────────────────────────────┐  │  ┌─────────────────────────────────┐  │
│  │ Écran Application Sous-jacente │  │  │ Sélecteur de Modules & Fichiers │  │
│  │ (Presse / X / Email / Canvas)  │  │  │ (Overlay / Accessibility / TTS) │  │
│  └───────────────┬────────────────┘  │  └────────────────┬────────────────┘  │
│                  │                   │                   │                   │
│                  ▼                   │                   ▼                   │
│  ┌────────────────────────────────┐  │  ┌─────────────────────────────────┐  │
│  │   Widget Flottant FishReader   │  │  │ Visualiseur Code Kotlin Complet │  │
│  │ (Aimantation Bords + Contrôles)│  │  │ + Copie Directe & Export Projet │  │
│  └───────────────┬────────────────┘  │  └────────────────┬────────────────┘  │
│                  │ Tap Lecture       │                   │                   │
│                  ▼                   │                   ▼                   │
│  ┌────────────────────────────────┐  │  ┌─────────────────────────────────┐  │
│  │ Pipeline d'Extraction & Filtre │  │  │ Guide Pas-à-Pas d'Intégration   │  │
│  │  ├─ 1. Arbre AccessibilityNode │  │  │ (Gradle, JNI Sherpa, Permissions│  │
│  │  └─ 2. Fallback OCR ML Kit v2  │  │  │  & Cycle de vie Service)        │  │
│  └───────────────┬────────────────┘  │  └─────────────────────────────────┘  │
│                  │ Phrases nettoyées │                                       │
│                  ▼                   │                                       │
│  ┌────────────────────────────────┐  │                                       │
│  │ Synthèse Audio (Sherpa-ONNX)   │  │                                       │
│  │ File de phrases + Saut -30s    │  │                                       │
│  └────────────────────────────────┘  │                                       │
└──────────────────────────────────────┴───────────────────────────────────────┘
```

### Modèle de Données & États Clés
- **État du Widget Overlay (`OverlayUiState`)** : Position `(x, y)`, côté d'aimantation (`DockSide.LEFT` | `DockSide.RIGHT`), mode d'affichage (`CollapsedBubble` | `ExpandedPlayer`), état de lecture (`Idle`, `Extracting`, `Speaking`, `Paused`), indice de la phrase courante et liste des phrases extraites.
- **Nœuds d'Écran Simulés & Réels (`ScreenNode`)** : Identifiant, classe Android (`android.widget.TextView`, `android.widget.Button`, `android.view.View`), texte brut, boîte englobante `(top, left, width, height)`, statut de filtrage (`ACCEPTED` | `FILTERED_OUT`) et motif précis d'inclusion ou d'exclusion heuristique.
- **Référentiel de Code Production (`KotlinModuleArtifact`)** : Regroupe les couches complètes du projet Android (`build.gradle.kts`, `AndroidManifest.xml`, `accessibility_service_config.xml`, `OverlayService.kt`, `OverlayComposeView.kt`, `FishAccessibilityService.kt`, `ScreenTextCleaner.kt`, `MlKitOcrFallback.kt`, `SherpaOnnxTtsManager.kt`, `AssetModelExtractor.kt`, `MainActivity.kt`).

### Correspondance Composants Interactifs & Transitions d'État
- **Glisser-déposer et Magnétisme de la Bulle** : Le déplacement du pointeur met à jour `(x, y)` en temps réel ; au relâchement (`onPointerUp`), la coordonnée horizontale est comparée à `screenWidth / 2` pour animer la bulle vers `x = 0` (bord gauche) ou `x = screenWidth - bubbleWidth` (bord droit).
- **Déclenchement de l'Extraction & Bascule OCR Automatique** : Cliquer sur la bulle ou sur le bouton Lecture inspecte l'application active. Si l'application possède des nœuds `AccessibilityNodeInfo` accessibles, le filtre heuristique trie et nettoie les paragraphes ; si l'application choisie est en mode Canvas verrouillé, le système exécute la séquence `takeScreenshot()` + `TextRecognition.getClient()` et restitue les blocs reconnus.
- **Contrôles Audio Temps Réel (Play / Pause / -30s / Saut de Phrase)** : La synthèse vocale lit chaque segment séquentiellement (avec retour sonore via l'API Web Speech locale dans le navigateur et visualisation de l'onde audio), met en surbrillance la phrase active à l'écran et permet de reculer instantanément de 30 secondes (ou de revenir aux phrases précédentes).
