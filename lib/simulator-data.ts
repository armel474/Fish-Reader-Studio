export interface SimulatedAccessibilityNode {
  id: string;
  className: string;
  viewId: string;
  text: string;
  bounds: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  isClickable: boolean;
  status: 'ACCEPTED' | 'REJECTED';
  reason: string;
  role:
    | 'status_bar'
    | 'toolbar'
    | 'headline'
    | 'paragraph'
    | 'social_metric'
    | 'timestamp'
    | 'button'
    | 'bottom_nav'
    | 'canvas_ocr';
}

export interface SimulatedAndroidApp {
  id: string;
  appName: string;
  packageName: string;
  categoryLabel: string;
  language: 'fr' | 'en';
  voiceModelName: string;
  requiresOcrFallback: boolean;
  extractionLatencyMs: number;
  firstAudioChunkMs: number;
  ramFootprintMb: number;
  nodes: SimulatedAccessibilityNode[];
  extractedSentences: {
    index: number;
    nodeId: string;
    text: string;
    durationSec: number;
  }[];
}

export const SIMULATED_ANDROID_APPS: SimulatedAndroidApp[] = [
  {
    id: 'presse-tech-fr',
    appName: 'Le Quotidien Tech',
    packageName: 'fr.quotidientech.reader',
    categoryLabel: 'Article Long (Arbre UI)',
    language: 'fr',
    voiceModelName: 'Kokoro-82M v1.0 · Voix ff_siwis (24 kHz Studio)',
    requiresOcrFallback: false,
    extractionLatencyMs: 38,
    firstAudioChunkMs: 240,
    ramFootprintMb: 158,
    nodes: [
      {
        id: 'node-status-1',
        className: 'android.widget.TextView',
        viewId: 'com.android.systemui:id/clock',
        text: '09:42 · 5G · 88%',
        bounds: {top: 8, left: 16, width: 328, height: 22},
        isClickable: false,
        status: 'REJECTED',
        reason:
          'Exclu : Situé dans la zone StatusBar supérieure (< 5.5 % hauteur écran)',
        role: 'status_bar',
      },
      {
        id: 'node-toolbar-1',
        className: 'android.widget.Button',
        viewId: 'fr.quotidientech.reader:id/btn_subscribe',
        text: "S'abonner",
        bounds: {top: 44, left: 256, width: 84, height: 30},
        isClickable: true,
        status: 'REJECTED',
        reason: 'Exclu : Classe interactive android.widget.Button courte',
        role: 'toolbar',
      },
      {
        id: 'node-meta-noise',
        className: 'android.widget.TextView',
        viewId: 'fr.quotidientech.reader:id/read_time_badge',
        text: 'Il y a 12 min',
        bounds: {top: 86, left: 20, width: 95, height: 18},
        isClickable: false,
        status: 'REJECTED',
        reason:
          'Exclu : Correspond au motif regex relativeTimestampRegex ("Il y a 12 min")',
        role: 'timestamp',
      },
      {
        id: 'node-headline-1',
        className: 'android.widget.TextView',
        viewId: 'fr.quotidientech.reader:id/article_title',
        text: 'Pourquoi les modèles vocaux ONNX de nouvelle génération offrent enfin une voix humaine fluide sur mobile.',
        bounds: {top: 112, left: 20, width: 320, height: 64},
        isClickable: false,
        status: 'ACCEPTED',
        reason:
          'Retenu : Titre éditorial principal (densité sémantique élevée, non cliquable)',
        role: 'headline',
      },
      {
        id: 'node-para-1',
        className: 'android.widget.TextView',
        viewId: 'fr.quotidientech.reader:id/article_body_p1',
        text: 'Grâce au modèle Kokoro 82M à vingt-quatre kilohertz et au pré-chargement par canal asynchrone dans Sherpa-ONNX, les phrases s’enchaînent avec une respiration naturelle, sans aucune coupure mécanique.',
        bounds: {top: 188, left: 20, width: 320, height: 92},
        isClickable: false,
        status: 'ACCEPTED',
        reason:
          'Retenu : Paragraphe informatif normalisé en groupe de souffle prosodique',
        role: 'paragraph',
      },
      {
        id: 'node-share-btn',
        className: 'android.widget.TextView',
        viewId: 'fr.quotidientech.reader:id/share_counter',
        text: '1.8K partages',
        bounds: {top: 290, left: 20, width: 110, height: 24},
        isClickable: true,
        status: 'REJECTED',
        reason:
          'Exclu : Correspond au motif regex socialMetricRegex ("1.8K partages")',
        role: 'social_metric',
      },
      {
        id: 'node-para-2',
        className: 'android.widget.TextView',
        viewId: 'fr.quotidientech.reader:id/article_body_p2',
        text: "Cette architecture garantit une confidentialité totale : aucun texte affiché à l'écran ne quitte jamais la mémoire vive de votre téléphone, même en mode avion.",
        bounds: {top: 324, left: 20, width: 320, height: 84},
        isClickable: false,
        status: 'ACCEPTED',
        reason: 'Retenu : Paragraphe informatif (groupe de souffle complet)',
        role: 'paragraph',
      },
      {
        id: 'node-para-3',
        className: 'android.widget.TextView',
        viewId: 'fr.quotidientech.reader:id/article_body_p3',
        text: 'Vous profitez ainsi d’une écoute reposante pendant vos déplacements, tout en gardant le contrôle instantané avec le recul de trente secondes.',
        bounds: {top: 418, left: 20, width: 320, height: 64},
        isClickable: false,
        status: 'ACCEPTED',
        reason: 'Retenu : Paragraphe de conclusion fluide',
        role: 'paragraph',
      },
      {
        id: 'node-bottom-nav',
        className: 'android.widget.TextView',
        viewId: 'fr.quotidientech.reader:id/nav_bar',
        text: 'Accueil · Explorer · Favoris · Profil',
        bounds: {top: 525, left: 0, width: 360, height: 42},
        isClickable: true,
        status: 'REJECTED',
        reason:
          'Exclu : Situé dans la zone BottomNavigation (> 92 % hauteur écran)',
        role: 'bottom_nav',
      },
    ],
    extractedSentences: [
      {
        index: 0,
        nodeId: 'node-headline-1',
        text: 'Pourquoi les modèles vocaux ONNX de nouvelle génération offrent enfin une voix humaine fluide sur mobile.',
        durationSec: 5.5,
      },
      {
        index: 1,
        nodeId: 'node-para-1',
        text: 'Grâce au modèle Kokoro 82M à vingt-quatre kilohertz et au pré-chargement par canal asynchrone dans Sherpa-ONNX, les phrases s’enchaînent avec une respiration naturelle, sans aucune coupure mécanique.',
        durationSec: 8.4,
      },
      {
        index: 2,
        nodeId: 'node-para-2',
        text: "Cette architecture garantit une confidentialité totale : aucun texte affiché à l'écran ne quitte jamais la mémoire vive de votre téléphone, même en mode avion.",
        durationSec: 7.2,
      },
      {
        index: 3,
        nodeId: 'node-para-3',
        text: 'Vous profitez ainsi d’une écoute reposante pendant vos déplacements, tout en gardant le contrôle instantané avec le recul de trente secondes.',
        durationSec: 6.5,
      },
    ],
  },
  {
    id: 'social-thread-en',
    appName: 'Pulse Social (X / Thread)',
    packageName: 'com.pulse.social',
    categoryLabel: 'Fil Social EN (Filtrage Bruit)',
    language: 'en',
    voiceModelName: 'Kokoro-82M v1.0 · Voice af_heart (24 kHz Studio)',
    requiresOcrFallback: false,
    extractionLatencyMs: 42,
    firstAudioChunkMs: 215,
    ramFootprintMb: 152,
    nodes: [
      {
        id: 'en-status',
        className: 'android.widget.TextView',
        viewId: 'com.android.systemui:id/clock',
        text: '09:45 · LTE · 100%',
        bounds: {top: 8, left: 16, width: 328, height: 22},
        isClickable: false,
        status: 'REJECTED',
        reason: 'Exclu : Zone StatusBar supérieure (< 5.5 % hauteur écran)',
        role: 'status_bar',
      },
      {
        id: 'en-follow-btn',
        className: 'android.widget.Button',
        viewId: 'com.pulse.social:id/btn_follow',
        text: 'Follow',
        bounds: {top: 48, left: 270, width: 72, height: 28},
        isClickable: true,
        status: 'REJECTED',
        reason: 'Exclu : Bouton court cliquable ("Follow")',
        role: 'button',
      },
      {
        id: 'en-post-1',
        className: 'android.widget.TextView',
        viewId: 'com.pulse.social:id/post_text_1',
        text: 'Switching from older low-bitrate voices to Kokoro 82M and Piper SIWIS transforms mobile screen reading with warm, natural prosody.',
        bounds: {top: 94, left: 20, width: 320, height: 76},
        isClickable: false,
        status: 'ACCEPTED',
        reason: 'Retenu : Post principal informatif',
        role: 'paragraph',
      },
      {
        id: 'en-metrics-1',
        className: 'android.widget.TextView',
        viewId: 'com.pulse.social:id/metrics_row_1',
        text: '14.2K Likes · 842 Reposts',
        bounds: {top: 178, left: 20, width: 200, height: 22},
        isClickable: true,
        status: 'REJECTED',
        reason: 'Exclu : Compteurs d’engagement filtrés par socialMetricRegex',
        role: 'social_metric',
      },
      {
        id: 'en-post-2',
        className: 'android.widget.TextView',
        viewId: 'com.pulse.social:id/post_text_2',
        text: 'With a producer-consumer coroutine channel, the next sentence is synthesized in the background while the current one plays, eliminating awkward pauses.',
        bounds: {top: 216, left: 20, width: 320, height: 84},
        isClickable: false,
        status: 'ACCEPTED',
        reason: 'Retenu : Deuxième post du fil',
        role: 'paragraph',
      },
      {
        id: 'en-timestamp-2',
        className: 'android.widget.TextView',
        viewId: 'com.pulse.social:id/time_2',
        text: '4m ago · Sponsored',
        bounds: {top: 308, left: 20, width: 140, height: 20},
        isClickable: false,
        status: 'REJECTED',
        reason: 'Exclu : Horodatage court et mention promotionnelle',
        role: 'timestamp',
      },
      {
        id: 'en-post-3',
        className: 'android.widget.TextView',
        viewId: 'com.pulse.social:id/post_text_3',
        text: 'AccessibilityNodeInfo tree filtering automatically strips out like counters, navigation tabs, and noisy action buttons before synthesis.',
        bounds: {top: 340, left: 20, width: 320, height: 82},
        isClickable: false,
        status: 'ACCEPTED',
        reason: 'Retenu : Troisième post du fil',
        role: 'paragraph',
      },
    ],
    extractedSentences: [
      {
        index: 0,
        nodeId: 'en-post-1',
        text: 'Switching from older low-bitrate voices to Kokoro 82M and Piper SIWIS transforms mobile screen reading with warm, natural prosody.',
        durationSec: 6.2,
      },
      {
        index: 1,
        nodeId: 'en-post-2',
        text: 'With a producer-consumer coroutine channel, the next sentence is synthesized in the background while the current one plays, eliminating awkward pauses.',
        durationSec: 7.0,
      },
      {
        index: 2,
        nodeId: 'en-post-3',
        text: 'AccessibilityNodeInfo tree filtering automatically strips out like counters, navigation tabs, and noisy action buttons before synthesis.',
        durationSec: 6.4,
      },
    ],
  },
  {
    id: 'canvas-pdf-ocr-fr',
    appName: 'SecureCanvas PDF Viewer',
    packageName: 'com.enterprise.canvaspdf',
    categoryLabel: 'Canvas Verrouillé (Fallback OCR ML Kit)',
    language: 'fr',
    voiceModelName: 'Piper SIWIS Medium · fr_FR-siwis-medium (22.05 kHz)',
    requiresOcrFallback: true,
    extractionLatencyMs: 265,
    firstAudioChunkMs: 360,
    ramFootprintMb: 176,
    nodes: [
      {
        id: 'ocr-status',
        className: 'android.widget.TextView',
        viewId: 'com.android.systemui:id/clock',
        text: '09:48 · Mode Hors Ligne',
        bounds: {top: 8, left: 16, width: 328, height: 22},
        isClickable: false,
        status: 'REJECTED',
        reason: 'Exclu : Zone StatusBar supérieure',
        role: 'status_bar',
      },
      {
        id: 'ocr-empty-canvas',
        className: 'android.view.View',
        viewId: 'com.enterprise.canvaspdf:id/opengl_surface_view',
        text: '[Surface OpenGL / Canvas sans nœuds AccessibilityNodeInfo]',
        bounds: {top: 46, left: 16, width: 328, height: 70},
        isClickable: false,
        status: 'REJECTED',
        reason:
          'Arbre UI muet (0 caractère exposé) -> Déclenchement automatique de takeScreenshot() + ML Kit OCR v2',
        role: 'toolbar',
      },
      {
        id: 'ocr-block-1',
        className: 'com.google.mlkit.vision.text.Text$TextBlock',
        viewId: 'mlkit:ocr_block_01',
        text: 'Synthèse Architecture Mobile : Le service FishReader détecte automatiquement les vues Canvas muettes et regroupe les lignes reconnues en phrases fluides.',
        bounds: {top: 132, left: 20, width: 320, height: 82},
        isClickable: false,
        status: 'ACCEPTED',
        reason:
          'Reconnu par ML Kit OCR v2 hors ligne via AccessibilityService.takeScreenshot() (confiance 0.98)',
        role: 'canvas_ocr',
      },
      {
        id: 'ocr-block-2',
        className: 'com.google.mlkit.vision.text.Text$TextBlock',
        viewId: 'mlkit:ocr_block_02',
        text: "Sous Android 11 et versions ultérieures, la capture du HardwareBuffer s'effectue silencieusement en mémoire sans boîte de dialogue MediaProjection.",
        bounds: {top: 228, left: 20, width: 320, height: 96},
        isClickable: false,
        status: 'ACCEPTED',
        reason:
          'Reconnu par ML Kit OCR v2 hors ligne (confiance 0.97, trié par boundingBox.top)',
        role: 'canvas_ocr',
      },
      {
        id: 'ocr-block-3',
        className: 'com.google.mlkit.vision.text.Text$TextBlock',
        viewId: 'mlkit:ocr_block_03',
        text: 'Le bitmap temporaire est immédiatement recyclé après reconnaissance pour maintenir la consommation mémoire sous deux cents mégaoctets.',
        bounds: {top: 338, left: 20, width: 320, height: 90},
        isClickable: false,
        status: 'ACCEPTED',
        reason: 'Reconnu par ML Kit OCR v2 hors ligne (confiance 0.99)',
        role: 'canvas_ocr',
      },
    ],
    extractedSentences: [
      {
        index: 0,
        nodeId: 'ocr-block-1',
        text: 'Synthèse Architecture Mobile : Le service FishReader détecte automatiquement les vues Canvas muettes et regroupe les lignes reconnues en phrases fluides.',
        durationSec: 6.5,
      },
      {
        index: 1,
        nodeId: 'ocr-block-2',
        text: "Sous Android 11 et versions ultérieures, la capture du HardwareBuffer s'effectue silencieusement en mémoire sans boîte de dialogue MediaProjection.",
        durationSec: 7.2,
      },
      {
        index: 2,
        nodeId: 'ocr-block-3',
        text: 'Le bitmap temporaire est immédiatement recyclé après reconnaissance pour maintenir la consommation mémoire sous deux cents mégaoctets.',
        durationSec: 6.8,
      },
    ],
  },
];
