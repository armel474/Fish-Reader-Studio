# FishReader Android — 1.3.0-dev

Projet Java natif `app.fishreadv2`, dérivé des sources exportées au commit
`c5f6c456e124e93a8f08ef285f07f4b6cbdb720c`. Cette version de développement
n'a pas encore été validée sur téléphone. Les APK 1.2 présents dans `public/`
ne sont pas remplacés par ces changements.

## Modifications

- Chaque nouveau scan arrête et efface la lecture précédente. Un scan vide ne
  réutilise jamais le texte d'un autre écran.
- Les contrôles FishReader sont masqués pendant la capture. L'accessibilité
  recherche la fenêtre de l'application, en excluant FishReader et le clavier.
- Une capture suivie d'une reconnaissance ML Kit locale prend le relais si
  l'accessibilité ne fournit pas de texte ou expose un bloc aux coordonnées
  trop grossières. Le modèle OCR latin est inclus dans l'application.
- Un identifiant de session rejette les résultats arrivés après un arrêt,
  un changement d'application, une rotation ou un autre scan. Délai maximal
  de présentation d'un résultat : dix secondes.
- Les cadres suivent les coordonnées du texte détecté. Toucher un espace vide
  ne sélectionne plus automatiquement le paragraphe le plus proche.
- Un défilement invalide les anciennes coordonnées et arrête la lecture.
  L'option « Proposer un nouveau scan après mon défilement », désactivée par
  défaut, propose les nouveaux blocs après 700 ms sans nouvel événement de
  défilement. La lecture attend toujours un choix de l'utilisateur.
- La voix Android conserve sa hauteur naturelle. Les voix nécessitant le
  réseau ne sont plus sélectionnées ; les erreurs de synthèse sont affichées
  au lieu de sauter silencieusement une phrase.

## Limites actuelles

La synthèse utilise encore les voix françaises installées dans le moteur
Android. Les quatre profils ne garantissent pas quatre voix différentes.
Aucun nouveau moteur neuronal ni gestionnaire de téléchargement de voix n'est
intégré à cette étape. La pause reprend au début de la phrase courante.

L'OCR nécessite Android 11 ou une version plus récente ; les écrans protégés
peuvent interdire les captures. L'ordre de lecture OCR et le regroupement des
blocs doivent être évalués sur Word, Facebook et Manus. Le défilement automatique
et la lecture multilingue ne sont pas encore implémentés.

## Compilation

Prérequis : JDK 17, Android SDK Platform 34 et Build Tools 34.0.0. Configurer
`ANDROID_HOME` ou `android/local.properties`. Le premier build télécharge Gradle,
le plugin Android et les dépendances OCR depuis leurs dépôts officiels.

```sh
cd android
./gradlew assembleDebug --no-daemon
```

APK : `android/app/build/outputs/apk/debug/app-debug.apk`.
La compilation directe avec `aapt2`/`javac` seule ne suffit plus : Gradle gère
les dépendances ML Kit et leurs ressources.

Le workflow `.github/workflows/android-debug.yml` compile également le projet
et conserve l'APK de debug comme artefact pendant sept jours. Ce build signe
avec une clé de debug et ne garantit pas une mise à jour sur une installation
signée avec une autre clé. Conserver la clé de signature originale hors Git
pour une mise à jour compatible.

## Vérifications

```sh
sh android/tests/run.sh
```

Ces tests Java vérifient les courses entre les scans (Word puis Facebook),
l'annulation pendant l'OCR, les résultats tardifs après expiration et les
callbacks en double. Ils ne remplacent pas une compilation Android ou des essais
sur appareil.

Essais à effectuer sur le Galaxy S25 Ultra / Android 16 :

1. Lire Word puis scanner Facebook : aucun ancien texte ne doit réapparaître.
2. Scanner Manus : vérifier que l'OCR propose des blocs aux bons endroits.
3. Toucher le deuxième bloc, puis Stop : départ au bon bloc et arrêt immédiat.
4. Relancer un scan pendant l'audio ; annuler pendant la capture ; tourner le
   téléphone : aucune lecture ou sélection obsolète ne doit revenir.
5. Défiler avec puis sans l'option de nouveau scan ; attendre la fin du
   défilement : pas de lecture automatique, pas de surbrillance déplacée.
6. Tester en mode avion avec une voix française Android déjà installée.
7. Tester un écran protégé : message d'échec, sans ancien texte.
8. Désactiver/réactiver l'accessibilité après installation pour vérifier que
   l'autorisation de capture ajoutée est bien prise en compte.
