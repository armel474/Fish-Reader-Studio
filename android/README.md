# FishReader Android — 1.4.0-dev

Application personnelle hors ligne, sans compte, dérivée des sources Java du
projet `app.fishreadv2`. La branche de travail est
`codex/android-scan-sessions-ocr` ; les APK 1.2 de `public/` ne sont pas remplacés.

## Utilisation

- Sans document chargé, toucher la bulle lance un scan et propose les blocs.
- Après un scan réussi, la bulle et la pilule ouvrent les commandes. Le panneau
  propose lecture/pause, arrêt, sauts de phrase, sélection d'un autre bloc,
  voix, vitesse, nouveau scan et texte copié. Toucher à l'extérieur le replie.
- Pause suspend la lecture. Stop arrête l'audio et le suivi mais garde le
  document disponible dans les commandes. Nouveau scan remplace le document.
- Le panneau se place dans les limites de l'écran sans modifier l'ancrage
  mémorisé de la petite bulle. Ses boutons ont une hauteur minimale de 44 dp.
- Un geste vertical dans la sélection tente un défilement du contenu via
  l'accessibilité, puis actualise les blocs. Si l'application ne propose pas
  cette action, fermer la sélection, défiler puis relancer le scan.

## Suivi du défilement

L'option « Suivre mon défilement pendant une lecture » est désactivée par défaut.
Elle n'arme jamais un scan global. Le suivi nécessite un scan manuel, le choix
d'un point de départ et un lancement de lecture. Il est lié au paquet de
l'application, à l'identifiant de fenêtre et au titre de fenêtre exposé par Android.
Après stabilisation du défilement, le texte visible est recapturé et la lecture
reprend sur les phrases qui ne font pas partie du chevauchement déjà entendu.

Pause et Stop désarment le suivi. Un changement d'application ou de fenêtre ferme
la session ; revenir n'entraîne pas de reprise automatique. Les fenêtres de menu
propres à FishReader sont distinguées de son écran principal.

**Limite à tester :** Android n'expose pas d'identifiant de document universel.
Deux documents ouverts dans une même fenêtre avec un titre identique peuvent
être indiscernables. Dans ce cas, utiliser Nouveau scan. Si aucune métadonnée de
fenêtre n'est accessible, le scan OCR manuel reste possible mais le suivi n'est
pas armé. Le rapprochement OCR est conservateur et peut relire une phrase dont
la segmentation a changé ; il ne doit pas supprimer un passage incertain.

## Interface et traitement local

Accueil, Voix et Réglages sont accessibles séparément. Les thèmes Papier, Sépia
et Nuit reprennent les jetons du design original et s'appliquent à l'application
et aux commandes flottantes. Aucun compte ni service de synchronisation n'est
ajouté. La permission INTERNET est explicitement retirée de l'APK, y compris
lorsqu'une dépendance la déclare.

L'extraction combine accessibilité et OCR ML Kit latin embarqué. Les champs de
message et les petits contrôles identifiables sont exclus des candidats et des
zones OCR. Les grands éditeurs de document ne sont pas exclus par leur seul
caractère éditable. L'OCR nécessite Android 11+, et un écran protégé peut refuser
la capture.

La synthèse utilise encore les voix françaises Android installées, à leur hauteur
naturelle. Les quatre profils ne garantissent pas quatre voix distinctes. Aucun
nouveau moteur neuronal ni gestionnaire de téléchargement de voix n'est intégré.
La pause reprend au début de la phrase courante. Le défilement automatique, la
lecture multilingue et le changement de nom/logo définitif restent à traiter.

## Compilation et vérification

Prérequis : JDK 17, Android SDK Platform 34 et Build Tools 34.0.0.
Configurer `ANDROID_HOME` ou `android/local.properties`.

```sh
sh android/tests/run.sh
cd android
sh gradlew assembleDebug lintDebug --no-daemon
```

APK : `android/app/build/outputs/apk/debug/app-debug.apk`.
Le premier build télécharge Gradle, le plugin Android et les dépendances ML Kit.
Le workflow `.github/workflows/android-debug.yml` exécute les tests, compile,
lance lint et vérifie l'absence de permission INTERNET avant de conserver l'APK
comme artefact pendant sept jours. Il réutilise une clé de développement via le
cache GitHub Actions ; une première installation signée autrement peut refuser
la mise à jour. Ce mécanisme ne remplace pas une clé de signature de production.

Les tests Java couvrent les résultats de scan obsolètes et le périmètre d'une
session : aucun suivi au repos, pause respectée, changement de fenêtre/document,
texte copié, chevauchement déjà lu et relecture intentionnelle. Ils ne remplacent
pas les essais sur Galaxy S25 Ultra / Android 16.

## Essais sur téléphone

1. Activer l'option de suivi, rester au repos puis défiler dans l'accueil et les
   réglages : aucun scan spontané. Ouvrir FishReader : aucun autoscan de lui-même.
2. Scanner un texte dans Meta AI, choisir un bloc et lire. Toucher la pilule :
   commandes compactes, position de la bulle conservée, menus voix/vitesse utilisables.
3. Toucher hors du panneau, puis rouvrir. Tester Pause et Stop : pas de scan ni
   de reprise audio au défilement. Le document conserve ses commandes.
4. Reprendre la lecture et défiler dans le même document : actualisation après
   stabilisation, sans lecture du champ de saisie et avec réduction des répétitions.
5. Changer d'application, ouvrir un autre PDF ou tourner le téléphone : vérifier
   la fermeture de la session, y compris le cas de deux documents dans la même
   fenêtre. Ne pas considérer ce dernier cas garanti sans ces essais.
6. Tester le défilement dans les cadres de sélection, Word, les écrans protégés,
   la capture annulée, les thèmes et le fonctionnement en mode avion.
