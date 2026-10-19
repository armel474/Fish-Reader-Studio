export interface KotlinProjectFile {
  id: string;
  filename: string;
  path: string;
  category:
    | 'Configuration & Manifest'
    | 'Service Overlay & Compose'
    | 'Extraction UI & OCR Fallback'
    | 'Moteur Audio Sherpa-ONNX';
  language: 'kotlin' | 'toml' | 'xml';
  summary: string;
  keyTakeaways: string[];
  code: string;
}

export interface IntegrationStep {
  number: string;
  title: string;
  subtitle: string;
  details: string[];
  verificationCheck: string;
}

export const KOTLIN_PROJECT_FILES: KotlinProjectFile[] = [
  {
    id: 'theme-kt',
    filename: 'Theme.kt',
    path: 'app/src/main/java/app/fishreader/ui/theme/Theme.kt',
    category: 'Service Overlay & Compose',
    language: 'kotlin',
    summary:
      'Système de jetons de design Jetpack Compose officiel (Papier, Sépia, Nuit) avec typographies Literata et Source Sans 3, chiffres tabulaires (tnum), espacements FrSpace, rayons FrRadius et vitesses formatées à la québécoise (« 1,25× »).',
    keyTakeaways: [
      'Trois thèmes complets : Papier (#F7F2E8 / #1F5F63), Sépia (#EFE3CC / #1D5458) et Nuit (#1C1A17 / #7FB8B3)',
      'Aucune couleur codée en dur dans les écrans : accès universel via Fr.colors et Fr.type',
      'Respect strict des cibles tactiles (44 dp min, 48 dp primaire, 56 dp bulle, 64 dp Play grand format)',
    ],
    code: `package app.fishreader.ui.theme

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

// Polices : copier design-system/fonts/*.woff2 -> res/font (convertir en .ttf si nécessaire)
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

val LocalFrColors = staticCompositionLocalOf { Papier }
val LocalFrType = staticCompositionLocalOf { FrType() }

@Composable
fun FishReaderTheme(theme: FrTheme = FrTheme.Papier, content: @Composable () -> Unit) {
    val colors = when (theme) { FrTheme.Papier -> Papier; FrTheme.Sepia -> Sepia; FrTheme.Nuit -> Nuit }
    CompositionLocalProvider(LocalFrColors provides colors, LocalFrType provides FrType(), content = content)
}

object Fr {
    val colors: FrColors @Composable get() = LocalFrColors.current
    val type: FrType @Composable get() = LocalFrType.current
}`,
  },
  {
    id: 'libs-versions-toml',
    filename: 'libs.versions.toml',
    path: 'gradle/libs.versions.toml',
    category: 'Configuration & Manifest',
    language: 'toml',
    summary:
      'Catalogue de versions Gradle centralisant Jetpack Compose, Coroutines, Lifecycle Service, Google ML Kit Text Recognition v2 (16.0.1) et Language ID hors ligne.',
    keyTakeaways: [
      'Compatible Android Gradle Plugin 8.7+ et Kotlin 2.0+',
      'Dépendances ML Kit 100 % hors ligne (bundled) pour éviter tout téléchargement au premier appel OCR',
      'Support SavedState et Lifecycle Service requis pour héberger un ComposeView dans WindowManager',
    ],
    code: `[versions]
agp = "8.7.2"
kotlin = "2.0.21"
coreKtx = "1.15.0"
lifecycle = "2.8.7"
savedstate = "1.2.1"
activityCompose = "1.9.3"
composeBom = "2024.11.00"
coroutines = "1.9.0"
mlkitTextRecognition = "16.0.1"
mlkitLanguageId = "17.0.6"

[libraries]
androidx-core-ktx = { group = "androidx.core", name = "core-ktx", version.ref = "coreKtx" }
androidx-lifecycle-runtime-ktx = { group = "androidx.lifecycle", name = "lifecycle-runtime-ktx", version.ref = "lifecycle" }
androidx-lifecycle-service = { group = "androidx.lifecycle", name = "lifecycle-service", version.ref = "lifecycle" }
androidx-lifecycle-viewmodel-savedstate = { group = "androidx.lifecycle", name = "lifecycle-viewmodel-savedstate", version.ref = "lifecycle" }
androidx-savedstate-ktx = { group = "androidx.savedstate", name = "savedstate-ktx", version.ref = "savedstate" }
androidx-activity-compose = { group = "androidx.activity", name = "activity-compose", version.ref = "activityCompose" }
androidx-compose-bom = { group = "androidx.compose", name = "compose-bom", version.ref = "composeBom" }
androidx-ui = { group = "androidx.compose.ui", name = "ui" }
androidx-ui-graphics = { group = "androidx.compose.ui", name = "ui-graphics" }
androidx-ui-tooling-preview = { group = "androidx.compose.ui", name = "ui-tooling-preview" }
androidx-material3 = { group = "androidx.compose.material3", name = "material3" }
kotlinx-coroutines-android = { group = "org.jetbrains.kotlinx", name = "kotlinx-coroutines-android", version.ref = "coroutines" }
kotlinx-coroutines-play-services = { group = "org.jetbrains.kotlinx", name = "kotlinx-coroutines-play-services", version.ref = "coroutines" }

# Google ML Kit Offline (Reconnaissance de texte v2 + Identification de langue FR/EN)
mlkit-text-recognition = { group = "com.google.mlkit", name = "text-recognition", version.ref = "mlkitTextRecognition" }
mlkit-language-id = { group = "com.google.mlkit", name = "language-id", version.ref = "mlkitLanguageId" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
kotlin-compose = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }`,
  },
  {
    id: 'build-gradle-kts',
    filename: 'build.gradle.kts (:app)',
    path: 'app/build.gradle.kts',
    category: 'Configuration & Manifest',
    language: 'kotlin',
    summary:
      'Configuration du module :app incluant le filtrage ABI arm64-v8a pour Sherpa-ONNX, la non-compression des modèles Piper VITS Medium/High dans assets et les dépendances Compose/ML Kit.',
    keyTakeaways: [
      'androidResources.noCompress empêche l’outil AAPT2 de compresser les fichiers .onnx, .json et .txt pour permettre une extraction ultra-rapide vers filesDir',
      'Intégration du binaire sherpa-onnx-1.10.41.aar dans app/libs/ supportant les modèles VITS Medium/High (22.05 kHz)',
      'minSdk = 30 (Android 11) pour supporter nativement AccessibilityService.takeScreenshot() et AudioTrack PlaybackParams avancés',
    ],
    code: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "com.fishreader.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.fishreader.app"
        minSdk = 30 // Android 11+ requis pour AccessibilityService.takeScreenshot()
        targetSdk = 35
        versionCode = 3
        versionName = "1.2.0"

        ndk {
            // Cible les processeurs ARM 64-bits avec instructions vectorielles NEON
            abiFilters += listOf("arm64-v8a", "x86_64")
        }
    }

    // CRITIQUE : Empêche la compression AAPT des modèles VITS Medium/High (.onnx)
    androidResources {
        noCompress += listOf("onnx", "json", "txt", "bin")
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
    }
}

dependencies {
    // Archive locale Sherpa-ONNX Android AAR (app/libs/sherpa-onnx-1.10.41.aar)
    implementation(fileTree(mapOf("dir" to "libs", "include" to listOf("*.aar", "*.jar"))))

    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.service)
    implementation(libs.androidx.lifecycle.viewmodel.savedstate)
    implementation(libs.androidx.savedstate.ktx)
    implementation(libs.androidx.activity.compose)

    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)

    implementation(libs.kotlinx.coroutines.android)
    implementation(libs.kotlinx.coroutines.play.services)

    // Fallback OCR Local & Détection de langue FR/EN 100% hors ligne
    implementation(libs.mlkit.text.recognition)
    implementation(libs.mlkit.language.id)
}`,
  },
  {
    id: 'android-manifest',
    filename: 'AndroidManifest.xml',
    path: 'app/src/main/AndroidManifest.xml',
    category: 'Configuration & Manifest',
    language: 'xml',
    summary:
      'Déclaration stricte des permissions système (SYSTEM_ALERT_WINDOW, FOREGROUND_SERVICE_MEDIA_PLAYBACK, BIND_ACCESSIBILITY_SERVICE) et aucun accès Internet (100 % local).',
    keyTakeaways: [
      'Absence volontaire de <uses-permission android:name="android.permission.INTERNET" /> garantissant l’étanchéité totale des données',
      'Déclaration de FishOverlayService avec foregroundServiceType="mediaPlayback"',
      'Déclaration de FishAccessibilityService relié à @xml/accessibility_service_config',
    ],
    code: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <!-- 1. Superposition du widget flottant au-dessus des autres applications -->
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />

    <!-- 2. Exécution continue de la synthèse vocale en arrière-plan -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <!-- NOTE : Aucune permission INTERNET n'est déclarée. L'application est 100 % hors ligne. -->

    <application
        android:name=".FishReaderApplication"
        android:allowBackup="false"
        android:label="FishReader"
        android:supportsRtl="true"
        android:theme="@android:style/Theme.DeviceDefault.NoActionBar">

        <activity
            android:name=".ui.MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <service
            android:name=".service.FishOverlayService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="mediaPlayback" />

        <service
            android:name=".service.FishAccessibilityService"
            android:enabled="true"
            android:exported="false"
            android:label="FishReader — Lecture d'Écran Locale"
            android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE">
            <intent-filter>
                <action android:name="android.accessibilityservice.AccessibilityService" />
            </intent-filter>
            <meta-data
                android:name="android.accessibilityservice"
                android:resource="@xml/accessibility_service_config" />
        </service>

        <meta-data
            android:name="com.google.mlkit.vision.DEPENDENCIES"
            android:value="ocr" />
    </application>
</manifest>`,
  },
  {
    id: 'accessibility-config-xml',
    filename: 'accessibility_service_config.xml',
    path: 'app/src/main/res/xml/accessibility_service_config.xml',
    category: 'Configuration & Manifest',
    language: 'xml',
    summary:
      'Configuration du service d’accessibilité : zéro écoute passive d’événements pour préserver la batterie, inspection de fenêtre à la demande et autorisation canTakeScreenshot.',
    keyTakeaways: [
      'accessibilityEventTypes="" évite de réveiller le CPU à chaque scroll de l’utilisateur (0 % d’impact batterie au repos)',
      'canRetrieveWindowContent="true" autorise la lecture de rootInActiveWindow lors du clic sur le poisson',
      'canTakeScreenshot="true" active l’API native takeScreenshot() d’Android 11+ pour le fallback OCR ML Kit',
    ],
    code: `<?xml version="1.0" encoding="utf-8"?>
<accessibility-service xmlns:android="http://schemas.android.com/apk/res/android"
    android:accessibilityEventTypes=""
    android:accessibilityFeedbackType="feedbackSpoken"
    android:accessibilityFlags="flagReportViewIds|flagRetrieveInteractiveWindows|flagIncludeNotImportantViews"
    android:canRetrieveWindowContent="true"
    android:canTakeScreenshot="true"
    android:description="@string/accessibility_service_description"
    android:notificationTimeout="0" />`,
  },
  {
    id: 'piper-model-asset-config',
    filename: 'PiperModelAssetConfig.kt',
    path: 'app/src/main/java/com/fishreader/app/data/tts/PiperModelAssetConfig.kt',
    category: 'Moteur Audio Sherpa-ONNX',
    language: 'kotlin',
    summary:
      'Configuration documentée des modèles Piper VITS Medium/High (22.05 kHz), builder OfflineTtsVitsModelConfig, exemple complet de chargement et gestionnaire de migration d’assets dans context.filesDir.',
    keyTakeaways: [
      'Documentation comparative détaillée : pourquoi remplacer les modèles 16 kHz (low/tiny) par les architectures VITS Medium/High à 22 050 Hz (192 canaux latents, HiFi-GAN v1 complet)',
      'Inclut PiperVitsConfigBuilder et un exemple complet (PiperHighFidelityLoaderExample) montrant comment configurer OfflineTtsVitsModelConfig et instancier OfflineTts',
      'Système de versionnage (.model_version) qui purge automatiquement les anciens modèles dans filesDir lors d’une mise à niveau des assets',
    ],
    code: `package com.fishreader.app.data.tts

import android.content.Context
import com.k2fsa.sherpa.onnx.OfflineTts
import com.k2fsa.sherpa.onnx.OfflineTtsConfig
import com.k2fsa.sherpa.onnx.OfflineTtsModelConfig
import com.k2fsa.sherpa.onnx.OfflineTtsVitsModelConfig
import java.io.File
import java.io.FileOutputStream

/**
 * ================================================================================================
 * GUIDE D'ARCHITECTURE : MODÈLES PIPER VITS MEDIUM & HIGH (22.05 kHz) DANS SHERPA-ONNX
 * ================================================================================================
 *
 * 1. POURQUOI LES MODÈLES "LOW" / "X_LOW" (16 kHz) SONNENT "ROBOTIQUES" :
 *    - Fréquence de Nyquist bridée à 8 kHz : les consonnes fricatives françaises et anglaises
 *      ('s', 'ch', 'f', 'z') perdent leurs harmoniques entre 8 kHz et 11 kHz, créant un timbre
 *      métallique et étouffé.
 *    - Vocodeur HiFi-GAN réduit (96 canaux cachés) : génère des artefacts de phase audibles sur
 *      les voyelles tenues.
 *    - Hyperparamètres par défaut trop instables (noiseScale = 0.667f, noiseScaleW = 0.800f) :
 *      le prédicteur stochastique de durée (SDP) accélère et ralentit les syllabes de manière
 *      irrégulière.
 *
 * 2. SOLUTION : PASSER AUX MODÈLES VITS "MEDIUM" ET "HIGH" (22 050 Hz · 192 CANAUX) :
 *    - Échantillonnage natif à 22 050 Hz (bande passante acoustique jusqu'à 11.025 kHz).
 *    - Architecture VITS à 192 canaux latents + HiFi-GAN v1 complet.
 *    - Calibration fine du SDP : noiseScale entre 0.58f et 0.62f, noiseScaleW entre 0.70f et 0.74f.
 *
 * 3. ARBORESCENCE ATTENDUE DANS LE PROJET ANDROID (app/src/main/assets/) :
 *    app/src/main/assets/
 *    └── models/
 *        ├── espeak-ng-data/                           # Phonémiseur multilingue obligatoire
 *        │   ├── phontab
 *        │   ├── phonindex
 *        │   ├── phondata
 *        │   ├── intonations
 *        │   ├── fr_dict
 *        │   └── en_dict
 *        ├── vits-piper-fr_FR-siwis-medium/            # Voix FR Studio Féminine (Medium 22.05 kHz)
 *        │   ├── fr_FR-siwis-medium.onnx
 *        │   └── tokens.txt
 *        ├── vits-piper-fr_FR-tom-medium/              # Voix FR Masculine Grave (Medium 22.05 kHz)
 *        │   ├── fr_FR-tom-medium.onnx
 *        │   └── tokens.txt
 *        ├── vits-piper-en_US-lessac-high/             # Voix EN US Large VITS (High 22.05 kHz)
 *        │   ├── en_US-lessac-high.onnx
 *        │   └── tokens.txt
 *        └── vits-piper-en_GB-cori-high/               # Voix EN UK Studio (High 22.05 kHz)
 *            ├── en_GB-cori-high.onnx
 *            └── tokens.txt
 *
 * 4. RÈGLE GRADLE OBLIGATOIRE (app/build.gradle.kts) :
 *    android {
 *        androidResources {
 *            noCompress += listOf("onnx", "ort", "bin", "txt")
 *        }
 *    }
 * ================================================================================================
 */
enum class VoiceModelProfile(
    val id: String,
    val displayName: String,
    val languageCode: String,
    val qualityTier: String,
    val assetDirectory: String,
    val onnxFileName: String,
    val sampleRateHz: Int,
    val hiddenChannels: Int,
    val defaultSpeakerId: Int,
    val recommendedNoiseScale: Float,
    val recommendedNoiseScaleW: Float,
    val recommendedLengthScale: Float
) {
    // 1. FRANÇAIS — Studio SIWIS Medium (Voix féminine éditoriale chaleureuse, 22.05 kHz)
    FR_SIWIS_MEDIUM(
        id = "fr_siwis_medium",
        displayName = "FR · Piper SIWIS Medium (22.05 kHz HD)",
        languageCode = "fr",
        qualityTier = "MEDIUM_22KHZ",
        assetDirectory = "models/vits-piper-fr_FR-siwis-medium",
        onnxFileName = "fr_FR-siwis-medium.onnx",
        sampleRateHz = 22050,
        hiddenChannels = 192,
        defaultSpeakerId = 0,
        recommendedNoiseScale = 0.60f,   // Réduit le souffle parasite (défaut Piper = 0.667f)
        recommendedNoiseScaleW = 0.72f,  // Stabilise la cadence syllabique (défaut Piper = 0.80f)
        recommendedLengthScale = 0.96f   // Légèrement plus fluide que 1.0f
    ),

    // 2. FRANÇAIS — Tom Medium (Voix masculine grave et posée, idéale pour longs articles)
    FR_TOM_MEDIUM(
        id = "fr_tom_medium",
        displayName = "FR · Piper Tom Medium (22.05 kHz Grave)",
        languageCode = "fr",
        qualityTier = "MEDIUM_22KHZ",
        assetDirectory = "models/vits-piper-fr_FR-tom-medium",
        onnxFileName = "fr_FR-tom-medium.onnx",
        sampleRateHz = 22050,
        hiddenChannels = 192,
        defaultSpeakerId = 0,
        recommendedNoiseScale = 0.58f,
        recommendedNoiseScaleW = 0.70f,
        recommendedLengthScale = 0.98f
    ),

    // 3. ANGLAIS US — Lessac High (Architecture VITS Large 22.05 kHz, fidélité maximale)
    EN_LESSAC_HIGH(
        id = "en_lessac_high",
        displayName = "EN · Piper Lessac High (22.05 kHz Large VITS)",
        languageCode = "en",
        qualityTier = "HIGH_LARGE_VITS_22KHZ",
        assetDirectory = "models/vits-piper-en_US-lessac-high",
        onnxFileName = "en_US-lessac-high.onnx",
        sampleRateHz = 22050,
        hiddenChannels = 192,
        defaultSpeakerId = 0,
        recommendedNoiseScale = 0.62f,
        recommendedNoiseScaleW = 0.74f,
        recommendedLengthScale = 0.97f
    ),

    // 4. ANGLAIS UK — Cori High (Voix britannique studio haute définition)
    EN_CORI_HIGH(
        id = "en_cori_high",
        displayName = "EN · Piper Cori High (22.05 kHz Studio UK)",
        languageCode = "en",
        qualityTier = "HIGH_LARGE_VITS_22KHZ",
        assetDirectory = "models/vits-piper-en_GB-cori-high",
        onnxFileName = "en_GB-cori-high.onnx",
        sampleRateHz = 22050,
        hiddenChannels = 192,
        defaultSpeakerId = 0,
        recommendedNoiseScale = 0.60f,
        recommendedNoiseScaleW = 0.72f,
        recommendedLengthScale = 0.96f
    );

    companion object {
        fun defaultForLanguage(lang: String): VoiceModelProfile =
            if (lang.startsWith("en", ignoreCase = true)) EN_LESSAC_HIGH else FR_SIWIS_MEDIUM
    }
}

/**
 * Builder spécialisé construisant la configuration Sherpa-ONNX [OfflineTtsConfig] pour un modèle
 * Piper VITS Medium ou High (22.05 kHz) avec calibration prosodique et scaling de vitesse.
 */
object PiperVitsConfigBuilder {

    /**
     * Construit un [OfflineTtsConfig] prêt à être injecté dans [OfflineTts].
     *
     * @param extractedPaths Chemins absolus vers le fichier .onnx et tokens.txt dans filesDir
     * @param espeakDataDirPath Chemin absolu vers filesDir/models/espeak-ng-data
     * @param profile Profil du modèle VITS Medium/High sélectionné
     * @param initialSpeechRate Vitesse initiale de lecture (0.75f à 1.50f, défaut = 1.0f)
     * @param expressiveness Facteur d'expressivité modulant noiseScaleW (0.5f à 1.4f, défaut = 1.0f)
     * @param cpuThreads Nombre de threads CPU ARM64 alloués à ONNX Runtime (4 recommandé sur big.LITTLE)
     */
    fun buildOfflineTtsConfig(
        extractedPaths: ExtractedVoicePaths,
        espeakDataDirPath: String,
        profile: VoiceModelProfile,
        initialSpeechRate: Float = 1.0f,
        expressiveness: Float = 1.0f,
        cpuThreads: Int = 4
    ): OfflineTtsConfig {
        val clampedRate = initialSpeechRate.coerceIn(0.75f, 1.50f)
        val effectiveLengthScale = (profile.recommendedLengthScale / clampedRate)
            .coerceIn(0.55f, 1.45f)

        val tunedNoiseScale = profile.recommendedNoiseScale
        val tunedNoiseScaleW = (profile.recommendedNoiseScaleW * expressiveness)
            .coerceIn(0.50f, 0.90f)

        val vitsModelConfig = OfflineTtsVitsModelConfig(
            model = extractedPaths.modelOnnxPath,
            lexicon = "",
            tokens = extractedPaths.tokensTxtPath,
            dataDir = espeakDataDirPath,
            noiseScale = tunedNoiseScale,
            noiseScaleW = tunedNoiseScaleW,
            lengthScale = effectiveLengthScale
        )

        val modelConfig = OfflineTtsModelConfig(
            vits = vitsModelConfig,
            numThreads = cpuThreads,
            debug = false,
            provider = "cpu"
        )

        return OfflineTtsConfig(model = modelConfig)
    }
}

/**
 * EXEMPLE COMPLET D'INITIALISATION ET DE SYNTHÈSE HAUTE FIDÉLITÉ (22.05 kHz) :
 *
 * Montre comment extraire les assets vers context.filesDir (requis par le moteur C++ JNI ONNX Runtime
 * pour le memory-mapping mmap), configurer le modèle VITS Medium/High et générer un flux PCM Float.
 */
object PiperHighFidelityLoaderExample {

    fun createNaturalFrenchTtsEngine(
        context: Context,
        userSpeechRate: Float = 1.05f
    ): OfflineTts {
        val extractor = PiperAssetExtractor(context.applicationContext)

        // 1. Extraction unique de espeak-ng-data et du modèle FR SIWIS Medium (22.05 kHz)
        val espeakDir = extractor.ensureEspeakDataExtracted()
        val voicePaths = extractor.ensureVoiceProfileExtracted(VoiceModelProfile.FR_SIWIS_MEDIUM)

        // 2. Construction de la configuration VITS Medium avec noiseScale=0.60f et noiseScaleW=0.72f
        val ttsConfig = PiperVitsConfigBuilder.buildOfflineTtsConfig(
            extractedPaths = voicePaths,
            espeakDataDirPath = espeakDir.absolutePath,
            profile = VoiceModelProfile.FR_SIWIS_MEDIUM,
            initialSpeechRate = userSpeechRate,
            expressiveness = 1.0f,
            cpuThreads = 4
        )

        // 3. Instanciation du moteur natif Sherpa-ONNX (assetManager = null pour activer mmap sur filesDir)
        return OfflineTts(assetManager = null, config = ttsConfig)
    }
}

class PiperAssetExtractor(private val context: Context) {

    companion object {
        // Incrémentez cette constante lors du remplacement d'un modèle "low" par un modèle "medium/high"
        // afin de forcer le nettoyage automatique du cache filesDir/models sur le téléphone.
        private const val ASSET_BUNDLE_VERSION = "v2_high_fidelity_vits_22050hz"
    }

    fun ensureEspeakDataExtracted(): File =
        extractAssetDirectoryWithVersionCheck("models/espeak-ng-data")

    fun ensureVoiceProfileExtracted(profile: VoiceModelProfile): ExtractedVoicePaths {
        val dir = extractAssetDirectoryWithVersionCheck(profile.assetDirectory)
        val onnxFile = File(dir, profile.onnxFileName)
        val tokensFile = File(dir, "tokens.txt")

        require(onnxFile.exists() && onnxFile.length() > 0L) {
            "Modèle ONNX introuvable : \${onnxFile.absolutePath}. Vérifiez app/src/main/assets/\${profile.assetDirectory}/"
        }
        require(tokensFile.exists() && tokensFile.length() > 0L) {
            "Fichier tokens.txt introuvable : \${tokensFile.absolutePath}"
        }

        return ExtractedVoicePaths(
            modelOnnxPath = onnxFile.absolutePath,
            tokensTxtPath = tokensFile.absolutePath
        )
    }

    private fun extractAssetDirectoryWithVersionCheck(assetRelativePath: String): File {
        val targetDir = File(context.filesDir, assetRelativePath)
        val versionStampFile = File(targetDir, ".model_version")

        if (targetDir.exists() &&
            versionStampFile.exists() &&
            versionStampFile.readText().trim() == ASSET_BUNDLE_VERSION
        ) {
            return targetDir
        }

        if (targetDir.exists()) {
            targetDir.deleteRecursively()
        }
        targetDir.mkdirs()

        copyAssetsRecursively(assetRelativePath, targetDir)
        versionStampFile.writeText(ASSET_BUNDLE_VERSION)
        return targetDir
    }

    private fun copyAssetsRecursively(assetPath: String, destFile: File) {
        val children = context.assets.list(assetPath)
        if (children.isNullOrEmpty()) {
            context.assets.open(assetPath).use { input ->
                FileOutputStream(destFile).use { output ->
                    input.copyTo(output, bufferSize = 64 * 1024)
                }
            }
        } else {
            destFile.mkdirs()
            for (child in children) {
                copyAssetsRecursively("\$assetPath/\$child", File(destFile, child))
            }
        }
    }
}

data class ExtractedVoicePaths(
    val modelOnnxPath: String,
    val tokensTxtPath: String
)`,
  },
  {
    id: 'prosody-rhythm-engine',
    filename: 'ProsodyRhythmEngine.kt',
    path: 'app/src/main/java/com/fishreader/app/data/tts/ProsodyRhythmEngine.kt',
    category: 'Moteur Audio Sherpa-ONNX',
    language: 'kotlin',
    summary:
      'Moteur de scaling prosodique temps réel (Vitesse 0.75x–1.50x + Pitch en demi-tons) exposé à SherpaOnnxTtsManager : combine le prédicteur de durée VITS et PlaybackParams AudioTrack instantané.',
    keyTakeaways: [
      'Expose un StateFlow réactif ProsodyParameters avec méthodes dédiées setSpeechRate(0.75f..1.50f), stepSpeechRate(delta), setPitchSemitones(-4f..+4f) et setPauseScale(0.6f..1.5f)',
      'Architecture hybride de scaling de vitesse : pilote la durée phonémique VITS sur chaque nouvelle clause et calcule un ratio de compensation AudioTrack instantané si l’utilisateur déplace le curseur au milieu d’une phrase en cours',
      'Découpe chaque phrase selon la ponctuation (, ; : — . ? !) et façonne le tampon PCM avec des pauses respiratoires proportionnelles au débit et une enveloppe cosinus anti-clic',
    ],
    code: `package com.fishreader.app.data.tts

import android.media.PlaybackParams
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.min
import kotlin.math.pow

/**
 * Paramètres prosodiques temps réel exposés par [ProsodyRhythmEngine] à [SherpaOnnxTtsManager],
 * à l'écran mobile [MainActivity] et à la bulle flottante [FishOverlayService].
 *
 * @param speechRate Vitesse de lecture globale réglable en temps réel entre [MIN_SPEECH_RATE] (0.75x) et [MAX_SPEECH_RATE] (1.50x)
 * @param pitchSemitones Décalage de hauteur tonale en demi-tons entre [MIN_PITCH_SEMITONES] (-4.0) et [MAX_PITCH_SEMITONES] (+4.0)
 * @param pauseScale Multiplicateur des pauses de ponctuation (0.60f = serré, 1.0f = naturel, 1.50f = posé)
 * @param expressiveness Modulation de l'inflexion prosodique (0.50f à 1.40f)
 */
data class ProsodyParameters(
    val speechRate: Float = DEFAULT_SPEECH_RATE,
    val pitchSemitones: Float = DEFAULT_PITCH_SEMITONES,
    val pauseScale: Float = DEFAULT_PAUSE_SCALE,
    val expressiveness: Float = DEFAULT_EXPRESSIVENESS
) {
    companion object {
        const val MIN_SPEECH_RATE = 0.75f
        const val MAX_SPEECH_RATE = 1.50f
        const val DEFAULT_SPEECH_RATE = 1.0f

        const val MIN_PITCH_SEMITONES = -4.0f
        const val MAX_PITCH_SEMITONES = 4.0f
        const val DEFAULT_PITCH_SEMITONES = 0.0f

        const val MIN_PAUSE_SCALE = 0.60f
        const val MAX_PAUSE_SCALE = 1.50f
        const val DEFAULT_PAUSE_SCALE = 1.0f

        const val DEFAULT_EXPRESSIVENESS = 1.0f

        val QUICK_SPEED_PRESETS = listOf(0.75f, 0.85f, 1.0f, 1.15f, 1.25f, 1.50f)
    }

    /**
     * Facteur fréquentiel calculé selon l'échelle tempérée : 2^(demi-tons / 12).
     * Exemple : -1.0 demi-ton -> 0.9438f ; +2.0 demi-tons -> 1.1224f.
     */
    val pitchMultiplier: Float
        get() = semitonesToFrequencyRatio(pitchSemitones)

    /**
     * Inverse du débit destiné au paramètre lengthScale du modèle VITS (1.0f / speechRate).
     */
    val vitsLengthScaleRatio: Float
        get() = (1.0f / speechRate.coerceIn(MIN_SPEECH_RATE, MAX_SPEECH_RATE))

    fun semitonesToFrequencyRatio(semitones: Float): Float =
        2.0.pow(semitones.toDouble() / 12.0).toFloat().coerceIn(0.75f, 1.35f)
}

enum class PunctuationRhythmType(
    val basePauseMs: Int,
    val relativeSpeedFactor: Float,
    val relativePitchDeltaSemitones: Float
) {
    COMMA_CLAUSE(
        basePauseMs = 135,
        relativeSpeedFactor = 1.02f,
        relativePitchDeltaSemitones = 0.15f
    ),
    COLON_OR_DASH(
        basePauseMs = 210,
        relativeSpeedFactor = 0.98f,
        relativePitchDeltaSemitones = 0.0f
    ),
    DECLARATIVE_PERIOD(
        basePauseMs = 330,
        relativeSpeedFactor = 1.0f,
        relativePitchDeltaSemitones = -0.25f
    ),
    QUESTION_OR_EXCLAMATION(
        basePauseMs = 370,
        relativeSpeedFactor = 0.96f,
        relativePitchDeltaSemitones = 0.45f
    ),
    PARAGRAPH_TRANSITION(
        basePauseMs = 500,
        relativeSpeedFactor = 0.95f,
        relativePitchDeltaSemitones = -0.35f
    )
}

data class ProsodicClause(
    val parentSentenceIndex: Int,
    val text: String,
    val rhythmType: PunctuationRhythmType,
    val computedPauseMs: Int,
    val userTargetSpeechRate: Float,
    val effectiveGenerationSpeed: Float,
    val effectivePlaybackPitch: Float,
    val clausePitchDeltaSemitones: Float
)

/**
 * Moteur de rythme prosodique et de scaling Vitesse / Pitch en temps réel.
 *
 * Expose un état réactif [prosodyState] directement consommé par [SherpaOnnxTtsManager].
 * Gère deux niveaux complémentaires de scaling :
 * 1. **Scaling Neuronal VITS (Durée Phonémique)** : chaque clause envoyée à [com.k2fsa.sherpa.onnx.OfflineTts.generate]
 *    reçoit (effectiveGenerationSpeed = speechRate * rhythmType.relativeSpeedFactor).
 * 2. **Scaling Matériel AudioTrack Temps Réel (0 ms de latence)** : lorsque l'utilisateur déplace
 *    le curseur de vitesse (0.75x..1.50x) ou de pitch (-4..+4 st) pendant la lecture d'une phrase
 *    déjà synthétisée en mémoire tampon, [buildRealtimePlaybackParams] calcule le ratio de vitesse
 *    différentiel (currentSpeechRate / chunkSynthesizedRate) et le facteur de pitch pour mettre
 *    à jour immédiatement l'instance [android.media.AudioTrack] sans attendre la phrase suivante.
 */
class ProsodyRhythmEngine {

    private val _prosodyState = MutableStateFlow(ProsodyParameters())
    val prosodyState: StateFlow<ProsodyParameters> = _prosodyState.asStateFlow()

    private val clauseSplitRegex = Regex("(?<=[,;:.?!—])\\\\s+")

    /**
     * Règle la vitesse de lecture en temps réel dans la plage [0.75x .. 1.50x].
     */
    fun setSpeechRate(rate: Float): ProsodyParameters {
        val clamped = rate.coerceIn(
            ProsodyParameters.MIN_SPEECH_RATE,
            ProsodyParameters.MAX_SPEECH_RATE
        )
        _prosodyState.update { it.copy(speechRate = clamped) }
        return _prosodyState.value
    }

    /**
     * Incrémente ou décrémente la vitesse de lecture (ex. +0.10f ou -0.10f depuis la bulle flottante).
     */
    fun stepSpeechRate(delta: Float): ProsodyParameters =
        setSpeechRate(_prosodyState.value.speechRate + delta)

    /**
     * Règle la hauteur tonale (pitch) en demi-tons dans la plage [-4.0 .. +4.0].
     */
    fun setPitchSemitones(semitones: Float): ProsodyParameters {
        val clamped = semitones.coerceIn(
            ProsodyParameters.MIN_PITCH_SEMITONES,
            ProsodyParameters.MAX_PITCH_SEMITONES
        )
        _prosodyState.update { it.copy(pitchSemitones = clamped) }
        return _prosodyState.value
    }

    /**
     * Règle l'amplitude des silences respiratoires aux ponctuations (0.60x à 1.50x).
     */
    fun setPauseScale(scale: Float): ProsodyParameters {
        val clamped = scale.coerceIn(
            ProsodyParameters.MIN_PAUSE_SCALE,
            ProsodyParameters.MAX_PAUSE_SCALE
        )
        _prosodyState.update { it.copy(pauseScale = clamped) }
        return _prosodyState.value
    }

    /**
     * Met à jour simultanément l'ensemble des paramètres prosodiques.
     */
    fun updateParameters(
        speechRate: Float = _prosodyState.value.speechRate,
        pitchSemitones: Float = _prosodyState.value.pitchSemitones,
        pauseScale: Float = _prosodyState.value.pauseScale,
        expressiveness: Float = _prosodyState.value.expressiveness
    ): ProsodyParameters {
        val updated = ProsodyParameters(
            speechRate = speechRate.coerceIn(
                ProsodyParameters.MIN_SPEECH_RATE,
                ProsodyParameters.MAX_SPEECH_RATE
            ),
            pitchSemitones = pitchSemitones.coerceIn(
                ProsodyParameters.MIN_PITCH_SEMITONES,
                ProsodyParameters.MAX_PITCH_SEMITONES
            ),
            pauseScale = pauseScale.coerceIn(
                ProsodyParameters.MIN_PAUSE_SCALE,
                ProsodyParameters.MAX_PAUSE_SCALE
            ),
            expressiveness = expressiveness.coerceIn(0.50f, 1.40f)
        )
        _prosodyState.value = updated
        return updated
    }

    /**
     * Construit les paramètres matériels [PlaybackParams] d'Android [ android.media.AudioTrack ]
     * pour appliquer instantanément un changement de vitesse (0.75x..1.50x) ou de pitch (-4..+4 st)
     * sur le segment audio en cours de lecture.
     *
     * @param chunkSynthesizedUserRate Vitesse utilisateur qui était active au moment où le segment PCM a été généré par VITS
     * @param clausePitchDeltaSemitones Micro-inflexion prosodique propre à la ponctuation de la clause courante
     */
    fun buildRealtimePlaybackParams(
        chunkSynthesizedUserRate: Float = _prosodyState.value.speechRate,
        clausePitchDeltaSemitones: Float = 0.0f
    ): PlaybackParams {
        val current = _prosodyState.value

        // Si le segment a déjà été synthétisé par VITS à 1.25x et que l'utilisateur est toujours à 1.25x,
        // deltaSpeedRatio vaut 1.0f. Si l'utilisateur glisse le curseur à 1.50x pendant la phrase,
        // AudioTrack accélère immédiatement de (1.50 / 1.25 = 1.20x) jusqu'au segment suivant.
        val safeBaseRate = chunkSynthesizedUserRate.coerceAtLeast(0.5f)
        val deltaSpeedRatio = (current.speechRate / safeBaseRate).coerceIn(0.65f, 1.65f)

        val totalSemitones = current.pitchSemitones + (clausePitchDeltaSemitones * current.expressiveness)
        val targetPitchFactor = 2.0.pow(totalSemitones.toDouble() / 12.0)
            .toFloat()
            .coerceIn(0.75f, 1.35f)

        return PlaybackParams()
            .allowDefaults()
            .setSpeed(deltaSpeedRatio)
            .setPitch(targetPitchFactor)
            .setAudioFallbackMode(PlaybackParams.AUDIO_FALLBACK_MODE_DEFAULT)
    }

    /**
     * Découpe une phrase en sous-clauses prosodiques et calcule pour chacune :
     * - la vitesse effective de synthèse VITS ([ProsodicClause.effectiveGenerationSpeed]),
     * - la hauteur tonale cible ([ProsodicClause.effectivePlaybackPitch]),
     * - la durée exacte de la pause respiratoire en millisecondes ([ProsodicClause.computedPauseMs]).
     */
    fun buildProsodicClauses(
        sentenceIndex: Int,
        sentenceText: String,
        isEndOfParagraph: Boolean,
        params: ProsodyParameters = _prosodyState.value
    ): List<ProsodicClause> {
        val rawParts = sentenceText
            .split(clauseSplitRegex)
            .map { it.trim() }
            .filter { it.isNotEmpty() }

        if (rawParts.isEmpty()) return emptyList()

        val balancedParts = mutableListOf<String>()
        var buffer = ""
        for (part in rawParts) {
            buffer = if (buffer.isEmpty()) part else "\$buffer \$part"
            if (buffer.length >= 24 || part.endsWith(".") || part.endsWith("?") || part.endsWith("!")) {
                balancedParts.add(buffer)
                buffer = ""
            }
        }
        if (buffer.isNotEmpty()) {
            if (balancedParts.isNotEmpty()) {
                val lastIdx = balancedParts.lastIndex
                balancedParts[lastIdx] = "\${balancedParts[lastIdx]} \$buffer"
            } else {
                balancedParts.add(buffer)
            }
        }

        val clampedUserRate = params.speechRate.coerceIn(
            ProsodyParameters.MIN_SPEECH_RATE,
            ProsodyParameters.MAX_SPEECH_RATE
        )

        return balancedParts.mapIndexed { idx, clauseText ->
            val isLastClause = idx == balancedParts.lastIndex
            val rhythmType = classifyRhythmType(clauseText, isLastClause && isEndOfParagraph)

            // Scaling inverse des pauses : plus la lecture est rapide, plus les respirations se raccourcissent naturellement
            val scaledPauseMs = (rhythmType.basePauseMs * params.pauseScale / clampedUserRate.coerceAtLeast(0.80f))
                .toInt()
                .coerceIn(70, 850)

            // Vitesse envoyée à OfflineTts.generate(text, sid, speed)
            val effectiveSpeed = (clampedUserRate * rhythmType.relativeSpeedFactor)
                .coerceIn(0.65f, 1.65f)

            val clauseDeltaSt = rhythmType.relativePitchDeltaSemitones
            val totalSemitones = params.pitchSemitones + (clauseDeltaSt * params.expressiveness)
            val effectivePitch = 2.0.pow(totalSemitones.toDouble() / 12.0)
                .toFloat()
                .coerceIn(0.75f, 1.35f)

            ProsodicClause(
                parentSentenceIndex = sentenceIndex,
                text = clauseText,
                rhythmType = rhythmType,
                computedPauseMs = scaledPauseMs,
                userTargetSpeechRate = clampedUserRate,
                effectiveGenerationSpeed = effectiveSpeed,
                effectivePlaybackPitch = effectivePitch,
                clausePitchDeltaSemitones = clauseDeltaSt
            )
        }
    }

    private fun classifyRhythmType(text: String, isParagraphEnd: Boolean): PunctuationRhythmType {
        if (isParagraphEnd) return PunctuationRhythmType.PARAGRAPH_TRANSITION
        return when {
            text.endsWith("?") || text.endsWith("!") -> PunctuationRhythmType.QUESTION_OR_EXCLAMATION
            text.endsWith(":") || text.endsWith(";") || text.endsWith("—") -> PunctuationRhythmType.COLON_OR_DASH
            text.endsWith(",") -> PunctuationRhythmType.COMMA_CLAUSE
            else -> PunctuationRhythmType.DECLARATIVE_PERIOD
        }
    }

    /**
     * Supprime le silence résiduel en fin d'inférence ONNX, applique une enveloppe cosinus douce
     * (attaque 12 ms / relâchement 24 ms) et ajoute le silence de respiration calibré.
     */
    fun shapeWaveWithProsodicBreath(
        rawSamples: FloatArray,
        sampleRate: Int,
        pauseDurationMs: Int
    ): FloatArray {
        if (rawSamples.isEmpty()) return rawSamples

        var trimmedEnd = rawSamples.size
        val silenceThreshold = 0.0035f
        while (trimmedEnd > sampleRate / 20 && kotlin.math.abs(rawSamples[trimmedEnd - 1]) < silenceThreshold) {
            trimmedEnd--
        }

        val attackSamples = min(trimmedEnd / 4, (sampleRate * 0.012f).toInt())
        val releaseSamples = min(trimmedEnd / 3, (sampleRate * 0.024f).toInt())
        val breathSilenceSamples = (sampleRate * (pauseDurationMs / 1000f)).toInt()

        val output = FloatArray(trimmedEnd + breathSilenceSamples)
        System.arraycopy(rawSamples, 0, output, 0, trimmedEnd)

        for (i in 0 until attackSamples) {
            val phase = i.toDouble() / attackSamples.toDouble()
            val gain = (0.5 * (1.0 - cos(PI * phase))).toFloat()
            output[i] *= gain
        }

        for (i in 0 until releaseSamples) {
            val phase = i.toDouble() / releaseSamples.toDouble()
            val gain = (0.5 * (1.0 - cos(PI * phase))).toFloat()
            output[trimmedEnd - 1 - i] *= gain
        }

        return output
    }
}`,
  },
  {
    id: 'sherpa-onnx-tts-engine',
    filename: 'SherpaOnnxTtsManager.kt',
    path: 'app/src/main/java/com/fishreader/app/data/tts/SherpaOnnxTtsManager.kt',
    category: 'Moteur Audio Sherpa-ONNX',
    language: 'kotlin',
    summary:
      'Service TtsManager connecté à ProsodyRhythmEngine et PiperVitsConfigBuilder : expose le réglage temps réel de la vitesse (0.75x–1.50x) et du pitch (-4 à +4 demi-tons) avec double tampon Channel.',
    keyTakeaways: [
      'Délègue la gestion du débit (0.75x..1.50x) et du pitch à ProsodyRhythmEngine via setSpeechRate(), stepSpeechRate(), setPitchSemitones() et updateProsodyParameters()',
      'Applique instantanément les changements de vitesse et de hauteur sur l’AudioTrack actif (0 ms de latence) tout en recalibrant le prédicteur de durée VITS sur les clauses suivantes',
      'Utilise PiperVitsConfigBuilder pour charger les modèles VITS Medium/High (22.05 kHz) depuis context.filesDir',
    ],
    code: `package com.fishreader.app.data.tts

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import com.k2fsa.sherpa.onnx.OfflineTts
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlin.math.max

data class TtsPlaybackState(
    val isReady: Boolean = false,
    val isPlaying: Boolean = false,
    val activeProfile: VoiceModelProfile = VoiceModelProfile.FR_SIWIS_MEDIUM,
    val prosody: ProsodyParameters = ProsodyParameters(),
    val languageCode: String = "fr",
    val sentences: List<String> = emptyList(),
    val currentSentenceIndex: Int = 0,
    val currentSentenceText: String = ""
)

private data class SynthesizedProsodicChunk(
    val sentenceIndex: Int,
    val sentenceText: String,
    val synthesizedAtUserRate: Float,
    val clausePitchDeltaSemitones: Float,
    val pcmSamples: FloatArray
)

@OptIn(ExperimentalCoroutinesApi::class)
class SherpaOnnxTtsManager(
    context: Context,
    private val externalScope: CoroutineScope,
    val rhythmEngine: ProsodyRhythmEngine = ProsodyRhythmEngine()
) {
    private val assetExtractor = PiperAssetExtractor(context.applicationContext)

    /**
     * Dispatcher séquentiel dédié aux appels matériels AudioTrack (Binder IPC AudioFlinger).
     * Garantit que le changement de vitesse (0.75x..1.50x) depuis l'UI ne bloque JAMAIS
     * le Main Thread, même lorsque AudioTrack.write(..., WRITE_BLOCKING) est actif.
     */
    private val audioControlDispatcher: CoroutineDispatcher =
        Dispatchers.Default.limitedParallelism(1)

    /**
     * Flux conflaté (DROP_OLDEST) coalesçant les changements rapides de paliers de vitesse
     * ou de curseur de pitch sans saturer le thread AudioTrack.
     */
    private val hardwareSyncRequests = MutableSharedFlow<Unit>(
        replay = 1,
        extraBufferCapacity = 1,
        onBufferOverflow = kotlinx.coroutines.channels.BufferOverflow.DROP_OLDEST
    )

    private val loadedEngines = mutableMapOf<VoiceModelProfile, OfflineTts>()
    private var espeakDataPath: String = ""

    private var audioTrack: AudioTrack? = null
    private var streamingJob: Job? = null

    // Garde une trace du débit auquel le chunk actuellement joué par AudioTrack a été synthétisé
    @Volatile
    private var activeChunkSynthesizedRate: Float = ProsodyParameters.DEFAULT_SPEECH_RATE

    @Volatile
    private var activeClausePitchDeltaSemitones: Float = 0.0f

    private val _playbackState = MutableStateFlow(
        TtsPlaybackState(prosody = rhythmEngine.prosodyState.value)
    )
    val playbackState: StateFlow<TtsPlaybackState> = _playbackState.asStateFlow()

    /**
     * Expose directement le flux StateFlow des paramètres prosodiques de [ProsodyRhythmEngine].
     */
    val prosodyState: StateFlow<ProsodyParameters>
        get() = rhythmEngine.prosodyState

    init {
        // Consommateur asynchrone non-bloquant pour les mises à jour PlaybackParams (vitesse & pitch)
        externalScope.launch(audioControlDispatcher) {
            hardwareSyncRequests.collect {
                applyRealtimeAudioTrackParamsOffMainThread()
            }
        }
    }

    companion object {
        @Volatile
        private var INSTANCE: SherpaOnnxTtsManager? = null

        fun getInstance(context: Context, scope: CoroutineScope): SherpaOnnxTtsManager {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: SherpaOnnxTtsManager(context, scope).also { INSTANCE = it }
            }
        }
    }

    suspend fun initializeModels() = withContext(Dispatchers.IO) {
        if (_playbackState.value.isReady) return@withContext
        espeakDataPath = assetExtractor.ensureEspeakDataExtracted().absolutePath

        getOrCreateEngine(VoiceModelProfile.FR_SIWIS_MEDIUM)
        getOrCreateEngine(VoiceModelProfile.EN_LESSAC_HIGH)

        _playbackState.value = _playbackState.value.copy(isReady = true)
    }

    private fun getOrCreateEngine(profile: VoiceModelProfile): OfflineTts {
        loadedEngines[profile]?.let { return it }

        val paths = assetExtractor.ensureVoiceProfileExtracted(profile)
        val currentProsody = rhythmEngine.prosodyState.value

        val config = PiperVitsConfigBuilder.buildOfflineTtsConfig(
            extractedPaths = paths,
            espeakDataDirPath = espeakDataPath,
            profile = profile,
            initialSpeechRate = currentProsody.speechRate,
            expressiveness = currentProsody.expressiveness,
            cpuThreads = 4
        )

        val engine = OfflineTts(assetManager = null, config = config)
        loadedEngines[profile] = engine
        return engine
    }

    /**
     * Modifie en temps réel la vitesse de lecture entre 0.75x et 1.50x sans bloquer le thread UI :
     * 1. Met à jour l'état StateFlow en mémoire (< 0.1 ms sur Main.immediate).
     * 2. Émet un signal non-bloquant (tryEmit + DROP_OLDEST) vers [audioControlDispatcher]
     *    pour appliquer le ratio sur AudioTrack en arrière-plan.
     */
    fun setSpeechRate(speechRate: Float) {
        val updated = rhythmEngine.setSpeechRate(speechRate)
        _playbackState.value = _playbackState.value.copy(prosody = updated)
        hardwareSyncRequests.tryEmit(Unit)
    }

    /**
     * Incrémente ou décrémente la vitesse de lecture (ex. +0.10f ou -0.10f) sans blocage UI.
     */
    fun stepSpeechRate(delta: Float) {
        val updated = rhythmEngine.stepSpeechRate(delta)
        _playbackState.value = _playbackState.value.copy(prosody = updated)
        hardwareSyncRequests.tryEmit(Unit)
    }

    /**
     * Modifie en temps réel la hauteur tonale (pitch) entre -4.0 et +4.0 demi-tons sans blocage UI.
     */
    fun setPitchSemitones(pitchSemitones: Float) {
        val updated = rhythmEngine.setPitchSemitones(pitchSemitones)
        _playbackState.value = _playbackState.value.copy(prosody = updated)
        hardwareSyncRequests.tryEmit(Unit)
    }

    /**
     * Modifie l'échelle des pauses respiratoires aux ponctuations (0.60x à 1.50x).
     */
    fun setPauseScale(pauseScale: Float) {
        val updated = rhythmEngine.setPauseScale(pauseScale)
        _playbackState.value = _playbackState.value.copy(prosody = updated)
    }

    /**
     * Met à jour conjointement la vitesse (0.75x à 1.50x), le pitch (-4 à +4 demi-tons),
     * l'amplitude des pauses et l'expressivité de manière 100 % non-bloquante pour l'UI.
     */
    fun updateProsodyParameters(
        speechRate: Float = rhythmEngine.prosodyState.value.speechRate,
        pitchSemitones: Float = rhythmEngine.prosodyState.value.pitchSemitones,
        pauseScale: Float = rhythmEngine.prosodyState.value.pauseScale,
        expressiveness: Float = rhythmEngine.prosodyState.value.expressiveness
    ) {
        val updated = rhythmEngine.updateParameters(
            speechRate = speechRate,
            pitchSemitones = pitchSemitones,
            pauseScale = pauseScale,
            expressiveness = expressiveness
        )
        _playbackState.value = _playbackState.value.copy(prosody = updated)
        hardwareSyncRequests.tryEmit(Unit)
    }

    fun switchVoiceProfile(profile: VoiceModelProfile) {
        val current = _playbackState.value
        _playbackState.value = current.copy(
            activeProfile = profile,
            languageCode = profile.languageCode
        )
        if (current.isPlaying) {
            startProsodicStreamingLoop(startIndex = current.currentSentenceIndex)
        }
    }

    fun speakSentences(sentences: List<String>, languageCode: String) {
        if (sentences.isEmpty()) return
        stopAudioTrack()

        val currentProfile = _playbackState.value.activeProfile
        val targetProfile = if (currentProfile.languageCode == languageCode) {
            currentProfile
        } else {
            VoiceModelProfile.defaultForLanguage(languageCode)
        }

        _playbackState.value = _playbackState.value.copy(
            isReady = true,
            isPlaying = true,
            activeProfile = targetProfile,
            languageCode = languageCode,
            sentences = sentences,
            currentSentenceIndex = 0,
            currentSentenceText = sentences.first()
        )

        startProsodicStreamingLoop(startIndex = 0)
    }

    private fun startProsodicStreamingLoop(startIndex: Int) {
        streamingJob?.cancel()
        streamingJob = externalScope.launch(Dispatchers.Default) {
            val snapshot = _playbackState.value
            val engine = withContext(Dispatchers.IO) {
                getOrCreateEngine(snapshot.activeProfile)
            }

            val sampleRate = engine.sampleRate()
            ensureAudioTrack(sampleRate)

            val chunkChannel = Channel<SynthesizedProsodicChunk>(capacity = 4)

            val producer = launch(Dispatchers.Default) {
                for (sIdx in startIndex until snapshot.sentences.size) {
                    ensureActive()
                    val sentence = snapshot.sentences[sIdx]

                    // Lecture dynamique des paramètres prosodiques courants depuis ProsodyRhythmEngine
                    val liveProsody = rhythmEngine.prosodyState.value

                    val clauses = rhythmEngine.buildProsodicClauses(
                        sentenceIndex = sIdx,
                        sentenceText = sentence,
                        isEndOfParagraph = (sIdx == snapshot.sentences.lastIndex),
                        params = liveProsody
                    )

                    for (clause in clauses) {
                        ensureActive()
                        // Le débit utilisateur peut avoir changé entre deux sous-clauses :
                        // on relit la valeur temps réel de ProsodyRhythmEngine juste avant l'inférence VITS.
                        val latestRate = rhythmEngine.prosodyState.value.speechRate
                        val dynamicSpeed = (latestRate * clause.rhythmType.relativeSpeedFactor)
                            .coerceIn(0.65f, 1.65f)

                        val generated = engine.generate(
                            text = clause.text,
                            sid = snapshot.activeProfile.defaultSpeakerId,
                            speed = dynamicSpeed
                        )

                        val shapedWave = rhythmEngine.shapeWaveWithProsodicBreath(
                            rawSamples = generated.samples,
                            sampleRate = sampleRate,
                            pauseDurationMs = clause.computedPauseMs
                        )

                        chunkChannel.send(
                            SynthesizedProsodicChunk(
                                sentenceIndex = sIdx,
                                sentenceText = sentence,
                                synthesizedAtUserRate = latestRate,
                                clausePitchDeltaSemitones = clause.clausePitchDeltaSemitones,
                                pcmSamples = shapedWave
                            )
                        )
                    }
                }
                chunkChannel.close()
            }

            audioTrack?.play()
            for (chunk in chunkChannel) {
                ensureActive()
                activeChunkSynthesizedRate = chunk.synthesizedAtUserRate
                activeClausePitchDeltaSemitones = chunk.clausePitchDeltaSemitones

                _playbackState.value = _playbackState.value.copy(
                    isPlaying = true,
                    prosody = rhythmEngine.prosodyState.value,
                    currentSentenceIndex = chunk.sentenceIndex,
                    currentSentenceText = chunk.sentenceText
                )

                applyRealtimeAudioTrackParamsOffMainThread()

                audioTrack?.write(
                    chunk.pcmSamples,
                    0,
                    chunk.pcmSamples.size,
                    AudioTrack.WRITE_BLOCKING
                )
            }

            producer.join()
            _playbackState.value = _playbackState.value.copy(
                isPlaying = false,
                currentSentenceText = "Lecture terminée"
            )
        }
    }

    /**
     * S'exécute exclusivement hors du Main Thread (sur [audioControlDispatcher] ou le worker de streaming) :
     * interroge [ProsodyRhythmEngine.buildRealtimePlaybackParams] et met à jour l'AudioTrack matériel.
     */
    private fun applyRealtimeAudioTrackParamsOffMainThread() {
        val track = audioTrack ?: return
        try {
            val playbackParams = rhythmEngine.buildRealtimePlaybackParams(
                chunkSynthesizedUserRate = activeChunkSynthesizedRate,
                clausePitchDeltaSemitones = activeClausePitchDeltaSemitones
            )
            track.playbackParams = playbackParams
        } catch (_: IllegalArgumentException) {}
    }

    fun togglePlayPause() {
        val current = _playbackState.value
        if (current.sentences.isEmpty()) return

        if (current.isPlaying) {
            streamingJob?.cancel()
            externalScope.launch(audioControlDispatcher) {
                audioTrack?.pause()
                audioTrack?.flush()
            }
            _playbackState.value = current.copy(isPlaying = false)
        } else {
            startProsodicStreamingLoop(startIndex = current.currentSentenceIndex)
        }
    }

    fun rewindSeconds(seconds: Int = 30) {
        val current = _playbackState.value
        if (current.sentences.isEmpty()) return

        val sentencesStepBack = max(1, seconds / 12)
        val newIndex = max(0, current.currentSentenceIndex - sentencesStepBack)

        streamingJob?.cancel()
        externalScope.launch(audioControlDispatcher) {
            audioTrack?.pause()
            audioTrack?.flush()
        }

        startProsodicStreamingLoop(startIndex = newIndex)
    }

    private fun ensureAudioTrack(sampleRate: Int) {
        if (audioTrack != null && audioTrack?.sampleRate == sampleRate) return
        audioTrack?.release()

        val minBufferSize = AudioTrack.getMinBufferSize(
            sampleRate,
            AudioFormat.CHANNEL_OUT_MONO,
            AudioFormat.ENCODING_PCM_FLOAT
        )

        audioTrack = AudioTrack.Builder()
            .setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build()
            )
            .setAudioFormat(
                AudioFormat.Builder()
                    .setEncoding(AudioFormat.ENCODING_PCM_FLOAT)
                    .setSampleRate(sampleRate)
                    .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                    .build()
            )
            .setBufferSizeInBytes(minBufferSize * 3)
            .setTransferMode(AudioTrack.MODE_STREAM)
            .build()
    }

    private fun stopAudioTrack() {
        streamingJob?.cancel()
        audioTrack?.pause()
        audioTrack?.flush()
    }

    fun release() {
        stopAudioTrack()
        audioTrack?.release()
        loadedEngines.values.forEach { it.release() }
        loadedEngines.clear()
    }
}`,
  },
  {
    id: 'overlay-lifecycle-owner',
    filename: 'OverlayLifecycleOwner.kt',
    path: 'app/src/main/java/com/fishreader/app/service/OverlayLifecycleOwner.kt',
    category: 'Service Overlay & Compose',
    language: 'kotlin',
    summary:
      'Pont de cycle de vie indispensable permettant d’attacher un ComposeView moderne dans une fenêtre système WindowManager hors d’une Activity.',
    keyTakeaways: [
      'Implémente LifecycleOwner, ViewModelStoreOwner et SavedStateRegistryOwner',
      'Injecte les propriétaires dans la vue racine via setViewTreeLifecycleOwner et setViewTreeSavedStateRegistryOwner',
      'Évite le crash IllegalStateException: ViewTreeLifecycleOwner not found lors de l’affichage de l’overlay',
    ],
    code: `package com.fishreader.app.service

import android.os.Bundle
import android.view.View
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleRegistry
import androidx.lifecycle.ViewModelStore
import androidx.lifecycle.ViewModelStoreOwner
import androidx.lifecycle.setViewTreeLifecycleOwner
import androidx.lifecycle.setViewTreeViewModelStoreOwner
import androidx.savedstate.SavedStateRegistry
import androidx.savedstate.SavedStateRegistryController
import androidx.savedstate.SavedStateRegistryOwner
import androidx.savedstate.setViewTreeSavedStateRegistryOwner

class OverlayLifecycleOwner :
    androidx.lifecycle.LifecycleOwner,
    ViewModelStoreOwner,
    SavedStateRegistryOwner {

    private val lifecycleRegistry = LifecycleRegistry(this)
    private val savedStateRegistryController = SavedStateRegistryController.create(this)
    private val store = ViewModelStore()

    override val lifecycle: Lifecycle
        get() = lifecycleRegistry

    override val viewModelStore: ViewModelStore
        get() = store

    override val savedStateRegistry: SavedStateRegistry
        get() = savedStateRegistryController.savedStateRegistry

    fun onCreate() {
        savedStateRegistryController.performRestore(Bundle())
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_CREATE)
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_START)
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_RESUME)
    }

    fun onDestroy() {
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_PAUSE)
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_STOP)
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_DESTROY)
        store.clear()
    }

    fun attachToDecorView(view: View) {
        view.setViewTreeLifecycleOwner(this)
        view.setViewTreeViewModelStoreOwner(this)
        view.setViewTreeSavedStateRegistryOwner(this)
    }
}`,
  },
  {
    id: 'android-overlay-simulator-kt',
    filename: 'AndroidOverlaySimulator.kt',
    path: 'app/src/main/java/com/fishreader/app/ui/overlay/AndroidOverlaySimulator.kt',
    category: 'Service Overlay & Compose',
    language: 'kotlin',
    summary:
      'Couche d’interaction Compose hautes performances pour le widget flottant : architecture multi-dispatchers (Main.immediate + Default.limitedParallelism(1) + BufferOverflow.DROP_OLDEST) garantissant 0 ms de blocage UI lors du changement de vitesse.',
    keyTakeaways: [
      'Sépare strictement le rendu optimiste UI (Dispatchers.Main.immediate, < 0.1 ms) et la synchronisation matérielle AudioTrack/VITS (Dispatchers.Default.limitedParallelism(1))',
      'Coalesce les appuis rapides sur les préréglages de vitesse (0.75x, 0.85x, 1.0x, 1.15x, 1.25x, 1.50x) via un MutableSharedFlow conflaté (BufferOverflow.DROP_OLDEST + collectLatest)',
      'Isolations de recomposition Jetpack Compose via @Immutable, derivedStateOf et lambdas stabilisées rememberUpdatedState',
    ],
    code: `package com.fishreader.app.ui.overlay

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.fishreader.app.data.tts.ProsodyParameters
import com.fishreader.app.data.tts.SherpaOnnxTtsManager
import com.fishreader.app.data.tts.TtsPlaybackState
import com.fishreader.app.service.DockEdge
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.BufferOverflow
import kotlinx.coroutines.flow.*
import kotlin.math.abs

/**
 * Configuration dédiée des CoroutineDispatchers pour la couche d'interaction de l'overlay.
 *
 * POURQUOI CETTE SÉPARATION EST CRITIQUE :
 * Sur Android, l'appel à [android.media.AudioTrack.setPlaybackParams] effectue une transaction
 * IPC Binder vers AudioFlinger et acquiert le verrou natif de l'AudioTrack. Si une écriture PCM
 * bloquante (WRITE_BLOCKING) est en cours sur le thread de synthèse, appeler setPlaybackParams
 * depuis le thread principal bloque l'UI pendant 15 à 80 ms (saccade visible lors du clic sur
 * un préréglage de vitesse ou du glisser-déposer de la bulle).
 */
@OptIn(ExperimentalCoroutinesApi::class)
class OverlayInteractionDispatchers(
    val uiImmediate: CoroutineDispatcher = Dispatchers.Main.immediate,
    val audioControlSerial: CoroutineDispatcher = Dispatchers.Default.limitedParallelism(1),
    val prosodyCompute: CoroutineDispatcher = Dispatchers.Default
)

@Immutable
data class SpeedPresetUiModel(
    val rate: Float,
    val label: String
)

/**
 * Contrôleur d'interaction non-bloquant pour le widget flottant et le simulateur d'overlay.
 *
 * - Met à jour l'état visuel [optimisticSpeechRate] de façon synchrone et sans verrou sur
 *   [OverlayInteractionDispatchers.uiImmediate] pour une réactivité tactile à 120 Hz.
 * - Délègue la mise à jour du moteur [SherpaOnnxTtsManager] et d'AudioTrack à
 *   [OverlayInteractionDispatchers.audioControlSerial] via un flux conflaté [BufferOverflow.DROP_OLDEST].
 */
class OverlayInteractionController(
    private val ttsManager: SherpaOnnxTtsManager,
    private val scope: CoroutineScope,
    private val dispatchers: OverlayInteractionDispatchers = OverlayInteractionDispatchers()
) {
    private val _optimisticSpeechRate = MutableStateFlow(
        ttsManager.playbackState.value.prosody.speechRate
    )
    val optimisticSpeechRate: StateFlow<Float> = _optimisticSpeechRate.asStateFlow()

    private val _lastDispatchLatencyMicros = MutableStateFlow(0L)
    val lastDispatchLatencyMicros: StateFlow<Long> = _lastDispatchLatencyMicros.asStateFlow()

    // Canal conflaté : si l'utilisateur appuie rapidement sur 0.85x -> 1.15x -> 1.50x,
    // seule la dernière valeur cible est traitée par le thread AudioTrack/VITS.
    private val ratePresetRequests = MutableSharedFlow<Float>(
        replay = 1,
        extraBufferCapacity = 1,
        onBufferOverflow = BufferOverflow.DROP_OLDEST
    )

    private val windowDragChannel = MutableSharedFlow<Pair<Float, Float>>(
        replay = 0,
        extraBufferCapacity = 64,
        onBufferOverflow = BufferOverflow.DROP_OLDEST
    )

    val speedPresets: List<SpeedPresetUiModel> = ProsodyParameters.QUICK_SPEED_PRESETS.map { rate ->
        SpeedPresetUiModel(rate = rate, label = "\${rate}x")
    }

    init {
        // Synchronisation initiale et écoute des changements externes (ex. depuis MainActivity)
        scope.launch(dispatchers.uiImmediate) {
            ttsManager.prosodyState
                .map { it.speechRate }
                .distinctUntilChanged()
                .collect { engineRate ->
                    _optimisticSpeechRate.value = engineRate
                }
        }

        // Pipeline asynchrone non-bloquant vers SherpaOnnxTtsManager & AudioTrack
        scope.launch(dispatchers.audioControlSerial) {
            ratePresetRequests
                .distinctUntilChanged { old, new -> abs(old - new) < 0.005f }
                .collectLatest { targetRate ->
                    val startNano = System.nanoTime()
                    withContext(dispatchers.prosodyCompute) {
                        ttsManager.setSpeechRate(targetRate)
                    }
                    _lastDispatchLatencyMicros.value = (System.nanoTime() - startNano) / 1_000L
                }
        }
    }

    /**
     * Appelé lors d'un clic sur un bouton de vitesse (0.75x..1.50x) dans l'overlay :
     * - Exécution sur [Dispatchers.Main.immediate] en < 50 microsecondes.
     * - Aucun blocage IPC ni recalcul de graphe VITS sur le thread UI.
     */
    fun onSelectSpeechRatePreset(newRate: Float) {
        val clamped = newRate.coerceIn(
            ProsodyParameters.MIN_SPEECH_RATE,
            ProsodyParameters.MAX_SPEECH_RATE
        )
        // 1. Mise à jour visuelle immédiate du bouton sélectionné
        _optimisticSpeechRate.value = clamped

        // 2. Émission non-bloquante (O(1)) vers le dispatcher audio séquentiel
        ratePresetRequests.tryEmit(clamped)
    }

    fun onTogglePlayPauseAsync() {
        scope.launch(dispatchers.audioControlSerial) {
            ttsManager.togglePlayPause()
        }
    }

    fun onRewind30sAsync() {
        scope.launch(dispatchers.audioControlSerial) {
            ttsManager.rewindSeconds(30)
        }
    }

    fun emitDragDelta(dx: Float, dy: Float, onApplyWindowUpdate: (Float, Float) -> Unit) {
        onApplyWindowUpdate(dx, dy)
        windowDragChannel.tryEmit(dx to dy)
    }
}

/**
 * Composant Jetpack Compose de la couche d'interaction de l'overlay (AndroidOverlaySimulator).
 * Utilise l'état optimiste [OverlayInteractionController.optimisticSpeechRate] pour éviter
 * toute latence visuelle lors de la commutation rapide entre les préréglages de vitesse.
 */
@Composable
fun AndroidOverlaySimulatorLayer(
    controller: OverlayInteractionController,
    isExpanded: Boolean,
    dockEdge: DockEdge,
    ttsState: TtsPlaybackState,
    statusText: String,
    onBubbleTapped: () -> Unit,
    onCloseExpanded: () -> Unit,
    onDragDelta: (Float, Float) -> Unit,
    onDragEnd: () -> Unit
) {
    val activeSpeechRate by controller.optimisticSpeechRate.collectAsState()
    val dispatchLatencyUs by controller.lastDispatchLatencyMicros.collectAsState()

    val currentOnDragDelta by rememberUpdatedState(onDragDelta)
    val currentOnDragEnd by rememberUpdatedState(onDragEnd)

    val bubbleShape = remember(dockEdge) {
        if (dockEdge == DockEdge.RIGHT) {
            RoundedCornerShape(topStart = 28.dp, bottomStart = 28.dp, topEnd = 8.dp, bottomEnd = 8.dp)
        } else {
            RoundedCornerShape(topStart = 8.dp, bottomStart = 8.dp, topEnd = 28.dp, bottomEnd = 28.dp)
        }
    }

    Box(
        modifier = Modifier.pointerInput(Unit) {
            detectDragGestures(
                onDragEnd = { currentOnDragEnd() },
                onDragCancel = { currentOnDragEnd() },
                onDrag = { change, dragAmount ->
                    change.consume()
                    controller.emitDragDelta(dragAmount.x, dragAmount.y, currentOnDragDelta)
                }
            )
        }
    ) {
        if (!isExpanded) {
            Box(
                modifier = Modifier
                    .size(width = 56.dp, height = 52.dp)
                    .clip(bubbleShape)
                    .background(Color(0xE60F172A))
                    .border(1.dp, Color(0xFF06B6D4), bubbleShape)
                    .clickable { onBubbleTapped() },
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(text = "🐟", fontSize = 20.sp)
                    Text(
                        text = "\${activeSpeechRate}x",
                        color = Color(0xFF38BDF8),
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        } else {
            Column(
                modifier = Modifier
                    .width(292.dp)
                    .clip(RoundedCornerShape(20.dp))
                    .background(Color(0xF50F172A))
                    .border(1.dp, Color(0x4006B6D4), RoundedCornerShape(20.dp))
                    .padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = ttsState.activeProfile.displayName,
                        color = Color(0xFF38BDF8),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    Text(
                        text = "Réduire",
                        color = Color(0xFF94A3B8),
                        fontSize = 11.sp,
                        modifier = Modifier.clickable { onCloseExpanded() }
                    )
                }

                Text(
                    text = ttsState.currentSentenceText.ifBlank { statusText },
                    color = Color.White,
                    fontSize = 12.sp,
                    maxLines = 2
                )

                // Barre de préréglages de vitesse non-bloquante (Main.immediate -> audioControlSerial)
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Vitesse (Non-Blocking Dispatch) :",
                            color = Color(0xFF94A3B8),
                            fontSize = 10.sp
                        )
                        Text(
                            text = "\${activeSpeechRate}x · \${dispatchLatencyUs}µs",
                            color = Color(0xFF34D399),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(5.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        controller.speedPresets.forEach { preset ->
                            val isSelected by remember(activeSpeechRate, preset.rate) {
                                derivedStateOf { abs(activeSpeechRate - preset.rate) < 0.03f }
                            }
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(
                                        if (isSelected) Color(0xFF06B6D4) else Color(0xFF1E293B)
                                    )
                                    .clickable {
                                        controller.onSelectSpeechRatePreset(preset.rate)
                                    }
                                    .padding(vertical = 5.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = preset.label,
                                    color = if (isSelected) Color(0xFF0B0F17) else Color(0xFFE2E8F0),
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedButton(
                        onClick = { controller.onRewind30sAsync() },
                        modifier = Modifier.weight(1f),
                        contentPadding = PaddingValues(vertical = 8.dp)
                    ) {
                        Text(text = "↺ -30s", color = Color(0xFFE2E8F0), fontSize = 12.sp)
                    }

                    Button(
                        onClick = { controller.onTogglePlayPauseAsync() },
                        modifier = Modifier.weight(1.3f),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF06B6D4)),
                        contentPadding = PaddingValues(vertical = 8.dp)
                    ) {
                        Text(
                            text = if (ttsState.isPlaying) "Pause" else "Lecture",
                            color = Color(0xFF0B0F17),
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp
                        )
                    }
                }
            }
        }
    }
}`,
  },
  {
    id: 'fish-overlay-service',
    filename: 'FishOverlayService.kt',
    path: 'app/src/main/java/com/fishreader/app/service/FishOverlayService.kt',
    category: 'Service Overlay & Compose',
    language: 'kotlin',
    summary:
      'ForegroundService gérant la fenêtre flottante WindowManager, l’aimantation magnétique aux bords gauche/droit, et l’intégration du contrôleur non-bloquant OverlayInteractionController.',
    keyTakeaways: [
      'Délègue toutes les interactions de changement de vitesse (0.75x à 1.50x) et de lecture à OverlayInteractionController (Main.immediate + Default.limitedParallelism(1))',
      'Exécute l’extraction AccessibilityNodeInfo / ML Kit OCR sur Dispatchers.Default sans jamais geler l’animation du widget flottant',
      'Utilise WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY avec FLAG_NOT_FOCUSABLE',
    ],
    code: `package com.fishreader.app.service

import android.animation.ValueAnimator
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.view.Gravity
import android.view.WindowManager
import android.view.animation.OvershootInterpolator
import androidx.compose.runtime.*
import androidx.compose.ui.platform.ComposeView
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import com.fishreader.app.data.tts.SherpaOnnxTtsManager
import com.fishreader.app.ui.overlay.AndroidOverlaySimulatorLayer
import com.fishreader.app.ui.overlay.OverlayInteractionController
import com.fishreader.app.ui.overlay.OverlayInteractionDispatchers
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlin.math.roundToInt

enum class DockEdge { LEFT, RIGHT }

class FishOverlayService : Service() {

    private val dispatchers = OverlayInteractionDispatchers()
    private val serviceScope = CoroutineScope(SupervisorJob() + dispatchers.uiImmediate)

    private lateinit var windowManager: WindowManager
    private lateinit var overlayLifecycleOwner: OverlayLifecycleOwner
    private lateinit var composeView: ComposeView
    private lateinit var windowParams: WindowManager.LayoutParams
    private lateinit var ttsManager: SherpaOnnxTtsManager
    private lateinit var interactionController: OverlayInteractionController

    private val _isExpanded = MutableStateFlow(false)
    private val _dockEdge = MutableStateFlow(DockEdge.RIGHT)
    private val _statusMessage = MutableStateFlow("Prêt · Piper SIWIS Medium 22.05 kHz")

    override fun onCreate() {
        super.onCreate()
        startMediaPlaybackForeground()

        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        ttsManager = SherpaOnnxTtsManager.getInstance(applicationContext, serviceScope)
        interactionController = OverlayInteractionController(
            ttsManager = ttsManager,
            scope = serviceScope,
            dispatchers = dispatchers
        )

        serviceScope.launch(Dispatchers.IO) {
            ttsManager.initializeModels()
        }

        setupFloatingWindow()
    }

    private fun startMediaPlaybackForeground() {
        val channelId = "fishreader_overlay_channel"
        val manager = getSystemService(NotificationManager::class.java)
        val channel = NotificationChannel(
            channelId,
            "FishReader Lecture Audio Locale",
            NotificationManager.IMPORTANCE_LOW
        )
        manager.createNotificationChannel(channel)

        val notification: Notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("FishReader actif")
            .setContentText("Touchez le poisson flottant pour lire l'écran hors ligne")
            .setSmallIcon(android.R.drawable.ic_lock_silent_mode_off)
            .setOngoing(true)
            .build()

        ServiceCompat.startForeground(
            this,
            1001,
            notification,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
            } else 0
        )
    }

    private fun setupFloatingWindow() {
        val metrics = windowManager.currentWindowMetrics.bounds
        val initialX = metrics.width() - dpToPx(64)
        val initialY = (metrics.height() * 0.35f).roundToInt()

        windowParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = initialX
            y = initialY
        }

        overlayLifecycleOwner = OverlayLifecycleOwner().apply { onCreate() }

        composeView = ComposeView(this).apply {
            overlayLifecycleOwner.attachToDecorView(this)
            setContent {
                val expanded by _isExpanded.collectAsState()
                val dockEdge by _dockEdge.collectAsState()
                val ttsState by ttsManager.playbackState.collectAsState()
                val statusMsg by _statusMessage.collectAsState()

                AndroidOverlaySimulatorLayer(
                    controller = interactionController,
                    isExpanded = expanded,
                    dockEdge = dockEdge,
                    ttsState = ttsState,
                    statusText = statusMsg,
                    onBubbleTapped = { onFishBubbleClicked() },
                    onCloseExpanded = { _isExpanded.value = false },
                    onDragDelta = { dx, dy -> updateWindowPosition(dx, dy) },
                    onDragEnd = { snapToNearestScreenEdge() }
                )
            }
        }

        windowManager.addView(composeView, windowParams)
    }

    private fun onFishBubbleClicked() {
        _isExpanded.value = true
        val currentState = ttsManager.playbackState.value
        if (!currentState.isPlaying && currentState.sentences.isEmpty()) {
            triggerScreenExtractionAndSpeak()
        }
    }

    private fun triggerScreenExtractionAndSpeak() {
        serviceScope.launch(dispatchers.uiImmediate) {
            _statusMessage.value = "Analyse et rythme prosodique..."
            val accessibilityService = FishAccessibilityService.getInstance()
            if (accessibilityService == null) {
                _statusMessage.value = "Activez le service d'accessibilité FishReader"
                return@launch
            }

            // Extraction lourde déportée sur Dispatchers.Default
            val extractionResult = withContext(dispatchers.prosodyCompute) {
                accessibilityService.extractCurrentScreenContent()
            }
            if (extractionResult.sentences.isEmpty()) {
                _statusMessage.value = "Aucun texte pertinent détecté"
                return@launch
            }

            withContext(dispatchers.audioControlSerial) {
                ttsManager.speakSentences(
                    sentences = extractionResult.sentences,
                    languageCode = extractionResult.languageCode
                )
            }
        }
    }

    private fun updateWindowPosition(dx: Float, dy: Float) {
        val bounds = windowManager.currentWindowMetrics.bounds
        windowParams.x = (windowParams.x + dx.roundToInt()).coerceIn(0, bounds.width() - composeView.width)
        windowParams.y = (windowParams.y + dy.roundToInt()).coerceIn(dpToPx(48), bounds.height() - dpToPx(120))
        windowManager.updateViewLayout(composeView, windowParams)
    }

    private fun snapToNearestScreenEdge() {
        val bounds = windowManager.currentWindowMetrics.bounds
        val screenCenterX = bounds.width() / 2
        val viewCenterX = windowParams.x + (composeView.width / 2)

        val targetEdge = if (viewCenterX < screenCenterX) DockEdge.LEFT else DockEdge.RIGHT
        _dockEdge.value = targetEdge

        val targetX = if (targetEdge == DockEdge.LEFT) 0 else bounds.width() - composeView.width

        ValueAnimator.ofInt(windowParams.x, targetX).apply {
            duration = 260L
            interpolator = OvershootInterpolator(1.15f)
            addUpdateListener { animator ->
                windowParams.x = animator.animatedValue as Int
                if (composeView.isAttachedToWindow) {
                    windowManager.updateViewLayout(composeView, windowParams)
                }
            }
            start()
        }
    }

    private fun dpToPx(dp: Int): Int =
        (dp * resources.displayMetrics.density).roundToInt()

    override fun onDestroy() {
        serviceScope.cancel()
        if (::composeView.isInitialized && composeView.isAttachedToWindow) {
            windowManager.removeView(composeView)
        }
        if (::overlayLifecycleOwner.isInitialized) {
            overlayLifecycleOwner.onDestroy()
        }
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}`,
  },
  {
    id: 'fish-accessibility-service',
    filename: 'FishAccessibilityService.kt',
    path: 'app/src/main/java/com/fishreader/app/service/FishAccessibilityService.kt',
    category: 'Extraction UI & OCR Fallback',
    language: 'kotlin',
    summary:
      'Service d’accessibilité parcourant l’arborescence AccessibilityNodeInfo visible à l’écran et basculant automatiquement sur takeScreenshot() + ML Kit OCR v2 si l’UI est verrouillée.',
    keyTakeaways: [
      'Aucun traitement dans onAccessibilityEvent : l’extraction ne s’exécute qu’à la demande explicite de l’utilisateur',
      'Parcours en largeur/profondeur sécurisé avec vérification de isVisibleToUser et géométrie Rect',
      'Bascule transparente vers MlKitOcrFallbackManager lorsque moins de 30 caractères informatifs sont exposés par l’arbre UI',
    ],
    code: `package com.fishreader.app.service

import android.accessibilityservice.AccessibilityService
import android.graphics.Rect
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import com.fishreader.app.data.extraction.RawUiNode
import com.fishreader.app.data.extraction.ScreenExtractionResult
import com.fishreader.app.data.extraction.ScreenTextCleaner
import com.fishreader.app.data.ocr.MlKitOcrFallbackManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.lang.ref.WeakReference

class FishAccessibilityService : AccessibilityService() {

    private val textCleaner = ScreenTextCleaner()
    private lateinit var ocrFallbackManager: MlKitOcrFallbackManager

    companion object {
        private var instanceRef: WeakReference<FishAccessibilityService>? = null
        fun getInstance(): FishAccessibilityService? = instanceRef?.get()
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instanceRef = WeakReference(this)
        ocrFallbackManager = MlKitOcrFallbackManager(this)
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Volontairement vide : 0 % d'impact batterie hors lecture.
    }

    override fun onInterrupt() {}

    suspend fun extractCurrentScreenContent(): ScreenExtractionResult = withContext(Dispatchers.Default) {
        val screenHeight = resources.displayMetrics.heightPixels
        val rootNode: AccessibilityNodeInfo? = rootInActiveWindow

        val rawNodes = mutableListOf<RawUiNode>()
        if (rootNode != null) {
            collectVisibleNodes(rootNode, rawNodes)
        }

        val cleanedFromTree = textCleaner.cleanAndSegmentNodes(
            nodes = rawNodes,
            screenHeightPx = screenHeight
        )

        val totalCharacters = cleanedFromTree.sentences.sumOf { it.length }

        if (totalCharacters >= 30) {
            val lang = textCleaner.detectLanguage(cleanedFromTree.sentences.joinToString(" "))
            return@withContext ScreenExtractionResult(
                sentences = cleanedFromTree.sentences,
                languageCode = lang,
                usedOcrFallback = false,
                acceptedNodeCount = cleanedFromTree.acceptedCount,
                rejectedNodeCount = cleanedFromTree.rejectedCount
            )
        }

        val ocrLines = ocrFallbackManager.captureAndRecognizeText(screenHeight)
        val ocrSentences = textCleaner.segmentAndMergeForNaturalProsody(ocrLines.joinToString(" "))
        val detectedLang = textCleaner.detectLanguage(ocrSentences.joinToString(" "))

        ScreenExtractionResult(
            sentences = ocrSentences,
            languageCode = detectedLang,
            usedOcrFallback = true,
            acceptedNodeCount = ocrLines.size,
            rejectedNodeCount = rawNodes.size
        )
    }

    private fun collectVisibleNodes(
        node: AccessibilityNodeInfo,
        outList: MutableList<RawUiNode>
    ) {
        if (node.packageName?.toString() == packageName) return

        if (node.isVisibleToUser) {
            val rawText = node.text?.toString()?.trim()
                ?: node.contentDescription?.toString()?.trim()

            if (!rawText.isNullOrEmpty()) {
                val rect = Rect()
                node.getBoundsInScreen(rect)
                outList.add(
                    RawUiNode(
                        className = node.className?.toString().orEmpty(),
                        viewIdResourceName = node.viewIdResourceName.orEmpty(),
                        text = rawText,
                        bounds = rect,
                        isClickable = node.isClickable
                    )
                )
            }
        }

        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            collectVisibleNodes(child, outList)
        }
    }

    override fun onDestroy() {
        if (::ocrFallbackManager.isInitialized) {
            ocrFallbackManager.close()
        }
        instanceRef = null
        super.onDestroy()
    }
}`,
  },
  {
    id: 'screen-text-cleaner',
    filename: 'ScreenTextCleaner.kt',
    path: 'app/src/main/java/com/fishreader/app/data/extraction/ScreenTextCleaner.kt',
    category: 'Extraction UI & OCR Fallback',
    language: 'kotlin',
    summary:
      'Moteur heuristique et normaliseur prosodique : élimine les bruits UI, développe les abréviations ("%", "14.2K", "M.") et fusionne les phrases courtes en groupes de souffle naturels (90-180 caractères).',
    keyTakeaways: [
      'Normalisation phonétique avant TTS : transforme les symboles et abréviations en mots complets pour éviter une diction mécanique',
      'Regroupement en groupes de souffle (Breath Groups) : fusionne les phrases trop courtes (< 55 caractères) afin que les modèles VITS Medium/High déploient une courbe d’intonation naturelle',
      'Exclusion géométrique et regex des barres système, compteurs de likes et boutons isolés',
    ],
    code: `package com.fishreader.app.data.extraction

import android.graphics.Rect
import com.google.mlkit.nl.languageid.LanguageIdentification
import com.google.mlkit.nl.languageid.LanguageIdentificationOptions
import kotlinx.coroutines.tasks.await
import java.text.BreakIterator
import java.util.Locale

data class RawUiNode(
    val className: String,
    val viewIdResourceName: String,
    val text: String,
    val bounds: Rect,
    val isClickable: Boolean
)

data class CleanedNodesOutput(
    val sentences: List<String>,
    val acceptedCount: Int,
    val rejectedCount: Int
)

data class ScreenExtractionResult(
    val sentences: List<String>,
    val languageCode: String,
    val usedOcrFallback: Boolean,
    val acceptedNodeCount: Int,
    val rejectedNodeCount: Int
)

class ScreenTextCleaner {

    private val languageIdentifier = LanguageIdentification.getClient(
        LanguageIdentificationOptions.Builder()
            .setConfidenceThreshold(0.45f)
            .build()
    )

    private val ignoredWidgetClasses = setOf(
        "android.widget.Button",
        "android.widget.ImageButton",
        "android.widget.CheckBox",
        "android.widget.Switch",
        "android.widget.SeekBar",
        "android.widget.ProgressBar"
    )

    private val socialMetricRegex = Regex(
        pattern = "^(\\\\d+[.,]?\\\\d*\\\\s*[kKmM]?|\\\\d+\\\\s*(likes?|j'aime|reposts?|partages?|vues?|views?|commentaires?|réponses?))$",
        option = RegexOption.IGNORE_CASE
    )

    private val relativeTimestampRegex = Regex(
        pattern = "^(il y a \\\\d+\\\\s*(min|s|h|j)|\\\\d+[smhdw]|just now|à l'instant|sponsored|sponsorisé|suivre|follow|s'abonner)$",
        option = RegexOption.IGNORE_CASE
    )

    fun cleanAndSegmentNodes(
        nodes: List<RawUiNode>,
        screenHeightPx: Int
    ): CleanedNodesOutput {
        val topStatusBarCutoff = (screenHeightPx * 0.055f).toInt()
        val bottomNavBarCutoff = (screenHeightPx * 0.92f).toInt()

        var accepted = 0
        var rejected = 0
        val validBlocks = mutableListOf<RawUiNode>()
        val seenTexts = mutableSetOf<String>()

        for (node in nodes) {
            val candidate = node.text.trim()

            if (node.bounds.top < topStatusBarCutoff || node.bounds.bottom > bottomNavBarCutoff) {
                rejected++
                continue
            }
            if (candidate.length < 3 || node.className in ignoredWidgetClasses) {
                rejected++
                continue
            }
            if (node.isClickable && candidate.split(" ").size <= 3 && candidate.length < 24) {
                rejected++
                continue
            }
            if (socialMetricRegex.matches(candidate) || relativeTimestampRegex.matches(candidate)) {
                rejected++
                continue
            }

            val normalizedKey = candidate.lowercase(Locale.ROOT)
            if (!seenTexts.add(normalizedKey)) {
                rejected++
                continue
            }

            accepted++
            validBlocks.add(node)
        }

        val sortedBlocks = validBlocks.sortedWith(
            compareBy<RawUiNode> { it.bounds.top / 24 }
                .thenBy { it.bounds.left }
        )

        val combinedText = sortedBlocks.joinToString(separator = " ") { block ->
            val trimmed = block.text.trim()
            if (trimmed.endsWith(".") || trimmed.endsWith("!") || trimmed.endsWith("?") || trimmed.endsWith(":")) {
                trimmed
            } else {
                "\$trimmed,"
            }
        }

        val sentences = segmentAndMergeForNaturalProsody(combinedText)
        return CleanedNodesOutput(
            sentences = sentences,
            acceptedCount = accepted,
            rejectedCount = rejected
        )
    }

    fun segmentAndMergeForNaturalProsody(rawText: String): List<String> {
        if (rawText.isBlank()) return emptyList()
        val normalized = normalizeForNaturalProsody(rawText)

        val iterator = BreakIterator.getSentenceInstance(Locale.getDefault())
        iterator.setText(normalized)

        val rawSentences = mutableListOf<String>()
        var start = iterator.first()
        var end = iterator.next()

        while (end != BreakIterator.DONE) {
            val sentence = normalized.substring(start, end)
                .replace(Regex("\\\\s+"), " ")
                .trim()
            if (sentence.length >= 4) {
                rawSentences.add(sentence)
            }
            start = end
            end = iterator.next()
        }

        val mergedGroups = mutableListOf<String>()
        var accumulator = StringBuilder()

        for (sentence in rawSentences) {
            if (accumulator.isEmpty()) {
                accumulator.append(sentence)
            } else if (accumulator.length < 55 || (accumulator.length + sentence.length) <= 165) {
                accumulator.append(" ").append(sentence)
            } else {
                mergedGroups.add(accumulator.toString())
                accumulator = StringBuilder(sentence)
            }
        }
        if (accumulator.isNotEmpty()) {
            mergedGroups.add(accumulator.toString())
        }

        return mergedGroups
    }

    private fun normalizeForNaturalProsody(input: String): String {
        return input
            .replace(Regex("(\\\\d+)\\\\s*%"), "\$1 pour cent")
            .replace(Regex("\\\\bM\\\\.\\\\s+"), "Monsieur ")
            .replace(Regex("\\\\bMme\\\\.\\\\s+"), "Madame ")
            .replace(Regex("\\\\bms\\\\b"), "millisecondes")
            .replace(Regex("\\\\bMo\\\\b"), "mégaoctets")
            .replace("·", ", ")
            .replace("—", ", ")
            .replace("–", ", ")
            .replace(Regex("\\\\s+"), " ")
            .trim()
    }

    suspend fun detectLanguage(sampleText: String): String {
        if (sampleText.isBlank()) return "fr"
        return try {
            val langTag = languageIdentifier.identifyLanguage(sampleText.take(450)).await()
            when {
                langTag.startsWith("en") -> "en"
                langTag.startsWith("fr") -> "fr"
                else -> "fr"
            }
        } catch (_: Exception) {
            "fr"
        }
    }
}`,
  },
  {
    id: 'mlkit-ocr-fallback',
    filename: 'MlKitOcrFallbackManager.kt',
    path: 'app/src/main/java/com/fishreader/app/data/ocr/MlKitOcrFallbackManager.kt',
    category: 'Extraction UI & OCR Fallback',
    language: 'kotlin',
    summary:
      'Canal secondaire hors ligne utilisant AccessibilityService.takeScreenshot() (Android 11+) et Google ML Kit Text Recognition v2 sans aucune popup système.',
    keyTakeaways: [
      'Utilise takeScreenshot(Display.DEFAULT_DISPLAY, ...) introduit dans Android 11 (API 30) pour éviter le flux intrusif MediaProjection',
      'Convertit le HardwareBuffer GPU en Bitmap logiciel ARGB_8888 puis libère immédiatement le HardwareBuffer',
      'Filtre les blocs reconnus par ML Kit selon les mêmes marges haut/bas que le nettoyeur d’arborescence',
    ],
    code: `package com.fishreader.app.data.ocr

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityService.TakeScreenshotCallback
import android.accessibilityservice.AccessibilityService.ScreenshotResult
import android.graphics.Bitmap
import android.view.Display
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.tasks.await
import java.util.concurrent.Executors
import kotlin.coroutines.resume

class MlKitOcrFallbackManager(
    private val service: AccessibilityService
) {
    private val screenshotExecutor = Executors.newSingleThreadExecutor()
    private val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)

    suspend fun captureAndRecognizeText(screenHeightPx: Int): List<String> {
        val bitmap = takeScreenBitmapSilent() ?: return emptyList()

        return try {
            val inputImage = InputImage.fromBitmap(bitmap, 0)
            val visionText = recognizer.process(inputImage).await()

            val topCutoff = (screenHeightPx * 0.06f).toInt()
            val bottomCutoff = (screenHeightPx * 0.92f).toInt()

            visionText.textBlocks
                .filter { block ->
                    val box = block.boundingBox
                    box != null && box.top >= topCutoff && box.bottom <= bottomCutoff && block.text.length >= 12
                }
                .sortedWith(
                    compareBy({ it.boundingBox?.top ?: 0 }, { it.boundingBox?.left ?: 0 })
                )
                .map { block ->
                    block.lines.joinToString(" ") { it.text.trim() }
                }
        } finally {
            bitmap.recycle()
        }
    }

    private suspend fun takeScreenBitmapSilent(): Bitmap? =
        suspendCancellableCoroutine { continuation ->
            service.takeScreenshot(
                Display.DEFAULT_DISPLAY,
                screenshotExecutor,
                object : TakeScreenshotCallback {
                    override fun onSuccess(screenshot: ScreenshotResult) {
                        val hardwareBuffer = screenshot.hardwareBuffer
                        val colorSpace = screenshot.colorSpace
                        val hwBitmap = Bitmap.wrapHardwareBuffer(hardwareBuffer, colorSpace)
                        val softwareBitmap = hwBitmap?.copy(Bitmap.Config.ARGB_8888, false)
                        hwBitmap?.recycle()
                        hardwareBuffer.close()

                        if (continuation.isActive) {
                            continuation.resume(softwareBitmap)
                        } else {
                            softwareBitmap?.recycle()
                        }
                    }

                    override fun onFailure(errorCode: Int) {
                        if (continuation.isActive) {
                            continuation.resume(null)
                        }
                    }
                }
            )
        }

    fun close() {
        recognizer.close()
        screenshotExecutor.shutdown()
    }
}`,
  },
  {
    id: 'main-activity-onboarding',
    filename: 'MainActivity.kt',
    path: 'app/src/main/java/com/fishreader/app/ui/MainActivity.kt',
    category: 'Service Overlay & Compose',
    language: 'kotlin',
    summary:
      'Interface mobile complète Material 3 de FishReader sur Android : barre d’onglets inférieure (Accueil & Permissions, Voix & Vitesse Prosodique, Banc de Test) avec réglage précis de la vitesse (0.75x à 1.50x), du pitch (-4 à +4 st) et du modèle Piper VITS.',
    keyTakeaways: [
      'Interface mobile ergonomique pensée pour une navigation au pouce avec NavigationBar Material 3',
      'Curseurs interactifs (Slider) pour la vitesse de lecture (0.75x – 1.50x), la hauteur tonale (-4.0 à +4.0 demi-tons) et la respiration aux ponctuations',
      'Sélecteur de modèles vocaux Piper VITS Medium/High (SIWIS Medium, Tom Medium, Lessac High, Cori High) et bouton de test audio immédiat',
    ],
    code: `package com.fishreader.app.ui

import android.content.ComponentName
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.lifecycleScope
import com.fishreader.app.data.tts.SherpaOnnxTtsManager
import com.fishreader.app.data.tts.TtsPlaybackState
import com.fishreader.app.data.tts.VoiceModelProfile
import com.fishreader.app.service.FishAccessibilityService
import com.fishreader.app.service.FishOverlayService
import kotlinx.coroutines.launch

enum class MobileTab(val label: String) {
    HOME("Accueil"),
    VOICE_PROSODY("Voix & Vitesse"),
    TEST_BENCH("Test Audio")
}

class MainActivity : ComponentActivity() {

    private var hasOverlayPermission by mutableStateOf(false)
    private var hasAccessibilityEnabled by mutableStateOf(false)
    private lateinit var ttsManager: SherpaOnnxTtsManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        ttsManager = SherpaOnnxTtsManager.getInstance(applicationContext, lifecycleScope)
        lifecycleScope.launch {
            ttsManager.initializeModels()
        }
        refreshPermissionStates()

        setContent {
            val ttsState by ttsManager.playbackState.collectAsState()
            var selectedTab by remember { mutableStateOf(MobileTab.HOME) }

            Scaffold(
                containerColor = Color(0xFF0B0F17),
                bottomBar = {
                    NavigationBar(
                        containerColor = Color(0xFF111827),
                        tonalElevation = 0.dp
                    ) {
                        MobileTab.entries.forEach { tab ->
                            NavigationBarItem(
                                selected = selectedTab == tab,
                                onClick = { selectedTab = tab },
                                icon = {
                                    Text(
                                        text = when (tab) {
                                            MobileTab.HOME -> "🐟"
                                            MobileTab.VOICE_PROSODY -> "🎚️"
                                            MobileTab.TEST_BENCH -> "🔊"
                                        },
                                        fontSize = 18.sp
                                    )
                                },
                                label = {
                                    Text(
                                        text = tab.label,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Medium
                                    )
                                }
                            )
                        }
                    }
                }
            ) { innerPadding ->
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding)
                        .verticalScroll(rememberScrollState())
                        .padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // En-tête de l'application mobile
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "FishReader",
                                color = Color.White,
                                fontSize = 24.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Synthèse Neuronale 100 % Hors Ligne · 22.05 kHz",
                                color = Color(0xFF38BDF8),
                                fontSize = 12.sp
                            )
                        }
                    }

                    when (selectedTab) {
                        MobileTab.HOME -> HomePermissionsScreen(
                            hasOverlayPermission = hasOverlayPermission,
                            hasAccessibilityEnabled = hasAccessibilityEnabled,
                            onRequestOverlay = {
                                startActivity(
                                    Intent(
                                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                                        Uri.parse("package:\$packageName")
                                    )
                                )
                            },
                            onRequestAccessibility = {
                                startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
                            },
                            onLaunchOverlay = {
                                startForegroundService(
                                    Intent(this@MainActivity, FishOverlayService::class.java)
                                )
                                moveTaskToBack(true)
                            }
                        )

                        MobileTab.VOICE_PROSODY -> VoiceAndSpeedSettingsScreen(
                            ttsState = ttsState,
                            onSelectProfile = { ttsManager.switchVoiceProfile(it) },
                            onUpdateProsody = { rate, pitch, pause ->
                                ttsManager.updateProsodyParameters(
                                    speechRate = rate,
                                    pitchSemitones = pitch,
                                    pauseScale = pause
                                )
                            }
                        )

                        MobileTab.TEST_BENCH -> AudioTestBenchScreen(
                            ttsState = ttsState,
                            onPlaySample = { sampleText, lang ->
                                ttsManager.speakSentences(listOf(sampleText), lang)
                            },
                            onTogglePlayPause = { ttsManager.togglePlayPause() }
                        )
                    }
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        refreshPermissionStates()
    }

    private fun refreshPermissionStates() {
        hasOverlayPermission = Settings.canDrawOverlays(this)
        val expectedComponent = ComponentName(this, FishAccessibilityService::class.java).flattenToString()
        val enabledServices = Settings.Secure.getString(
            contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ).orEmpty()
        hasAccessibilityEnabled = enabledServices.contains(expectedComponent)
    }
}

@Composable
private fun HomePermissionsScreen(
    hasOverlayPermission: Boolean,
    hasAccessibilityEnabled: Boolean,
    onRequestOverlay: () -> Unit,
    onRequestAccessibility: () -> Unit,
    onLaunchOverlay: () -> Unit
) {
    PermissionStepCard(
        title = "1. Superposition d'écran (Bulle Poisson)",
        description = "Permet d'afficher le bouton flottant au-dessus de vos articles et réseaux sociaux.",
        isGranted = hasOverlayPermission,
        onActionClick = onRequestOverlay
    )

    PermissionStepCard(
        title = "2. Service d'Accessibilité FishReader",
        description = "Extrait localement le texte de l'écran actif lors d'un clic sur le poisson. (Sur Android 13+, autorisez d'abord les 'Paramètres restreints' dans Infos sur l'application).",
        isGranted = hasAccessibilityEnabled,
        onActionClick = onRequestAccessibility
    )

    Button(
        onClick = onLaunchOverlay,
        enabled = hasOverlayPermission && hasAccessibilityEnabled,
        modifier = Modifier
            .fillMaxWidth()
            .height(52.dp),
        shape = RoundedCornerShape(14.dp),
        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF06B6D4))
    ) {
        Text(
            text = "Activer la Bulle Flottante FishReader",
            color = Color(0xFF0B0F17),
            fontWeight = FontWeight.Bold,
            fontSize = 14.sp
        )
    }
}

@Composable
private fun VoiceAndSpeedSettingsScreen(
    ttsState: TtsPlaybackState,
    onSelectProfile: (VoiceModelProfile) -> Unit,
    onUpdateProsody: (Float, Float, Float) -> Unit
) {
    val prosody = ttsState.prosody

    // 1. Carte Vitesse de Lecture (Speech Rate Scaling : 0.75x à 1.50x)
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFF111827), RoundedCornerShape(16.dp))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text("Vitesse de lecture", color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
            Text(
                text = String.format("%.2fx", prosody.speechRate),
                color = Color(0xFF38BDF8),
                fontWeight = FontWeight.Bold,
                fontSize = 15.sp
            )
        }

        Slider(
            value = prosody.speechRate,
            onValueChange = { onUpdateProsody(it, prosody.pitchSemitones, prosody.pauseScale) },
            valueRange = 0.75f..1.50f
        )

        // Paliers rapides accessibles au pouce
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            listOf(0.85f, 1.0f, 1.15f, 1.25f, 1.50f).forEach { preset ->
                val active = kotlin.math.abs(prosody.speechRate - preset) < 0.03f
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(10.dp))
                        .background(if (active) Color(0xFF06B6D4) else Color(0xFF1E293B))
                        .clickable { onUpdateProsody(preset, prosody.pitchSemitones, prosody.pauseScale) }
                        .padding(vertical = 8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "\${preset}x",
                        color = if (active) Color(0xFF0B0F17) else Color.White,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        }
    }

    // 2. Carte Ajustement du Pitch (-4.0 à +4.0 demi-tons) & Pauses Respiratoires
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFF111827), RoundedCornerShape(16.dp))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text("Hauteur tonale (Pitch)", color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
            Text(
                text = String.format("%+.1f demi-tons", prosody.pitchSemitones),
                color = Color(0xFF38BDF8),
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp
            )
        }

        Slider(
            value = prosody.pitchSemitones,
            onValueChange = { onUpdateProsody(prosody.speechRate, it, prosody.pauseScale) },
            valueRange = -4.0f..4.0f
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text("Respiration aux ponctuations", color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
            Text(
                text = String.format("%.0f %%", prosody.pauseScale * 100),
                color = Color(0xFF10B981),
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp
            )
        }

        Slider(
            value = prosody.pauseScale,
            onValueChange = { onUpdateProsody(prosody.speechRate, prosody.pitchSemitones, it) },
            valueRange = 0.65f..1.40f
        )
    }

    // 3. Sélecteur de Modèles Piper VITS Medium & High (22.05 kHz)
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFF111827), RoundedCornerShape(16.dp))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Text(
            text = "Modèles Vocaux Haute Fidélité (22.05 kHz)",
            color = Color.White,
            fontWeight = FontWeight.SemiBold,
            fontSize = 15.sp
        )

        VoiceModelProfile.entries.forEach { profile ->
            val selected = ttsState.activeProfile == profile
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(if (selected) Color(0xFF164E63) else Color(0xFF0B0F17))
                    .border(
                        width = 1.dp,
                        color = if (selected) Color(0xFF06B6D4) else Color(0xFF1E293B),
                        shape = RoundedCornerShape(12.dp)
                    )
                    .clickable { onSelectProfile(profile) }
                    .padding(12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(text = profile.displayName, color = Color.White, fontWeight = FontWeight.Medium, fontSize = 13.sp)
                    Text(text = profile.onnxFileName, color = Color(0xFF94A3B8), fontSize = 11.sp)
                }
                Text(
                    text = if (selected) "Actif" else "Choisir",
                    color = if (selected) Color(0xFF38BDF8) else Color(0xFF64748B),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
    }
}

@Composable
private fun AudioTestBenchScreen(
    ttsState: TtsPlaybackState,
    onPlaySample: (String, String) -> Unit,
    onTogglePlayPause: () -> Unit
) {
    val sampleFr = "Bonjour, voici la voix Piper SIWIS Medium à vingt-deux kilohertz : grâce au moteur prosodique, chaque virgule et chaque fin de phrase respirent naturellement."
    val sampleEn = "Welcome to FishReader: high-fidelity local neural synthesis with dynamic speech rate scaling and pitch control."

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFF111827), RoundedCornerShape(16.dp))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("Tester votre configuration vocale", color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
        Text(
            text = "Vitesse : \${String.format("%.2fx", ttsState.prosody.speechRate)} · Pitch : \${String.format("%+.1f st", ttsState.prosody.pitchSemitones)} · Modèle : \${ttsState.activeProfile.displayName}",
            color = Color(0xFF38BDF8),
            fontSize = 12.sp
        )

        Button(
            onClick = { onPlaySample(sampleFr, "fr") },
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF06B6D4))
        ) {
            Text("Écouter l'échantillon Français (SIWIS / Tom)", color = Color(0xFF0B0F17), fontWeight = FontWeight.Bold)
        }

        OutlinedButton(
            onClick = { onPlaySample(sampleEn, "en") },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Écouter l'échantillon Anglais (Lessac High)", color = Color(0xFFE2E8F0))
        }

        if (ttsState.isPlaying) {
            OutlinedButton(
                onClick = onTogglePlayPause,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Mettre en pause", color = Color(0xFFF59E0B))
            }
        }
    }
}

@Composable
private fun PermissionStepCard(
    title: String,
    description: String,
    isGranted: Boolean,
    onActionClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFF111827), RoundedCornerShape(14.dp))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Text(text = title, color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
        Text(text = description, color = Color(0xFF94A3B8), fontSize = 12.sp)
        Text(
            text = if (isGranted) "Statut : Autorisé et prêt" else "Statut : Action requise",
            color = if (isGranted) Color(0xFF10B981) else Color(0xFFF59E0B),
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold
        )
        if (!isGranted) {
            OutlinedButton(onClick = onActionClick) {
                Text(text = "Ouvrir les paramètres Android", color = Color(0xFF38BDF8))
            }
        }
    }
}`,
  },
  {
    id: 'github-actions-apk-workflow',
    filename: 'build-apk.yml (GitHub Actions)',
    path: '.github/workflows/build-apk.yml',
    category: 'Configuration & Manifest',
    language: 'xml',
    summary:
      'Workflow GitHub Actions permettant de compiler automatiquement FishReader-debug.apk dans le cloud (sans installer Android Studio sur votre ordinateur) et de télécharger l’APK directement sur votre téléphone.',
    keyTakeaways: [
      'Télécharge automatiquement sherpa-onnx.aar et les modèles Piper VITS High/Medium (fr_FR-siwis-medium & en_US-lessac-high) lors du build',
      'Compile l’APK Android et publie FishReader-debug.apk dans les Artifacts GitHub téléchargeables en 1 clic depuis votre mobile',
      '100 % gratuit sur n’importe quel dépôt GitHub personnel (aucun compte Google Play Store requis)',
    ],
    code: `name: Build FishReader Android APK

on:
  push:
    branches: [ "main" ]
  workflow_dispatch:

jobs:
  build-android-apk:
    runs-on: ubuntu-latest

    steps:
      - name: 1. Checkout du code source
        uses: actions/checkout@v4

      - name: 2. Configuration de JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: 3. Téléchargement des modèles Piper VITS Medium/High dans assets
        run: |
          mkdir -p app/src/main/assets/models
          # Téléchargement de fr_FR-siwis-medium (22.05 kHz HD)
          curl -L https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-fr_FR-siwis-medium.tar.bz2 | tar xj -C app/src/main/assets/models/
          # Téléchargement de en_US-lessac-high (22.05 kHz Large VITS)
          curl -L https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-en_US-lessac-high.tar.bz2 | tar xj -C app/src/main/assets/models/

      - name: 4. Compilation de FishReader-debug.apk avec Gradle
        run: |
          chmod +x gradlew
          ./gradlew assembleDebug

      - name: 5. Publication de l'APK téléchargeable sur votre téléphone
        uses: actions/upload-artifact@v4
        with:
          name: FishReader-Android-APK
          path: app/build/outputs/apk/debug/app-debug.apk`,
  },
];

export const INTEGRATION_STEPS: IntegrationStep[] = [
  {
    number: '01',
    title:
      'Migration des Assets vers les Modèles Piper VITS Medium & High (22.05 kHz)',
    subtitle: 'Remplacement de amy-low / upmc par siwis-medium & lessac-high',
    details: [
      'Téléchargez les archives officielles Sherpa-ONNX : vits-piper-fr_FR-siwis-medium.tar.bz2 (FR Féminine Studio), vits-piper-fr_FR-tom-medium.tar.bz2 (FR Masculine Grave) et vits-piper-en_US-lessac-high.tar.bz2 (EN Large VITS).',
      'Placez chaque dossier dans app/src/main/assets/models/<nom_du_modele>/ avec son fichier .onnx et son fichier tokens.txt généré pour Sherpa-ONNX.',
      'Dans PiperModelAssetConfig.kt, la constante ASSET_BUNDLE_VERSION = "v2_high_fidelity_vits" supprime automatiquement du téléphone les anciens modèles "low" présents dans context.filesDir lors de la mise à jour.',
      'Vérifiez que androidResources { noCompress += listOf("onnx", "json", "txt", "bin") } figure dans app/build.gradle.kts.',
    ],
    verificationCheck:
      'Les modèles VITS Medium/High tournent à 22 050 Hz avec 192 canaux cachés et éliminent le timbre métallique des modèles 16 kHz.',
  },
  {
    number: '02',
    title:
      'Implémentation du Scaling de Vitesse et du Pitch dans SherpaOnnxTtsManager.kt',
    subtitle: 'Combinaison VITS Length Regulator + AudioTrack PlaybackParams',
    details: [
      'Pour modifier la vitesse (speechRate de 0.75x à 1.50x) sans déformer le timbre (effet "chipmunk"), passez effectiveGenerationSpeed directement à engine.generate(text, sid, speed) : c’est le prédicteur stochastique de durée VITS qui étire ou compresse les phonèmes.',
      'Pour ajuster la hauteur tonale (pitchSemitones de -4 à +4 demi-tons), convertissez les demi-tons en facteur fréquentiel (2^(semitones / 12)) et appliquez-le sur l’AudioTrack via PlaybackParams().setSpeed(1.0f).setPitch(pitchFactor).',
      'Calibrez OfflineTtsVitsModelConfig avec noiseScale = 0.60f et noiseScaleW = 0.72f pour stabiliser les harmoniques vocales.',
    ],
    verificationCheck:
      'Vous pouvez accélérer la lecture à 1.25x tout en abaissant le pitch de -1.0 demi-ton pour une voix grave, posée et 100 % naturelle.',
  },
  {
    number: '03',
    title:
      'Rythme Prosodique par Sous-Clauses & Respirations (ProsodyRhythmEngine.kt)',
    subtitle: 'Pauses calibrées sur la ponctuation et enveloppe cosinus',
    details: [
      'Au lieu de lire une phrase longue d’un seul trait monotone, ProsodyRhythmEngine découpe le texte aux ponctuations internes (, ; : — ? !) en clauses prosodiques.',
      'Chaque ponctuation reçoit une durée de respiration proportionnelle au débit : 135 ms pour une virgule, 210 ms pour deux-points, 330 ms pour un point, 370 ms avec inflexion montante (+0.45 st) pour une question, et 500 ms en fin de paragraphe.',
      'shapeWaveWithProsodicBreath() supprime le silence mort de fin de modèle et applique une rampe cosinus douce (12 ms attaque / 24 ms relâchement).',
    ],
    verificationCheck:
      'Les virgules et fins de paragraphes respirent naturellement comme un lecteur humain.',
  },
  {
    number: '04',
    title:
      'Installation directe sur votre Téléphone SANS Google Play Store (Sideloading)',
    subtitle: 'APK Debug direct + Déblocage des Paramètres Restreints Android 13+',
    details: [
      'Vous n’avez PAS besoin de publier sur le Play Store : générez app-debug.apk via Android Studio (Build > Build APK) ou via le workflow GitHub Actions fourni (build-apk.yml).',
      'Transférez le fichier app-debug.apk sur votre téléphone (câble USB, Google Drive, WhatsApp) et appuyez dessus pour l’installer.',
      'IMPORTANT sur Android 13, 14 et 15 : pour un APK installé hors Play Store, allez dans Paramètres > Applications > FishReader > Menu (⋮ en haut à droite) > "Autoriser les paramètres restreints". Cela déverrouille l’interrupteur du Service d’Accessibilité FishReader.',
    ],
    verificationCheck:
      'La bulle poisson 🐟 apparaît sur l’écran de votre téléphone et lit vos applications en local.',
  },
];
