'use client';

import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Eye,
  Volume2,
  VolumeX,
  Minimize2,
  CheckCircle2,
  XCircle,
  ScanText,
  Layers,
  Cpu,
  Smartphone,
  Sparkles,
  Loader2,
  Sliders,
  Settings,
} from 'lucide-react';
import {
  SIMULATED_ANDROID_APPS,
  SimulatedAndroidApp,
  SimulatedAccessibilityNode,
} from '@/lib/simulator-data';

interface NeuralVoicePreset {
  id: string;
  label: string;
  androidEquivalent: string;
  geminiVoiceName: 'Kore' | 'Zephyr' | 'Charon' | 'Puck';
  sampleRateLabel: string;
}

const NEURAL_VOICE_PRESETS: NeuralVoicePreset[] = [
  {
    id: 'piper-siwis-medium',
    label: 'FR · Piper SIWIS Medium (Féminine Studio)',
    androidEquivalent: 'fr_FR-siwis-medium.onnx (22.05 kHz · 192 ch)',
    geminiVoiceName: 'Kore',
    sampleRateLabel: '22.05 kHz HD',
  },
  {
    id: 'piper-tom-medium',
    label: 'FR · Piper Tom Medium (Masculine Grave)',
    androidEquivalent: 'fr_FR-tom-medium.onnx (22.05 kHz · 192 ch)',
    geminiVoiceName: 'Charon',
    sampleRateLabel: '22.05 kHz HD',
  },
  {
    id: 'piper-lessac-high',
    label: 'EN · Piper Lessac High (Large VITS US)',
    androidEquivalent: 'en_US-lessac-high.onnx (22.05 kHz · Large VITS)',
    geminiVoiceName: 'Zephyr',
    sampleRateLabel: '22.05 kHz High',
  },
  {
    id: 'piper-cori-high',
    label: 'EN · Piper Cori High (Studio UK)',
    androidEquivalent: 'en_GB-cori-high.onnx (22.05 kHz · Large VITS)',
    geminiVoiceName: 'Puck',
    sampleRateLabel: '22.05 kHz High',
  },
];

type PhoneScreenMode = 'OVERLAY_ON_APPS' | 'FISHREADER_MOBILE_APP';
type MobileAppTab = 'HOME' | 'VOICE_SPEED' | 'TEST_BENCH';

export default function AndroidOverlaySimulator() {
  const [phoneScreenMode, setPhoneScreenMode] =
    useState<PhoneScreenMode>('OVERLAY_ON_APPS');
  const [mobileAppTab, setMobileAppTab] = useState<MobileAppTab>('VOICE_SPEED');
  const [simOverlayGranted, setSimOverlayGranted] = useState<boolean>(true);
  const [simAccessibilityGranted, setSimAccessibilityGranted] =
    useState<boolean>(true);

  const [selectedAppId, setSelectedAppId] = useState<string>(
    SIMULATED_ANDROID_APPS[0].id
  );
  const currentApp: SimulatedAndroidApp =
    SIMULATED_ANDROID_APPS.find((a) => a.id === selectedAppId) ||
    SIMULATED_ANDROID_APPS[0];

  // Voice Model Selection
  const [selectedVoicePresetId, setSelectedVoicePresetId] = useState<string>(
    NEURAL_VOICE_PRESETS[0].id
  );
  const currentVoicePreset =
    NEURAL_VOICE_PRESETS.find((v) => v.id === selectedVoicePresetId) ||
    NEURAL_VOICE_PRESETS[0];

  // Overlay Floating Widget State
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [dockEdge, setDockEdge] = useState<'LEFT' | 'RIGHT'>('RIGHT');
  const [bubbleY, setBubbleY] = useState<number>(175);
  const [dragOffset, setDragOffset] = useState<{x: number; y: number} | null>(
    null
  );

  // Inspection, Speed, Pitch & Prosody State
  const [xrayMode, setXrayMode] = useState<boolean>(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string>(
    SIMULATED_ANDROID_APPS[0].nodes[3].id
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isSynthesizingNeural, setIsSynthesizingNeural] =
    useState<boolean>(false);
  const [prefetchedIndices, setPrefetchedIndices] = useState<number[]>([]);
  const [currentSentenceIdx, setCurrentSentenceIdx] = useState<number>(0);

  // Speech Rate (0.75x - 1.50x) & Pitch (-4.0 to +4.0 semitones) & Pause Scale
  const [speechSpeed, setSpeechSpeed] = useState<number>(1.0);
  const [pitchSemitones, setPitchSemitones] = useState<number>(0.0);
  const [pauseScale, setPauseScale] = useState<number>(1.0);
  const [lastDispatchMicros, setLastDispatchMicros] = useState<number>(38);

  const speechSpeedRef = useRef<number>(1.0);
  const pitchSemitonesRef = useRef<number>(0.0);
  const pauseScaleRef = useRef<number>(1.0);

  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [ttsEngineStatus, setTtsEngineStatus] = useState<string>(
    'Prêt · Main.immediate (UI) + Default.limitedParallelism(1) (Audio)'
  );

  const phoneContainerRef = useRef<HTMLDivElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeSourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const pauseTimeoutRef = useRef<number | null>(null);
  const audioCacheRef = useRef<Map<string, string>>(new Map());
  const decodedBufferCacheRef = useRef<Map<string, AudioBuffer>>(new Map());
  const inFlightRequestsRef = useRef<Map<string, Promise<string | null>>>(
    new Map()
  );
  const activePlaybackTokenRef = useRef<number>(0);

  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    startY: number;
    startX: number;
    moved: boolean;
  } | null>(null);

  /**
   * Non-blocking Speech Rate Preset switcher (simulates OverlayInteractionController.onSelectSpeechRatePreset):
   * - Updates optimistic UI state immediately on Main.immediate
   * - Schedules smooth exponential AudioParam ramp on AudioContext without recreating playback callbacks
   */
  const handleSelectSpeedPreset = useCallback((newRate: number) => {
    const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
    const clamped = Math.max(0.75, Math.min(1.5, Number(newRate.toFixed(2))));
    speechSpeedRef.current = clamped;
    setSpeechSpeed(clamped);

    queueMicrotask(() => {
      const source = activeSourceNodeRef.current;
      const ctx = audioCtxRef.current;
      if (source && ctx) {
        try {
          source.playbackRate.setTargetAtTime(clamped, ctx.currentTime, 0.012);
        } catch {
          source.playbackRate.value = clamped;
        }
      }
      const elapsedUs =
        typeof performance !== 'undefined'
          ? Math.max(18, Math.round((performance.now() - t0) * 1000))
          : 35;
      setLastDispatchMicros(elapsedUs);
    });
  }, []);

  const handleSelectPitchSemitones = useCallback((newSemitones: number) => {
    const clamped = Math.max(-4.0, Math.min(4.0, newSemitones));
    pitchSemitonesRef.current = clamped;
    setPitchSemitones(clamped);

    queueMicrotask(() => {
      const source = activeSourceNodeRef.current;
      const ctx = audioCtxRef.current;
      if (source && ctx) {
        try {
          source.detune.setTargetAtTime(clamped * 100, ctx.currentTime, 0.012);
        } catch {
          source.detune.value = clamped * 100;
        }
      }
    });
  }, []);

  const getCacheKey = useCallback(
    (appId: string, sentenceIdx: number, voiceName: string) =>
      `${appId}::${sentenceIdx}::${voiceName}`,
    []
  );

  const stopAllAudio = useCallback(() => {
    activePlaybackTokenRef.current += 1;
    if (pauseTimeoutRef.current !== null) {
      window.clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
    if (activeSourceNodeRef.current) {
      try {
        activeSourceNodeRef.current.onended = null;
        activeSourceNodeRef.current.stop();
      } catch {}
      activeSourceNodeRef.current.disconnect();
      activeSourceNodeRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSynthesizingNeural(false);
  }, []);

  const fetchOrGetCachedSentenceAudio = useCallback(
    async (
      app: SimulatedAndroidApp,
      sentenceIdx: number,
      voiceName: string
    ): Promise<string | null> => {
      const sentenceObj = app.extractedSentences[sentenceIdx];
      if (!sentenceObj) return null;

      const key = getCacheKey(app.id, sentenceIdx, voiceName);
      const cached = audioCacheRef.current.get(key);
      if (cached) {
        setPrefetchedIndices((prev) =>
          prev.includes(sentenceIdx) ? prev : [...prev, sentenceIdx]
        );
        return cached;
      }

      const existingPromise = inFlightRequestsRef.current.get(key);
      if (existingPromise) {
        return existingPromise;
      }

      const requestPromise = (async () => {
        try {
          const res = await fetch('/api/tts', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              text: sentenceObj.text,
              language: app.language,
              voiceName,
            }),
          });
          if (!res.ok) return null;
          const data = await res.json();
          if (data?.audioDataUrl) {
            audioCacheRef.current.set(key, data.audioDataUrl);
            setPrefetchedIndices((prev) =>
              prev.includes(sentenceIdx) ? prev : [...prev, sentenceIdx]
            );
            return data.audioDataUrl as string;
          }
          return null;
        } catch {
          return null;
        } finally {
          inFlightRequestsRef.current.delete(key);
        }
      })();

      inFlightRequestsRef.current.set(key, requestPromise);
      return requestPromise;
    },
    [getCacheKey]
  );

  /**
   * Plays sentence `startIndex` using Web Audio API with real-time Speech Rate (`playbackRate`)
   * and Pitch Semitones (`detune`), stabilized via refs so switching presets never recreates this callback.
   */
  const playSentenceAt = useCallback(
    async (startIndex: number) => {
      const sentenceObj = currentApp.extractedSentences[startIndex];
      if (!sentenceObj) {
        setIsPlaying(false);
        setTtsEngineStatus('Lecture terminée');
        return;
      }

      stopAllAudio();
      const myToken = activePlaybackTokenRef.current;

      setIsPlaying(true);
      setCurrentSentenceIdx(startIndex);
      setSelectedNodeId(sentenceObj.nodeId);

      const liveSpeed = speechSpeedRef.current;
      const livePitch = pitchSemitonesRef.current;

      // Lookahead Producer: prefetch next 2 sentences immediately in background
      const voiceName = currentVoicePreset.geminiVoiceName;
      if (startIndex + 1 < currentApp.extractedSentences.length) {
        void fetchOrGetCachedSentenceAudio(
          currentApp,
          startIndex + 1,
          voiceName
        );
      }
      if (startIndex + 2 < currentApp.extractedSentences.length) {
        void fetchOrGetCachedSentenceAudio(
          currentApp,
          startIndex + 2,
          voiceName
        );
      }

      if (!audioEnabled) {
        setTtsEngineStatus('Mode muet (simulation visuelle active)');
        pauseTimeoutRef.current = window.setTimeout(() => {
          if (activePlaybackTokenRef.current !== myToken) return;
          if (startIndex + 1 < currentApp.extractedSentences.length) {
            void playSentenceAt(startIndex + 1);
          } else {
            setIsPlaying(false);
          }
        }, (sentenceObj.durationSec * 1000) / speechSpeedRef.current);
        return;
      }

      setIsSynthesizingNeural(true);
      setTtsEngineStatus(
        `Synthèse VITS (${currentVoicePreset.label.split(' · ')[1]}) · ${liveSpeed.toFixed(2)}x...`
      );

      const audioDataUrl = await fetchOrGetCachedSentenceAudio(
        currentApp,
        startIndex,
        voiceName
      );

      if (activePlaybackTokenRef.current !== myToken) return;
      setIsSynthesizingNeural(false);

      if (audioDataUrl) {
        setTtsEngineStatus(
          `Lecture ${speechSpeedRef.current.toFixed(2)}x · Pitch ${livePitch >= 0 ? '+' : ''}${livePitch.toFixed(1)} st · Phrase ${startIndex + 1}/${currentApp.extractedSentences.length}`
        );

        try {
          if (!audioCtxRef.current) {
            audioCtxRef.current = new AudioContext();
          }
          const ctx = audioCtxRef.current;
          if (ctx.state === 'suspended') {
            await ctx.resume();
          }

          const cacheKey = getCacheKey(currentApp.id, startIndex, voiceName);
          let audioBuffer = decodedBufferCacheRef.current.get(cacheKey);

          if (!audioBuffer) {
            const base64Part = audioDataUrl.split(',')[1];
            const binaryString = window.atob(base64Part);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0));
            decodedBufferCacheRef.current.set(cacheKey, audioBuffer);
          }

          if (activePlaybackTokenRef.current !== myToken) return;

          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;
          source.playbackRate.value = speechSpeedRef.current;
          source.detune.value = pitchSemitonesRef.current * 100;
          source.connect(ctx.destination);
          activeSourceNodeRef.current = source;

          source.onended = () => {
            if (activePlaybackTokenRef.current !== myToken) return;
            const nextIdx = startIndex + 1;
            if (nextIdx < currentApp.extractedSentences.length) {
              // Read latest pauseScale & speechSpeed dynamically at sentence boundary
              const dynamicPauseMs = Math.round(
                (330 * pauseScaleRef.current) /
                  Math.max(0.8, speechSpeedRef.current)
              );
              pauseTimeoutRef.current = window.setTimeout(() => {
                if (activePlaybackTokenRef.current !== myToken) return;
                void playSentenceAt(nextIdx);
              }, dynamicPauseMs);
            } else {
              setIsPlaying(false);
              setTtsEngineStatus('Lecture terminée');
            }
          };

          source.start(0);
          return;
        } catch {
          // Fall through if Web Audio decode fails
        }
      }

      // Fallback Web Speech API
      setTtsEngineStatus('Fallback synthèse locale du navigateur');
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(sentenceObj.text);
        utterance.lang = currentApp.language === 'fr' ? 'fr-FR' : 'en-US';
        utterance.rate = speechSpeedRef.current;
        utterance.pitch = Math.max(
          0.5,
          Math.min(1.5, 1.0 + pitchSemitonesRef.current * 0.08)
        );
        utterance.onend = () => {
          if (activePlaybackTokenRef.current !== myToken) return;
          const nextIdx = startIndex + 1;
          if (nextIdx < currentApp.extractedSentences.length) {
            void playSentenceAt(nextIdx);
          } else {
            setIsPlaying(false);
          }
        };
        window.speechSynthesis.speak(utterance);
      }
    },
    [
      currentApp,
      currentVoicePreset,
      audioEnabled,
      fetchOrGetCachedSentenceAudio,
      getCacheKey,
      stopAllAudio,
    ]
  );

  // Warm up sentence 0 in background when app or voice changes
  useEffect(() => {
    setPrefetchedIndices([]);
    void fetchOrGetCachedSentenceAudio(
      currentApp,
      0,
      currentVoicePreset.geminiVoiceName
    );
  }, [currentApp, currentVoicePreset, fetchOrGetCachedSentenceAudio]);

  // Elapsed timer counter
  useEffect(() => {
    if (!isPlaying) return;
    const interval = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    return () => stopAllAudio();
  }, [stopAllAudio]);

  const handleSelectApp = (appId: string) => {
    stopAllAudio();
    setPhoneScreenMode('OVERLAY_ON_APPS');
    setSelectedAppId(appId);
    setIsPlaying(false);
    setCurrentSentenceIdx(0);
    setElapsedSeconds(0);
    const nextApp = SIMULATED_ANDROID_APPS.find((a) => a.id === appId);
    if (nextApp && nextApp.nodes.length > 0) {
      const firstAccepted =
        nextApp.nodes.find((n) => n.status === 'ACCEPTED') || nextApp.nodes[0];
      setSelectedNodeId(firstAccepted.id);
    }
  };

  const handleBubbleClick = () => {
    setIsExpanded(true);
    if (!isPlaying) {
      void playSentenceAt(currentSentenceIdx);
    }
  };

  const handleTogglePlayPause = () => {
    if (isPlaying) {
      stopAllAudio();
      setIsPlaying(false);
      setTtsEngineStatus('En pause (tampon AudioTrack maintenu)');
    } else {
      const restartIdx =
        currentSentenceIdx >= currentApp.extractedSentences.length
          ? 0
          : currentSentenceIdx;
      void playSentenceAt(restartIdx);
    }
  };

  const handleRewind30s = () => {
    const targetIdx = Math.max(0, currentSentenceIdx - 2);
    setElapsedSeconds((prev) => Math.max(0, prev - 30));
    if (isPlaying) {
      void playSentenceAt(targetIdx);
    } else {
      setCurrentSentenceIdx(targetIdx);
      const sentenceObj = currentApp.extractedSentences[targetIdx];
      if (sentenceObj) setSelectedNodeId(sentenceObj.nodeId);
    }
  };

  const handleSkipNextSentence = () => {
    const nextIdx =
      (currentSentenceIdx + 1) % currentApp.extractedSentences.length;
    if (isPlaying) {
      void playSentenceAt(nextIdx);
    } else {
      setCurrentSentenceIdx(nextIdx);
      const sentenceObj = currentApp.extractedSentences[nextIdx];
      if (sentenceObj) setSelectedNodeId(sentenceObj.nodeId);
    }
  };

  // Pointer drag mechanics for magnetic edge docking on the 360x580 phone canvas
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const startX = dockEdge === 'RIGHT' ? 302 : 4;
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startY: bubbleY,
      startX,
      moved: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.clientX;
    const dy = e.clientY - dragStartRef.current.clientY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      dragStartRef.current.moved = true;
    }
    const clampedX = Math.max(
      4,
      Math.min(302, dragStartRef.current.startX + dx)
    );
    const clampedY = Math.max(
      46,
      Math.min(480, dragStartRef.current.startY + dy)
    );
    setDragOffset({x: clampedX, y: clampedY});
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;
    const wasMoved = dragStartRef.current.moved;
    if (dragOffset) {
      const targetEdge = dragOffset.x + 27 < 180 ? 'LEFT' : 'RIGHT';
      setDockEdge(targetEdge);
      setBubbleY(dragOffset.y);
    }
    setDragOffset(null);
    dragStartRef.current = null;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);

    if (!wasMoved && !isExpanded) {
      handleBubbleClick();
    }
  };

  const selectedNode: SimulatedAccessibilityNode =
    currentApp.nodes.find((n) => n.id === selectedNodeId) || currentApp.nodes[0];

  const activeSentenceObj = currentApp.extractedSentences[currentSentenceIdx];
  const acceptedCount = currentApp.nodes.filter(
    (n) => n.status === 'ACCEPTED'
  ).length;
  const rejectedCount = currentApp.nodes.filter(
    (n) => n.status === 'REJECTED'
  ).length;

  const computedBubbleX = dragOffset
    ? dragOffset.x
    : dockEdge === 'RIGHT'
      ? 302
      : 4;
  const computedBubbleY = dragOffset ? dragOffset.y : bubbleY;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column (5 cols on lg): Interactive Android Device Viewport */}
      <div className="lg:col-span-5 flex flex-col items-center">
        {/* Phone Mode Switcher: App Mobile FishReader vs Overlay sur Apps */}
        <div className="w-full mb-3 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Mode de l&apos;appareil Android simulé</span>
            <span className="font-mono tabular-nums text-cyan-400">
              Vitesse : {speechSpeed.toFixed(2)}x · Pitch :{' '}
              {pitchSemitones >= 0 ? '+' : ''}
              {pitchSemitones.toFixed(1)}st
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#111827] border border-slate-800 rounded-xl">
            <button
              onClick={() => setPhoneScreenMode('OVERLAY_ON_APPS')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                phoneScreenMode === 'OVERLAY_ON_APPS'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>🐟 Bulle Overlay Active</span>
            </button>
            <button
              onClick={() => setPhoneScreenMode('FISHREADER_MOBILE_APP')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                phoneScreenMode === 'FISHREADER_MOBILE_APP'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>App Mobile FishReader</span>
            </button>
          </div>

          {/* Underlying App Selector when in Overlay Mode */}
          {phoneScreenMode === 'OVERLAY_ON_APPS' && (
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#111827] border border-slate-800 rounded-xl">
              {SIMULATED_ANDROID_APPS.map((app) => {
                const active = app.id === selectedAppId;
                return (
                  <button
                    key={app.id}
                    onClick={() => handleSelectApp(app.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left truncate whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-slate-800 text-cyan-300 font-semibold border border-cyan-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {app.appName}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Simulated Android Smartphone Frame */}
        <div
          ref={phoneContainerRef}
          className="relative w-[360px] h-[580px] rounded-[34px] bg-[#0F172A] border-2 border-slate-700/90 shadow-2xl overflow-hidden select-none"
        >
          {phoneScreenMode === 'FISHREADER_MOBILE_APP' ? (
            /* MODE 2 : Interface Mobile Native Material 3 de FishReader (MainActivity.kt) */
            <div className="absolute inset-0 bg-[#0B0F17] flex flex-col justify-between">
              {/* Mobile Top App Bar */}
              <div className="px-4 pt-4 pb-3 border-b border-slate-800 flex items-center justify-between bg-[#111827]/90">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🐟</span>
                  <div>
                    <div className="text-sm font-bold text-white leading-tight">
                      FishReader Android
                    </div>
                    <div className="text-[10px] font-mono text-cyan-400">
                      {currentVoicePreset.label.split(' · ')[1]} · 22.05 kHz
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setPhoneScreenMode('OVERLAY_ON_APPS')}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500 text-slate-950 text-[11px] font-bold"
                >
                  Voir Overlay
                </button>
              </div>

              {/* Scrollable Mobile App Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                {mobileAppTab === 'HOME' && (
                  <>
                    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">
                          1. Superposition d&apos;écran (Overlay)
                        </span>
                        <span
                          className={`text-[11px] font-mono font-semibold ${
                            simOverlayGranted
                              ? 'text-emerald-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {simOverlayGranted ? 'Autorisé' : 'Requis'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Affiche la bulle poisson flottante par-dessus vos
                        applications.
                      </p>
                      <button
                        onClick={() => setSimOverlayGranted((v) => !v)}
                        className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-cyan-300"
                      >
                        {simOverlayGranted
                          ? 'Simuler révocation'
                          : 'Accorder SYSTEM_ALERT_WINDOW'}
                      </button>
                    </div>

                    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">
                          2. Service d&apos;Accessibilité FishReader
                        </span>
                        <span
                          className={`text-[11px] font-mono font-semibold ${
                            simAccessibilityGranted
                              ? 'text-emerald-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {simAccessibilityGranted ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Extrait le texte de l&apos;écran actif hors ligne lors
                        d&apos;un appui sur le poisson.
                      </p>
                      <button
                        onClick={() => setSimAccessibilityGranted((v) => !v)}
                        className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-cyan-300"
                      >
                        {simAccessibilityGranted
                          ? 'Simuler désactivation'
                          : 'Activer FishAccessibilityService'}
                      </button>
                    </div>

                    <button
                      disabled={!simOverlayGranted || !simAccessibilityGranted}
                      onClick={() => {
                        setPhoneScreenMode('OVERLAY_ON_APPS');
                        setIsExpanded(true);
                      }}
                      className="w-full py-3 rounded-xl bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-xs shadow-lg transition-colors"
                    >
                      Lancer la Bulle Flottante FishReader
                    </button>
                  </>
                )}

                {mobileAppTab === 'VOICE_SPEED' && (
                  <>
                    {/* Mobile Speed Card */}
                    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">
                          Vitesse de lecture
                        </span>
                        <span className="text-xs font-mono font-bold text-cyan-400 tabular-nums">
                          {speechSpeed.toFixed(2)}x
                        </span>
                      </div>

                      <input
                        type="range"
                        min={0.75}
                        max={1.5}
                        step={0.05}
                        value={speechSpeed}
                        onChange={(e) =>
                          handleSelectSpeedPreset(parseFloat(e.target.value))
                        }
                        className="w-full accent-cyan-400 cursor-pointer"
                      />

                      <div className="grid grid-cols-5 gap-1">
                        {[0.85, 1.0, 1.15, 1.25, 1.5].map((preset) => {
                          const active = Math.abs(speechSpeed - preset) < 0.03;
                          return (
                            <button
                              key={preset}
                              onClick={() => handleSelectSpeedPreset(preset)}
                              className={`py-1.5 rounded-lg text-[10px] font-mono font-semibold tabular-nums ${
                                active
                                  ? 'bg-cyan-500 text-slate-950'
                                  : 'bg-[#0B0F17] text-slate-300 border border-slate-800'
                              }`}
                            >
                              {preset}x
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Mobile Pitch & Pause Scale Card */}
                    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">
                          Hauteur tonale (Pitch)
                        </span>
                        <span className="text-xs font-mono font-bold text-cyan-400 tabular-nums">
                          {pitchSemitones >= 0 ? '+' : ''}
                          {pitchSemitones.toFixed(1)} demi-tons
                        </span>
                      </div>

                      <input
                        type="range"
                        min={-4.0}
                        max={4.0}
                        step={0.5}
                        value={pitchSemitones}
                        onChange={(e) =>
                          handleSelectPitchSemitones(parseFloat(e.target.value))
                        }
                        className="w-full accent-cyan-400 cursor-pointer"
                      />

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-semibold text-white">
                          Respiration ponctuation
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-400 tabular-nums">
                          {Math.round(pauseScale * 100)}%
                        </span>
                      </div>

                      <input
                        type="range"
                        min={0.65}
                        max={1.4}
                        step={0.05}
                        value={pauseScale}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          pauseScaleRef.current = val;
                          setPauseScale(val);
                        }}
                        className="w-full accent-emerald-400 cursor-pointer"
                      />
                    </div>

                    {/* Mobile Voice Model Selector */}
                    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-3.5 space-y-2">
                      <div className="text-xs font-semibold text-white">
                        Modèle Piper VITS Medium / High (22.05 kHz)
                      </div>
                      <div className="space-y-1.5">
                        {NEURAL_VOICE_PRESETS.map((preset) => {
                          const selected = preset.id === selectedVoicePresetId;
                          return (
                            <button
                              key={preset.id}
                              onClick={() => setSelectedVoicePresetId(preset.id)}
                              className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                                selected
                                  ? 'bg-cyan-950/40 border-cyan-500 text-white'
                                  : 'bg-[#0B0F17] border-slate-800 text-slate-300'
                              }`}
                            >
                              <span className="truncate font-medium">
                                {preset.label}
                              </span>
                              <span className="text-[10px] font-mono text-cyan-400 shrink-0 ml-2">
                                {selected ? 'Actif' : 'Choisir'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                {mobileAppTab === 'TEST_BENCH' && (
                  <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="text-xs font-semibold text-white">
                      Banc de test Audio (MainActivity.kt)
                    </div>
                    <div className="text-[11px] font-mono text-cyan-300">
                      Vitesse : {speechSpeed.toFixed(2)}x · Pitch :{' '}
                      {pitchSemitones >= 0 ? '+' : ''}
                      {pitchSemitones.toFixed(1)} st · Pause :{' '}
                      {Math.round(pauseScale * 100)}%
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed bg-[#0B0F17] p-3 rounded-xl border border-slate-800">
                      &ldquo;{activeSentenceObj?.text}&rdquo;
                    </p>
                    <button
                      onClick={handleTogglePlayPause}
                      className="w-full py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-3.5 h-3.5 fill-current" />
                          <span>Mettre en pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Tester la voix maintenant</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Bottom Navigation Bar (Material 3) */}
              <div className="grid grid-cols-3 border-t border-slate-800 bg-[#111827] h-14">
                <button
                  onClick={() => setMobileAppTab('HOME')}
                  className={`flex flex-col items-center justify-center text-[10px] font-medium ${
                    mobileAppTab === 'HOME' ? 'text-cyan-400' : 'text-slate-400'
                  }`}
                >
                  <span className="text-sm">🐟</span>
                  <span>Accueil</span>
                </button>
                <button
                  onClick={() => setMobileAppTab('VOICE_SPEED')}
                  className={`flex flex-col items-center justify-center text-[10px] font-medium ${
                    mobileAppTab === 'VOICE_SPEED'
                      ? 'text-cyan-400'
                      : 'text-slate-400'
                  }`}
                >
                  <Sliders className="w-4 h-4 mb-0.5" />
                  <span>Voix &amp; Vitesse</span>
                </button>
                <button
                  onClick={() => setMobileAppTab('TEST_BENCH')}
                  className={`flex flex-col items-center justify-center text-[10px] font-medium ${
                    mobileAppTab === 'TEST_BENCH'
                      ? 'text-cyan-400'
                      : 'text-slate-400'
                  }`}
                >
                  <Volume2 className="w-4 h-4 mb-0.5" />
                  <span>Test Audio</span>
                </button>
              </div>
            </div>
          ) : (
            /* MODE 1 : Application Sous-Jacente + Widget Flottant FishReader */
            <>
              <div className="absolute inset-0 bg-[#0B1120]">
                {currentApp.nodes.map((node) => {
                  const isSpokenNow =
                    isPlaying && activeSentenceObj?.nodeId === node.id;
                  const isSelected = selectedNodeId === node.id;
                  const isAccepted = node.status === 'ACCEPTED';

                  let boxBorderClass = 'border-transparent';
                  let boxBgClass = 'bg-transparent';

                  if (xrayMode) {
                    if (currentApp.requiresOcrFallback && isAccepted) {
                      boxBorderClass = isSelected
                        ? 'border-amber-400'
                        : 'border-amber-500/50 border-dashed';
                      boxBgClass = isSpokenNow
                        ? 'bg-amber-500/20'
                        : 'bg-amber-500/5';
                    } else if (isAccepted) {
                      boxBorderClass = isSelected
                        ? 'border-emerald-400'
                        : 'border-emerald-500/45';
                      boxBgClass = isSpokenNow
                        ? 'bg-cyan-500/20'
                        : 'bg-emerald-500/5';
                    } else {
                      boxBorderClass = isSelected
                        ? 'border-rose-400'
                        : 'border-rose-500/35 border-dashed';
                      boxBgClass = 'bg-rose-950/20';
                    }
                  } else if (isSpokenNow) {
                    boxBorderClass = 'border-cyan-400/80';
                    boxBgClass = 'bg-cyan-500/15';
                  }

                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      style={{
                        top: `${node.bounds.top}px`,
                        left: `${node.bounds.left}px`,
                        width: `${node.bounds.width}px`,
                        minHeight: `${node.bounds.height}px`,
                      }}
                      className={`absolute rounded-lg border px-2.5 py-1.5 transition-all cursor-pointer ${boxBorderClass} ${boxBgClass}`}
                    >
                      {xrayMode && (
                        <div className="flex items-center justify-between text-[10px] font-mono mb-0.5">
                          <span
                            className={
                              isAccepted
                                ? currentApp.requiresOcrFallback
                                  ? 'text-amber-300'
                                  : 'text-emerald-300'
                                : 'text-rose-300 line-through'
                            }
                          >
                            {node.role === 'canvas_ocr'
                              ? 'MLKit.TextBlock'
                              : node.className.replace('android.widget.', '')}
                          </span>
                          <span className="text-slate-400 tabular-nums">
                            y:{node.bounds.top}px
                          </span>
                        </div>
                      )}

                      <p
                        className={`${
                          node.role === 'headline'
                            ? 'text-sm font-semibold text-white leading-snug'
                            : node.role === 'status_bar' ||
                                node.role === 'bottom_nav'
                              ? 'text-[11px] font-mono text-slate-400'
                              : node.role === 'button' ||
                                  node.role === 'toolbar' ||
                                  node.role === 'social_metric' ||
                                  node.role === 'timestamp'
                                ? 'text-xs text-slate-400'
                                : 'text-xs text-slate-200 leading-relaxed'
                        }`}
                      >
                        {node.text}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Floating Overlay Layer (SYSTEM_ALERT_WINDOW Simulation) */}
              {!isExpanded ? (
                /* Mode Réduit : Bulle Poisson Magnétique */
                <div
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  style={{
                    transform: `translate3d(${computedBubbleX}px, ${computedBubbleY}px, 0)`,
                    transition: dragOffset
                      ? 'none'
                      : 'transform 240ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  title="Glisser pour déplacer ou cliquer pour extraire et lire l'écran"
                  className={`absolute top-0 left-0 z-30 w-[54px] h-[50px] flex items-center justify-center bg-slate-950/95 border border-cyan-400 shadow-lg cursor-grab active:cursor-grabbing ${
                    dockEdge === 'RIGHT'
                      ? 'rounded-l-full rounded-r-lg'
                      : 'rounded-r-full rounded-l-lg'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span
                      className="text-xl leading-none"
                      role="img"
                      aria-label="FishReader"
                    >
                      🐟
                    </span>
                    <span className="text-[9px] font-mono text-cyan-300 mt-0.5 tabular-nums">
                      {speechSpeed.toFixed(1)}x
                    </span>
                  </div>
                </div>
              ) : (
                /* Mode Déployé : Lecteur Flottant Jetpack Compose avec Contrôle de Vitesse Direct */
                <div
                  style={{
                    top: `${Math.min(285, Math.max(54, computedBubbleY - 30))}px`,
                    left: dockEdge === 'RIGHT' ? '64px' : '16px',
                  }}
                  className="absolute z-30 w-[280px] rounded-2xl bg-slate-950/95 backdrop-blur-md border border-cyan-400/60 p-3.5 shadow-2xl space-y-2.5"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-base"
                        role="img"
                        aria-label="FishReader"
                      >
                        🐟
                      </span>
                      <div>
                        <div className="text-xs font-semibold text-white">
                          {currentVoicePreset.label.split(' · ')[1]}
                        </div>
                        <div className="text-[10px] font-mono text-cyan-400">
                          {currentApp.requiresOcrFallback
                            ? 'Fallback : ML Kit OCR v2'
                            : 'Prosodie VITS · 22.05 kHz'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setPhoneScreenMode('FISHREADER_MOBILE_APP');
                          setMobileAppTab('VOICE_SPEED');
                        }}
                        title="Ouvrir les réglages complets FishReader"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setIsExpanded(false)}
                        aria-label="Réduire en bulle poisson"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        <Minimize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Spoken Sentence Preview */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1 tabular-nums">
                      <span>
                        Phrase {currentSentenceIdx + 1} /{' '}
                        {currentApp.extractedSentences.length}
                      </span>
                      <span className="text-emerald-400">
                        {prefetchedIndices.includes(currentSentenceIdx + 1)
                          ? 'Suivante prête'
                          : currentApp.language.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-100 line-clamp-2 leading-snug">
                      {isSynthesizingNeural
                        ? 'Synthèse VITS 22.05 kHz en cours...'
                        : activeSentenceObj?.text || 'Prêt à lire'}
                    </p>
                  </div>

                  {/* Direct Overlay Speed Control Row (0.85x, 1.0x, 1.15x, 1.30x, 1.50x) */}
                  <div className="flex items-center justify-between gap-1 bg-slate-900/80 border border-slate-800 rounded-xl px-2 py-1.5">
                    <span className="text-[10px] font-mono text-slate-400 pl-1">
                      Vitesse ({lastDispatchMicros}µs)
                    </span>
                    <div className="flex items-center gap-1">
                      {[0.85, 1.0, 1.15, 1.3, 1.5].map((spd) => {
                        const active = Math.abs(speechSpeed - spd) < 0.04;
                        return (
                          <button
                            key={spd}
                            onClick={() => handleSelectSpeedPreset(spd)}
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono tabular-nums transition-colors ${
                              active
                                ? 'bg-cyan-500 text-slate-950 font-bold'
                                : 'text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            {spd}x
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Primary Overlay Controls : -30s, Play/Pause, Next */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRewind30s}
                      className="flex-1 py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 flex items-center justify-center gap-1 transition-colors whitespace-nowrap shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                      <span>-30s</span>
                    </button>

                    <button
                      onClick={handleTogglePlayPause}
                      className="flex-[1.35] py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-xs font-semibold text-slate-950 flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                    >
                      {isSynthesizingNeural ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Chargement</span>
                        </>
                      ) : isPlaying ? (
                        <>
                          <Pause className="w-3.5 h-3.5 fill-current" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Lecture</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleSkipNextSentence}
                      title="Phrase suivante"
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 transition-colors"
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Quick Simulator Footnote */}
        <p className="mt-3 text-xs text-slate-400 text-center max-w-xs">
          Basculez entre <strong>« Bulle Overlay Active »</strong> et{' '}
          <strong>« App Mobile FishReader »</strong> au-dessus du téléphone pour
          tester l&apos;interface mobile complète et le contrôle de vitesse.
        </p>
      </div>

      {/* Right Column (7 cols on lg): Neural Voice, Speed & Pitch Sliders, Node Inspector & Queue */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        {/* Neural Voice & Prosody Upgrade Selector */}
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>
                  Contrôleur Prosodique TtsManager (Vitesse, Pitch &amp; Modèles
                  Piper High/Medium)
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Modèle ONNX actif :{' '}
                <span className="font-mono text-cyan-300">
                  {currentVoicePreset.androidEquivalent}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setXrayMode((v) => !v)}
                className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-colors whitespace-nowrap shrink-0 ${
                  xrayMode
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-900 border-slate-700 text-slate-300'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Rayons X Nœuds UI</span>
              </button>

              <button
                onClick={() => {
                  const nextState = !audioEnabled;
                  setAudioEnabled(nextState);
                  if (!nextState) stopAllAudio();
                }}
                className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-colors whitespace-nowrap shrink-0 ${
                  audioEnabled
                    ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                {audioEnabled ? (
                  <Volume2 className="w-3.5 h-3.5" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5" />
                )}
                <span>{audioEnabled ? 'Audio Actif' : 'Audio Muet'}</span>
              </button>
            </div>
          </div>

          {/* Interactive Speed & Pitch Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-[#0B0F17] border border-slate-800/90 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">
                  Vitesse (Main.immediate · {lastDispatchMicros}µs)
                </span>
                <span className="font-mono font-bold text-cyan-400 tabular-nums">
                  {speechSpeed.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min={0.75}
                max={1.5}
                step={0.05}
                value={speechSpeed}
                onChange={(e) =>
                  handleSelectSpeedPreset(parseFloat(e.target.value))
                }
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex items-center justify-between gap-1">
                {[0.85, 1.0, 1.15, 1.25, 1.5].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => handleSelectSpeedPreset(spd)}
                    className={`flex-1 py-1 rounded text-[11px] font-mono tabular-nums transition-colors ${
                      Math.abs(speechSpeed - spd) < 0.03
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'bg-[#111827] text-slate-300 hover:text-white'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#0B0F17] border border-slate-800/90 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">
                  Hauteur tonale (Pitch Demi-tons)
                </span>
                <span className="font-mono font-bold text-cyan-400 tabular-nums">
                  {pitchSemitones >= 0 ? '+' : ''}
                  {pitchSemitones.toFixed(1)} st
                </span>
              </div>
              <input
                type="range"
                min={-4.0}
                max={4.0}
                step={0.5}
                value={pitchSemitones}
                onChange={(e) =>
                  handleSelectPitchSemitones(parseFloat(e.target.value))
                }
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex items-center justify-between gap-1">
                {[-2.0, -1.0, 0.0, 1.0, 2.0].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleSelectPitchSemitones(st)}
                    className={`flex-1 py-1 rounded text-[11px] font-mono tabular-nums transition-colors ${
                      Math.abs(pitchSemitones - st) < 0.1
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'bg-[#111827] text-slate-300 hover:text-white'
                    }`}
                  >
                    {st >= 0 ? `+${st}` : st}st
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Voice Presets Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {NEURAL_VOICE_PRESETS.map((preset) => {
              const isSelected = preset.id === selectedVoicePresetId;
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    setSelectedVoicePresetId(preset.id);
                    if (isPlaying) {
                      stopAllAudio();
                      setIsPlaying(false);
                    }
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-cyan-950/35 border-cyan-500/70 text-white'
                      : 'bg-[#0B0F17] border-slate-800/90 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">{preset.label}</span>
                    <span className="text-[11px] font-mono text-cyan-400 tabular-nums">
                      {preset.sampleRateLabel}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-1 truncate">
                    {preset.androidEquivalent}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected AccessibilityNodeInfo / OCR Block Inspector */}
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span>
                Inspecteur de Nœud sélectionné ({acceptedCount} retenus ·{' '}
                {rejectedCount} exclus)
              </span>
            </h4>
            <span
              className={`text-xs font-mono font-medium flex items-center gap-1 ${
                selectedNode.status === 'ACCEPTED'
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }`}
            >
              {selectedNode.status === 'ACCEPTED' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>INCLUS DANS LE FLUX TTS</span>
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5" />
                  <span>FILTRÉ (BRUIT UI)</span>
                </>
              )}
            </span>
          </div>

          <div className="bg-[#0B0F17] border border-slate-800/90 rounded-xl p-4 space-y-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
              <div>
                <span className="text-slate-500">className : </span>
                <span className="text-slate-200">{selectedNode.className}</span>
              </div>
              <div>
                <span className="text-slate-500">getBoundsInScreen : </span>
                <span className="text-cyan-300 tabular-nums">
                  Rect({selectedNode.bounds.left}, {selectedNode.bounds.top} -{' '}
                  {selectedNode.bounds.left + selectedNode.bounds.width},{' '}
                  {selectedNode.bounds.top + selectedNode.bounds.height})
                </span>
              </div>
            </div>

            <div className="pt-1.5 border-t border-slate-800/80">
              <span className="text-slate-400">Décision : </span>
              <span
                className={
                  selectedNode.status === 'ACCEPTED'
                    ? 'text-emerald-300'
                    : 'text-rose-300'
                }
              >
                {selectedNode.reason}
              </span>
            </div>
          </div>
        </div>

        {/* Sherpa-ONNX Sentence Queue & Playback Controls */}
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>
                  File Producteur-Consommateur (ProsodyRhythmEngine + Double
                  Buffer)
                </span>
              </h4>
              <p className="text-xs text-cyan-300/90 mt-0.5 font-mono">
                {ttsEngineStatus}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRewind30s}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                <span>-30s</span>
              </button>

              <button
                onClick={handleTogglePlayPause}
                className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-xs font-semibold text-slate-950 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
              >
                {isSynthesizingNeural ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Synthèse...</span>
                  </>
                ) : isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Lire l&apos;écran</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {currentApp.extractedSentences.map((sentence, idx) => {
              const isCurrent = idx === currentSentenceIdx;
              const isPrefetched = prefetchedIndices.includes(idx);
              return (
                <button
                  key={sentence.index}
                  onClick={() => {
                    setIsExpanded(true);
                    void playSentenceAt(idx);
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                    isCurrent
                      ? 'bg-cyan-950/30 border-cyan-500/60 text-white'
                      : 'bg-[#0B0F17] border-slate-800/80 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`font-mono text-xs mt-0.5 tabular-nums ${
                        isCurrent
                          ? 'text-cyan-400 font-semibold'
                          : 'text-slate-500'
                      }`}
                    >
                      0{idx + 1}
                    </span>
                    <span className="text-xs sm:text-sm leading-relaxed">
                      {sentence.text}
                    </span>
                  </div>
                  <div className="flex flex-col items-end shrink-0 gap-1">
                    <span className="font-mono text-xs text-slate-400 tabular-nums">
                      {(sentence.durationSec / speechSpeed).toFixed(1)}s
                    </span>
                    {isPrefetched && (
                      <span className="text-[10px] font-mono text-emerald-400">
                        Prêt (RAM)
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
