# Consigne pour Google AI Studio

Joignez à la conversation : `README.md`, `maquettes/FishReader-Bulle-standalone.html`, `maquettes/FishReader-Mobile-standalone.html`, `design-tokens.json`, `Theme.kt` et le dossier `sources/` (au minimum `fr-bubble.jsx`, `fr-mobile-screens.jsx`, `fr-mobile-parts.jsx`). Puis collez le texte ci-dessous.

---

Tu es développeur Android senior (Kotlin, Jetpack Compose, Material 3). Je te confie le design final de **FishReader**, une application qui lit à voix haute le texte affiché à l'écran, avec une bulle flottante active par-dessus toutes les autres applications.

Les fichiers HTML joints sont des **prototypes de référence haute fidélité** : reproduis fidèlement leur apparence et leur comportement, sans copier le HTML. Le `README.md` est la spécification complète : mesures, couleurs, états, textes exacts, règles de rédaction. En cas de doute, le README fait foi.

**À livrer**, dans l'ordre :
1. Le thème Compose à partir de `Theme.kt` (3 thèmes Papier / Sépia / Nuit, polices Literata + Source Sans 3, chiffres tabulaires). Ne remplace pas ces couleurs par celles de Material par défaut.
2. Le service au premier plan + la fenêtre overlay (`TYPE_APPLICATION_OVERLAY`) qui héberge la bulle en `ComposeView` : aimantation au bord, glisser, cible « Masquer », rétraction optionnelle.
3. La machine d'état de la bulle : `idle → menu → scan → reading (réduit / déplié) → pick → hidden`, exactement comme dans `fr-bubble.jsx`.
4. Le menu de lecture, la pilule de lecture et le lecteur déplié, y compris : arrêt complet, avancer/reculer en **secondes (5–120 s, pas de 5)** ou en **phrases (1–10)**, réglage persisté avec DataStore.
5. L'extraction du texte à l'écran par `AccessibilityService`, avec repli OCR ML Kit, et un découpage en phrases.
6. La synthèse vocale, phrase par phrase (TTS Android dans un premier temps ; prévois une interface pour brancher plus tard un moteur neuronal hors ligne). Les callbacks de début de phrase pilotent le surlignage et « Suivre la lecture ».
7. Le surlignage de la phrase en cours dans une seconde fenêtre overlay non touchable, aux coordonnées du nœud d'accessibilité.
8. L'application compagnon : onglets Accueil, Liseuse, Voix et vitesse, et le parcours d'autorisation (superposition, accessibilité) avec des textes simples, sans jargon.

**Contraintes non négociables**
- Cibles tactiles ≥ 44 dp, 48 dp pour les actions principales.
- Aucune ombre portée, aucun dégradé, aucun emoji, aucun logo de poisson.
- Tous les textes en français du Québec, au vouvoiement ; virgule décimale (« 1,25× »).
- L'utilisateur ne voit jamais de nom de fichier, de modèle ou de terme technique.

Commence par me proposer l'arborescence du projet et le plan des modules, puis livre le code module par module.
