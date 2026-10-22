# Fish Reader Android (`app.fishreadv2` — v1.2.0 / versionCode 12)

Ce dossier contient le projet Android complet (sources Java, `AndroidManifest.xml`, ressources XML et configuration Gradle) correspondant exactement au binaire `public/FishReader-v1.2.apk`.

## Structure du projet

```text
android/
├── app/
│   ├── build.gradle
│   ├── proguard-rules.pro
│   └── src/main/
│       ├── AndroidManifest.xml
│       ├── java/app/fishreadv2/
│       │   ├── FishAccessibilityService.java
│       │   ├── FishOverlayService.java
│       │   ├── FishVoiceEngine.java
│       │   └── MainActivity.java
│       └── res/
│           ├── drawable/ic_launcher.xml
│           ├── values/strings.xml
│           └── xml/accessibility_service_config.xml
├── build.gradle
├── gradle.properties
├── settings.gradle
├── gradlew
├── gradlew.bat
└── gradle/wrapper/
    ├── gradle-wrapper.jar
    └── gradle-wrapper.properties
```

## Prérequis

- **JDK 17** (`JAVA_HOME` pointant vers une installation OpenJDK 17).
- **Android SDK Platform 34** (`platforms;android-34`) et **Android SDK Build-Tools 34.0.0** (`build-tools;34.0.0`).
- Variable d'environnement `ANDROID_HOME` (ou fichier `android/local.properties` contenant `sdk.dir=/chemin/vers/Android/Sdk`).

---

## Option 1 : Compiler l'APK avec Gradle Wrapper (recommandé)

Depuis la racine du dépôt :

```bash
cd android

# 1. Compiler un APK de debug (signé automatiquement avec la clé debug Android)
./gradlew assembleDebug
# Sortie : app/build/outputs/apk/debug/app-debug.apk

# 2. Compiler un APK de release non signé
./gradlew assembleRelease
# Sortie : app/build/outputs/apk/release/app-release-unsigned.apk
```

### Compiler et signer l'APK Release via variables d'environnement (sans secret dans le dépôt)

```bash
cd android
ANDROID_KEYSTORE_PATH="/chemin/vers/votre-keystore.jks" \
ANDROID_KEYSTORE_PASSWORD="<mot_de_passe_keystore>" \
ANDROID_KEY_ALIAS="<alias_cle>" \
ANDROID_KEY_PASSWORD="<mot_de_passe_cle>" \
./gradlew assembleRelease
# Sortie : app/build/outputs/apk/release/app-release.apk
```

---

## Option 2 : Pipeline direct `aapt2` + `javac` + `d8` + `zipalign` + `apksigner`

L'APK `FishReader-v1.2.apk` n'utilise aucune dépendance externe en dehors du SDK Android (`android.jar` API 34) et peut également être compilé directement avec les outils de ligne de commande du SDK Android (`build-tools/34.0.0` et `platforms/android-34`) :

```bash
cd android
export BUILD_TOOLS="$ANDROID_HOME/build-tools/34.0.0"
export ANDROID_JAR="$ANDROID_HOME/platforms/android-34/android.jar"
mkdir -p build/compiled_res build/gen build/classes build/dex build/out

# 1. Compiler les ressources XML avec AAPT2
"$BUILD_TOOLS/aapt2" compile --dir app/src/main/res -o build/compiled_res/res.zip

# 2. Lier les ressources et générer R.java + APK de base
"$BUILD_TOOLS/aapt2" link \
  -o build/out/unsigned-unaligned.apk \
  -I "$ANDROID_JAR" \
  --manifest app/src/main/AndroidManifest.xml \
  --java build/gen \
  --min-sdk-version 26 \
  --target-sdk-version 34 \
  --version-code 12 \
  --version-name 1.2.0 \
  build/compiled_res/res.zip

# 3. Compiler les sources Java + R.java en bytecode Java 8
javac -source 1.8 -target 1.8 -encoding UTF-8 \
  -bootclasspath "$ANDROID_JAR" \
  -classpath "$ANDROID_JAR" \
  -d build/classes \
  build/gen/app/fishreadv2/R.java \
  app/src/main/java/app/fishreadv2/FishAccessibilityService.java \
  app/src/main/java/app/fishreadv2/FishVoiceEngine.java \
  app/src/main/java/app/fishreadv2/FishOverlayService.java \
  app/src/main/java/app/fishreadv2/MainActivity.java

# 4. Convertir les classes .class en classes.dex avec D8
"$BUILD_TOOLS/d8" --lib "$ANDROID_JAR" --min-api 26 \
  --output build/dex \
  build/classes/app/fishreadv2/*.class

# 5. Injecter classes.dex dans l'APK et aligner sur 4 octets
cp build/dex/classes.dex .
zip -j build/out/unsigned-unaligned.apk classes.dex
rm classes.dex
"$BUILD_TOOLS/zipalign" -f -p 4 build/out/unsigned-unaligned.apk build/out/unsigned-aligned.apk

# 6. Signer l'APK avec votre keystore personnel (v1 + v2 + v3)
"$BUILD_TOOLS/apksigner" sign \
  --ks "/chemin/vers/votre-keystore.jks" \
  --ks-key-alias "<alias_cle>" \
  --out build/out/FishReader-v1.2.apk \
  build/out/unsigned-aligned.apk
```
