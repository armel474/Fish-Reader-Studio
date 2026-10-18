'use client';

import React, {useState, useRef} from 'react';
import {
  Sliders,
  Volume2,
  Smartphone,
  CheckCircle2,
  Copy,
  Check,
  Play,
  Square,
  Loader2,
  ShieldAlert,
  QrCode,
  CloudDownload,
  FileDown,
} from 'lucide-react';

interface PiperHighFidelityModel {
  id: string;
  name: string;
  language: 'fr' | 'en';
  qualityTier: 'MEDIUM (22.05 kHz)' | 'HIGH / LARGE VITS (22.05 kHz)';
  onnxFilename: string;
  assetFolderPath: string;
  downloadArchiveName: string;
  sizeMb: string;
  hiddenChannels: number;
  recommendedNoiseScale: number;
  recommendedNoiseScaleW: number;
  recommendedLengthScale: number;
  voiceCharacter: string;
  geminiVoicePreview: 'Kore' | 'Charon' | 'Zephyr' | 'Puck';
}

const PIPER_HF_MODELS: PiperHighFidelityModel[] = [
  {
    id: 'fr-siwis-medium',
    name: 'FR · Piper SIWIS Medium (Recommandé FR)',
    language: 'fr',
    qualityTier: 'MEDIUM (22.05 kHz)',
    onnxFilename: 'fr_FR-siwis-medium.onnx',
    assetFolderPath: 'app/src/main/assets/models/vits-piper-fr_FR-siwis-medium/',
    downloadArchiveName: 'vits-piper-fr_FR-siwis-medium.tar.bz2',
    sizeMb: '63 Mo (28 Mo INT8)',
    hiddenChannels: 192,
    recommendedNoiseScale: 0.6,
    recommendedNoiseScaleW: 0.72,
    recommendedLengthScale: 0.96,
    voiceCharacter:
      'Enregistré en studio acoustique (corpus SIWIS). Diction française éditoriale très fluide, liaisons naturelles et absence totale de grésillement métallique.',
    geminiVoicePreview: 'Kore',
  },
  {
    id: 'fr-tom-medium',
    name: 'FR · Piper Tom Medium (Masculine Grave)',
    language: 'fr',
    qualityTier: 'MEDIUM (22.05 kHz)',
    onnxFilename: 'fr_FR-tom-medium.onnx',
    assetFolderPath: 'app/src/main/assets/models/vits-piper-fr_FR-tom-medium/',
    downloadArchiveName: 'vits-piper-fr_FR-tom-medium.tar.bz2',
    sizeMb: '63 Mo (28 Mo INT8)',
    hiddenChannels: 192,
    recommendedNoiseScale: 0.58,
    recommendedNoiseScaleW: 0.7,
    recommendedLengthScale: 0.98,
    voiceCharacter:
      'Voix masculine posée et chaleureuse, idéale pour l’écoute prolongée d’articles de presse ou de rapports professionnels sans fatigue auditive.',
    geminiVoicePreview: 'Charon',
  },
  {
    id: 'en-lessac-high',
    name: 'EN · Piper Lessac High (Large VITS)',
    language: 'en',
    qualityTier: 'HIGH / LARGE VITS (22.05 kHz)',
    onnxFilename: 'en_US-lessac-high.onnx',
    assetFolderPath: 'app/src/main/assets/models/vits-piper-en_US-lessac-high/',
    downloadArchiveName: 'vits-piper-en_US-lessac-high.tar.bz2',
    sizeMb: '114 Mo (42 Mo INT8)',
    hiddenChannels: 192,
    recommendedNoiseScale: 0.62,
    recommendedNoiseScaleW: 0.74,
    recommendedLengthScale: 0.97,
    voiceCharacter:
      'Architecture VITS Large à 22.05 kHz (au lieu de 16 kHz sur amy-low). Restitue les inflexions de fin de phrase et les respirations avec une fidélité studio.',
    geminiVoicePreview: 'Zephyr',
  },
  {
    id: 'en-cori-high',
    name: 'EN · Piper Cori High (Studio UK)',
    language: 'en',
    qualityTier: 'HIGH / LARGE VITS (22.05 kHz)',
    onnxFilename: 'en_GB-cori-high.onnx',
    assetFolderPath: 'app/src/main/assets/models/vits-piper-en_GB-cori-high/',
    downloadArchiveName: 'vits-piper-en_GB-cori-high.tar.bz2',
    sizeMb: '114 Mo (42 Mo INT8)',
    hiddenChannels: 192,
    recommendedNoiseScale: 0.6,
    recommendedNoiseScaleW: 0.72,
    recommendedLengthScale: 0.96,
    voiceCharacter:
      'Voix britannique haute définition extrêmement articulée, recommandée pour les fils techniques et la documentation en anglais.',
    geminiVoicePreview: 'Puck',
  },
];

export default function ProsodyAndMobileDeploySection() {
  const [selectedModelId, setSelectedModelId] =
    useState<string>('fr-siwis-medium');
  const activeModel =
    PIPER_HF_MODELS.find((m) => m.id === selectedModelId) || PIPER_HF_MODELS[0];

  // Live Prosody & Rhythm Sliders
  const [speechRate, setSpeechRate] = useState<number>(1.05);
  const [pitchSemitones, setPitchSemitones] = useState<number>(-0.5);
  const [pauseScale, setPauseScale] = useState<number>(1.0);
  const [noiseScale, setNoiseScale] = useState<number>(0.6);
  const [noiseScaleW, setNoiseScaleW] = useState<number>(0.72);

  // Web Audio API Preview State
  const [isPreviewPlaying, setIsPreviewPlaying] = useState<boolean>(false);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [copiedConfig, setCopiedConfig] = useState<boolean>(false);
  const [selectedInstallTab, setSelectedInstallTab] = useState<
    'apk-direct' | 'wireless-adb' | 'github-cloud'
  >('apk-direct');

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const pitchFactor = Math.pow(2, pitchSemitones / 12);

  // Punctuation rhythm pauses computed with same formula as ProsodyRhythmEngine.kt
  const commaPauseMs = Math.round(
    (135 * pauseScale) / Math.max(0.8, speechRate)
  );
  const colonPauseMs = Math.round(
    (210 * pauseScale) / Math.max(0.8, speechRate)
  );
  const periodPauseMs = Math.round(
    (330 * pauseScale) / Math.max(0.8, speechRate)
  );
  const paragraphPauseMs = Math.round(
    (500 * pauseScale) / Math.max(0.8, speechRate)
  );

  const stopPreviewAudio = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch {}
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    setIsPreviewPlaying(false);
    setIsSynthesizing(false);
  };

  const handlePlayProsodyPreview = async () => {
    if (isPreviewPlaying) {
      stopPreviewAudio();
      return;
    }

    setIsSynthesizing(true);
    const sampleText =
      activeModel.language === 'fr'
        ? "Voici le nouveau rythme prosodique de FishReader : chaque virgule marque une courte respiration, les deux-points préparent l'explication, et la vitesse ainsi que la hauteur tonale s'ajustent sans aucune distorsion robotique."
        : 'Here is the upgraded prosodic rhythm in FishReader: commas introduce a natural micro-breath, colons pace complex explanations, and both speech rate and pitch adjust smoothly.';

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          text: sampleText,
          language: activeModel.language,
          voiceName: activeModel.geminiVoicePreview,
        }),
      });
      if (!res.ok) throw new Error('Erreur TTS');
      const data = await res.json();
      const audioDataUrl: string | undefined = data?.audioDataUrl;
      if (!audioDataUrl) throw new Error('Audio vide');

      const base64Part = audioDataUrl.split(',')[1];
      const binaryString = window.atob(base64Part);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0));
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      // Apply Speech Rate Scaling & Pitch Semitone Detune via Web Audio API
      source.playbackRate.value = speechRate;
      source.detune.value = pitchSemitones * 100; // 100 cents per semitone

      source.connect(ctx.destination);
      sourceNodeRef.current = source;

      setIsSynthesizing(false);
      setIsPreviewPlaying(true);

      source.onended = () => {
        setIsPreviewPlaying(false);
      };
      source.start(0);
    } catch {
      setIsSynthesizing(false);
      setIsPreviewPlaying(false);
    }
  };

  const generatedKotlinSnippet = `// 1. Chargement du modèle VITS 22.05 kHz via PiperModelAssetConfig.kt :
val ttsConfig = PiperVitsConfigBuilder.buildOfflineTtsConfig(
    extractedPaths = extractor.ensureVoiceProfileExtracted(VoiceModelProfile.${activeModel.id.toUpperCase().replace(/-/g, '_')}),
    espeakDataDirPath = "\${filesDir}/models/espeak-ng-data",
    profile = VoiceModelProfile.${activeModel.id.toUpperCase().replace(/-/g, '_')},
    initialSpeechRate = ${speechRate.toFixed(2)}f // lengthScale = ${(1.0 / speechRate).toFixed(2)}f, noiseScale = ${noiseScale.toFixed(2)}f, noiseScaleW = ${noiseScaleW.toFixed(2)}f
)
val offlineTts = OfflineTts(assetManager = null, config = ttsConfig)

// 2. Scaling Temps Réel Vitesse (0.75x..1.50x) & Pitch (ProsodyRhythmEngine.kt -> SherpaOnnxTtsManager.kt) :
ttsManager.setSpeechRate(${speechRate.toFixed(2)}f)        // Recalibre VITS + applique le ratio delta immédiat sur AudioTrack
ttsManager.setPitchSemitones(${pitchSemitones.toFixed(1)}f) // PlaybackParams.setPitch(${pitchFactor.toFixed(3)}f)
ttsManager.setPauseScale(${pauseScale.toFixed(2)}f)     // Virgule: ${commaPauseMs}ms · Deux-points: ${colonPauseMs}ms · Point: ${periodPauseMs}ms`;

  const handleCopySnippet = async () => {
    try {
      await navigator.clipboard.writeText(generatedKotlinSnippet);
      setCopiedConfig(true);
      window.setTimeout(() => setCopiedConfig(false), 2000);
    } catch {}
  };

  return (
    <div className="space-y-16">
      {/* Part 1: Prosody Rhythm Studio & High-Fidelity Piper Models */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 6 Cols: High-Fidelity Piper VITS Model Selector & Asset Migration */}
        <div className="lg:col-span-6 bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="border-b border-slate-800 pb-4">
            <div className="text-xs font-mono text-cyan-400">
              Mise à niveau des modèles vocaux Sherpa-ONNX
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              Modèles Piper VITS Medium &amp; High (22.05 kHz vs 16 kHz Low)
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Les modèles <code className="font-mono text-rose-300">low</code>{' '}
              ou <code className="font-mono text-rose-300">x_low</code> (16 kHz,
              96 canaux) brident les harmoniques aiguës. Sélectionnez un modèle{' '}
              <code className="font-mono text-emerald-300">medium</code> ou{' '}
              <code className="font-mono text-emerald-300">high</code> à{' '}
              <strong>22 050 Hz (192 canaux latents)</strong> :
            </p>
          </div>

          <div className="space-y-2.5">
            {PIPER_HF_MODELS.map((model) => {
              const selected = model.id === selectedModelId;
              return (
                <button
                  key={model.id}
                  onClick={() => {
                    stopPreviewAudio();
                    setSelectedModelId(model.id);
                    setNoiseScale(model.recommendedNoiseScale);
                    setNoiseScaleW(model.recommendedNoiseScaleW);
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selected
                      ? 'bg-cyan-950/35 border-cyan-500/70 text-white'
                      : 'bg-[#0B0F17] border-slate-800/90 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-white">
                      {model.name}
                    </span>
                    <span className="text-xs font-mono text-cyan-400 tabular-nums">
                      {model.qualityTier} · {model.sizeMb}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    {model.voiceCharacter}
                  </p>
                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
                    <span>Chemin : {model.assetFolderPath}</span>
                    <span className="text-emerald-400">
                      Canaux VITS : {model.hiddenChannels}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Asset Migration Checklist */}
          <div className="bg-[#0B0F17] border border-slate-800/90 rounded-xl p-4 space-y-2">
            <div className="text-xs font-semibold text-white">
              Comment remplacer le modèle dans{' '}
              <code className="font-mono text-cyan-300">
                app/src/main/assets/models/
              </code>{' '}
              :
            </div>
            <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>
                Téléchargez l&apos;archive{' '}
                <code className="font-mono text-cyan-300">
                  {activeModel.downloadArchiveName}
                </code>{' '}
                depuis les releases officielles{' '}
                <span className="font-mono text-slate-200">
                  k2-fsa/sherpa-onnx
                </span>
                .
              </li>
              <li>
                Extrayez{' '}
                <code className="font-mono text-emerald-300">
                  {activeModel.onnxFilename}
                </code>{' '}
                et{' '}
                <code className="font-mono text-emerald-300">tokens.txt</code>{' '}
                dans{' '}
                <code className="font-mono text-slate-200">
                  {activeModel.assetFolderPath}
                </code>
                .
              </li>
              <li>
                Dans{' '}
                <code className="font-mono text-cyan-300">
                  PiperModelAssetConfig.kt
                </code>
                , la constante{' '}
                <code className="font-mono text-amber-300">
                  ASSET_BUNDLE_VERSION = &quot;v2_high_fidelity_vits&quot;
                </code>{' '}
                purgera automatiquement l&apos;ancien dossier{' '}
                <code className="font-mono">filesDir</code> au lancement.
              </li>
            </ol>
          </div>
        </div>

        {/* Right 6 Cols: Interactive Speech Rate, Pitch & Prosody Rhythm Calibrator */}
        <div className="lg:col-span-6 bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="text-xs font-mono text-cyan-400">
                Calibrage Temps Réel · TtsManager &amp; ProsodyRhythmEngine
              </div>
              <h3 className="text-lg font-bold text-white mt-1">
                Vitesse de Lecture, Pitch &amp; Pauses de Ponctuation
              </h3>
            </div>

            <button
              onClick={handlePlayProsodyPreview}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-xs font-semibold text-slate-950 flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              {isSynthesizing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthèse...</span>
                </>
              ) : isPreviewPlaying ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Arrêter l&apos;aperçu</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Écouter ce réglage</span>
                </>
              )}
            </button>
          </div>

          {/* Sliders Grid */}
          <div className="space-y-4">
            {/* 1. Speech Rate Slider */}
            <div className="bg-[#0B0F17] border border-slate-800/90 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">
                  1. Vitesse de lecture (Speech Rate Scaling)
                </span>
                <span className="font-mono font-bold text-cyan-400 tabular-nums">
                  {speechRate.toFixed(2)}x (lengthScale ={' '}
                  {(1 / speechRate).toFixed(2)}f)
                </span>
              </div>
              <input
                type="range"
                min={0.75}
                max={1.5}
                step={0.05}
                value={speechRate}
                onChange={(e) => setSpeechRate( parseFloat(e.target.value) )}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex items-center justify-between gap-1.5 pt-1">
                {[0.85, 1.0, 1.1, 1.25, 1.4].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setSpeechRate(preset)}
                    className={`flex-1 py-1 rounded-md text-[11px] font-mono tabular-nums border transition-colors ${
                      Math.abs(speechRate - preset) < 0.03
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                        : 'bg-[#111827] text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {preset.toFixed(2)}x
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Pitch Semitones Slider */}
            <div className="bg-[#0B0F17] border border-slate-800/90 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">
                  2. Hauteur tonale (Pitch Adjustment · AudioTrack
                  PlaybackParams)
                </span>
                <span className="font-mono font-bold text-cyan-400 tabular-nums">
                  {pitchSemitones >= 0 ? '+' : ''}
                  {pitchSemitones.toFixed(1)} demi-tons (×
                  {pitchFactor.toFixed(3)})
                </span>
              </div>
              <input
                type="range"
                min={-4.0}
                max={4.0}
                step={0.5}
                value={pitchSemitones}
                onChange={(e) => setPitchSemitones(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Astuce : Un léger réglage à{' '}
                <code className="font-mono text-slate-200">-0.5</code> ou{' '}
                <code className="font-mono text-slate-200">-1.0 demi-ton</code>{' '}
                rend la voix plus posée et chaleureuse lorsque vous accélérez la
                vitesse à <code className="font-mono text-slate-200">1.20x</code>
                .
              </p>
            </div>

            {/* 3. Punctuation Pause Scale & VITS Expressiveness */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-[#0B0F17] border border-slate-800/90 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">
                    Respiration ponctuation
                  </span>
                  <span className="font-mono text-emerald-400 tabular-nums">
                    {Math.round(pauseScale * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.65}
                  max={1.4}
                  step={0.05}
                  value={pauseScale}
                  onChange={(e) => setPauseScale(parseFloat(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
                <div className="text-[11px] font-mono text-slate-400 tabular-nums">
                  Virgule: {commaPauseMs}ms · Point: {periodPauseMs}ms
                </div>
              </div>

              <div className="bg-[#0B0F17] border border-slate-800/90 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">
                    Stabilité VITS (noiseScale)
                  </span>
                  <span className="font-mono text-cyan-400 tabular-nums">
                    {noiseScale.toFixed(2)} / {noiseScaleW.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={0.75}
                  step={0.02}
                  value={noiseScale}
                  onChange={(e) => setNoiseScale(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="text-[11px] font-mono text-slate-400">
                  0.60f élimine le timbre métallique
                </div>
              </div>
            </div>
          </div>

          {/* Generated Kotlin Configuration Preview */}
          <div className="bg-[#080B11] border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">
                Code Kotlin généré en direct pour SherpaOnnxTtsManager.kt
              </span>
              <button
                onClick={handleCopySnippet}
                className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-medium text-cyan-300 flex items-center gap-1 transition-colors"
              >
                {copiedConfig ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copié</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copier</span>
                  </>
                )}
              </button>
            </div>
            <pre className="text-[11px] font-mono text-slate-200 overflow-x-auto leading-relaxed">
              {generatedKotlinSnippet}
            </pre>
          </div>
        </div>
      </div>

      {/* Part 2: How to Test on Your Real Android Phone WITHOUT Google Play Store */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1.5 max-w-3xl">
            <div className="text-xs font-mono text-emerald-400">
              Guide Pratique Mobile · Aucun Compte Google Play Store Requis
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Comment installer et tester FishReader directement sur votre
              téléphone Android ?
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              <strong>
                Non, vous n&apos;avez absolument pas besoin de publier
                l&apos;application sur le Play Store !
              </strong>{' '}
              Contrairement à iOS, Android permet d&apos;installer librement une
              application en développement (fichier{' '}
              <code className="font-mono text-cyan-300">app-debug.apk</code>).
              Choisissez la méthode la plus simple pour vous :
            </p>
          </div>

          {/* 3 Installation Mode Selector Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedInstallTab('apk-direct')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                selectedInstallTab === 'apk-direct'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-[#0B0F17] text-slate-300 border border-slate-800 hover:text-white'
              }`}
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>1. Fichier APK Direct</span>
            </button>

            <button
              onClick={() => setSelectedInstallTab('wireless-adb')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                selectedInstallTab === 'wireless-adb'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-[#0B0F17] text-slate-300 border border-slate-800 hover:text-white'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>2. Sans Fil par QR Code</span>
            </button>

            <button
              onClick={() => setSelectedInstallTab('github-cloud')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                selectedInstallTab === 'github-cloud'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-[#0B0F17] text-slate-300 border border-slate-800 hover:text-white'
              }`}
            >
              <CloudDownload className="w-3.5 h-3.5" />
              <span>3. Sans Android Studio (Cloud)</span>
            </button>
          </div>
        </div>

        {/* Selected Method Step-by-Step Content */}
        {selectedInstallTab === 'apk-direct' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-[#0B0F17] border border-slate-800/90 rounded-xl p-5 space-y-2">
              <div className="text-xs font-mono text-cyan-400">Étape 1</div>
              <h4 className="text-base font-semibold text-white">
                Générer le fichier <code className="font-mono">app-debug.apk</code>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Dans Android Studio, cliquez dans le menu supérieur sur{' '}
                <strong>
                  Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)
                </strong>
                . En quelques secondes, une notification apparaît en bas à
                droite : cliquez sur <strong>locate</strong> pour récupérer le
                fichier <code className="font-mono text-cyan-300">app-debug.apk</code>.
              </p>
            </div>

            <div className="bg-[#0B0F17] border border-slate-800/90 rounded-xl p-5 space-y-2">
              <div className="text-xs font-mono text-cyan-400">Étape 2</div>
              <h4 className="text-base font-semibold text-white">
                Envoyer l&apos;APK sur votre téléphone
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Envoyez <code className="font-mono text-cyan-300">app-debug.apk</code>{' '}
                sur votre téléphone via <strong>Google Drive</strong>,{' '}
                <strong>WhatsApp</strong> (message à vous-même),{' '}
                <strong>Telegram</strong> ou par câble USB. Appuyez sur le
                fichier depuis votre téléphone et acceptez{' '}
                <em>« Installer depuis cette source »</em>.
              </p>
            </div>

            <div className="bg-[#0B0F17] border border-amber-500/40 rounded-xl p-5 space-y-2">
              <div className="text-xs font-mono text-amber-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                <span>Étape 3 (Crucial sur Android 13 / 14 / 15)</span>
              </div>
              <h4 className="text-base font-semibold text-white">
                Autoriser les « Paramètres restreints »
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Pour tout APK installé hors Play Store, Android grise par défaut
                le Service d&apos;Accessibilité. Pour le débloquer : allez dans{' '}
                <strong>
                  Paramètres &gt; Applications &gt; FishReader
                </strong>
                , appuyez sur le menu <strong>⋮ (3 points en haut à droite)</strong>{' '}
                puis sur <strong>« Autoriser les paramètres restreints »</strong>.
              </p>
            </div>
          </div>
        )}

        {selectedInstallTab === 'wireless-adb' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-[#0B0F17] border border-slate-800/90 rounded-xl p-5 space-y-2">
              <div className="text-xs font-mono text-cyan-400">Étape 1</div>
              <h4 className="text-base font-semibold text-white">
                Activer le Débogage sans fil sur le mobile
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Sur votre téléphone (connecté au même Wi-Fi que votre PC), allez
                dans{' '}
                <strong>
                  Paramètres &gt; Options pour les développeurs &gt; Débogage
                  sans fil
                </strong>{' '}
                et activez l&apos;interrupteur.
              </p>
            </div>

            <div className="bg-[#0B0F17] border border-slate-800/90 rounded-xl p-5 space-y-2">
              <div className="text-xs font-mono text-cyan-400">Étape 2</div>
              <h4 className="text-base font-semibold text-white">
                Scanner le QR Code dans Android Studio
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Dans Android Studio, ouvrez le menu des appareils en haut à
                droite &gt; <strong>Pair Devices Using Wi-Fi</strong>. Sur votre
                téléphone, touchez{' '}
                <em>« Associer l&apos;appareil avec un code QR »</em> et scannez
                l&apos;écran.
              </p>
            </div>

            <div className="bg-[#0B0F17] border border-slate-800/90 rounded-xl p-5 space-y-2">
              <div className="text-xs font-mono text-cyan-400">Étape 3</div>
              <h4 className="text-base font-semibold text-white">
                Lancer avec le bouton Run (▶)
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Cliquez sur le bouton vert <strong>Run &apos;app&apos; (▶)</strong>{' '}
                dans Android Studio : l&apos;application s&apos;installe et
                s&apos;ouvre directement sur votre téléphone sans même avoir à
                débloquer les paramètres restreints !
              </p>
            </div>
          </div>
        )}

        {selectedInstallTab === 'github-cloud' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-[#0B0F17] border border-slate-800/90 rounded-xl p-5 space-y-2">
              <div className="text-xs font-mono text-cyan-400">Étape 1</div>
              <h4 className="text-base font-semibold text-white">
                Pousser le projet sur un dépôt GitHub gratuit
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Si vous ne souhaitez pas installer Android Studio (plusieurs Go)
                sur votre PC, créez un dépôt GitHub privé et ajoutez le fichier{' '}
                <code className="font-mono text-cyan-300">
                  .github/workflows/build-apk.yml
                </code>{' '}
                inclus dans la section Code ci-dessous.
              </p>
            </div>

            <div className="bg-[#0B0F17] border border-slate-800/90 rounded-xl p-5 space-y-2">
              <div className="text-xs font-mono text-cyan-400">Étape 2</div>
              <h4 className="text-base font-semibold text-white">
                Téléchargement automatique des voix Piper HD
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Le serveur GitHub Actions télécharge automatiquement{' '}
                <code className="font-mono text-emerald-300">
                  fr_FR-siwis-medium
                </code>{' '}
                et{' '}
                <code className="font-mono text-emerald-300">
                  en_US-lessac-high
                </code>
                , puis compile l&apos;APK complet avec Gradle.
              </p>
            </div>

            <div className="bg-[#0B0F17] border border-slate-800/90 rounded-xl p-5 space-y-2">
              <div className="text-xs font-mono text-cyan-400">Étape 3</div>
              <h4 className="text-base font-semibold text-white">
                Télécharger l&apos;APK depuis votre téléphone
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Ouvrez l&apos;onglet <strong>Actions</strong> de votre dépôt
                GitHub directement dans le navigateur Chrome de votre téléphone
                et téléchargez l&apos;artefact{' '}
                <code className="font-mono text-cyan-300">
                  FishReader-Android-APK
                </code>
                .
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
