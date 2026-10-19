'use client';

import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import {
  Home,
  BookOpen,
  Volume2,
  VolumeX,
  Rewind,
  FastForward,
  Play,
  Pause,
  X,
  Bookmark,
  Plus,
  Copy,
  Check,
  Search,
  ShieldCheck,
  Maximize2,
  Minimize2,
  Sliders,
  Download,
  Code2,
} from 'lucide-react';
import {
  FrThemeId,
  FrThemePalette,
  FR_THEMES,
  DeviceWidthId,
  BubbleShapeId,
  HostAppId,
  BubbleModeId,
  NB,
  NBS,
  SPEEDS,
  SEC_PER_CHAR,
  fmtSpeed,
  fmtTime,
  splitTextIntoParagraphs,
  FR_VOICES,
  FrVoiceSpec,
  INITIAL_FR_DOCS,
  FrDocItem,
  FR_HOSTS,
  getProgressWidthClass,
  getBubbleTopClass,
  getReadingSizeClass,
  FrSwitch,
  FrSegmented,
  FrChip,
  FrLiveWave,
  FrVoiceCard,
  FrStepper,
  StopSquareIcon,
  VolumeStrokeIcon,
} from '@/lib/fishreader-ds';
import {KOTLIN_PROJECT_FILES} from '@/lib/kotlin-project-data';

interface SkipPrefs {
  unit: 'sec' | 'sent';
  sec: number;
  sent: number;
}

const SKIP_LIMITS: Record<'sec' | 'sent', [number, number, number]> = {
  sec: [5, 120, 5],
  sent: [1, 10, 1],
};

interface CommercialMobileAppExperienceProps {
  themeId?: FrThemeId;
  onThemeChange?: (next: FrThemeId) => void;
  onOpenDeveloperStudio?: () => void;
}

export default function CommercialMobileAppExperience({
  themeId: externalThemeId,
  onThemeChange,
  onOpenDeveloperStudio,
}: CommercialMobileAppExperienceProps) {
  // Theme state (Papier default, Sépia, Nuit)
  const [internalThemeId, setInternalThemeId] = useState<FrThemeId>('papier');
  const activeThemeId = externalThemeId || internalThemeId;
  const theme: FrThemePalette = FR_THEMES[activeThemeId];

  const handleSetTheme = (next: FrThemeId) => {
    setInternalThemeId(next);
    if (onThemeChange) onThemeChange(next);
  };

  // Prototype mode: 'companion' (FishReader Mobile) or 'bubble' (FishReader Bulle standalone)
  const [prototypeMode, setPrototypeMode] = useState<'companion' | 'bubble'>(
    'companion'
  );

  // Tweaks state matching FishReader Mobile.html & FishReader Bulle.html
  const [deviceWidth, setDeviceWidth] = useState<DeviceWidthId>('412');
  const [readSize, setReadSize] = useState<number>(19);
  const [bubbleShape, setBubbleShape] = useState<BubbleShapeId>('edge');
  const [autoTuck, setAutoTuck] = useState<boolean>(false);
  const [hostId, setHostId] = useState<HostAppId>('article');
  const [isFullscreenMobile, setIsFullscreenMobile] = useState<boolean>(false);

  // Companion app tabs & sheets
  const [tab, setTab] = useState<'home' | 'reader' | 'voices'>('home');
  const [bubbleOn, setBubbleOn] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1.25);
  const [voiceId, setVoiceId] = useState<'clara' | 'thomas' | 'emma'>('clara');
  const [timbre, setTimbre] = useState<'doux' | 'naturel' | 'clair'>('naturel');
  const [pauseCadence, setPauseCadence] = useState<
    'courtes' | 'naturelles' | 'marquees'
  >('naturelles');

  // Documents, search, bookmarks & sheets
  const [docs, setDocs] = useState<FrDocItem[]>(INITIAL_FR_DOCS);
  const [currentDocId, setCurrentDocId] = useState<string>('clinique');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [bookmarkedSentences, setBookmarkedSentences] = useState<number[]>([]);
  const [pasteSheetOpen, setPasteSheetOpen] = useState<boolean>(false);
  const [pasteText, setPasteText] = useState<string>('');
  const [pasteError, setPasteError] = useState<string>('');
  const [permissionsSheetOpen, setPermissionsSheetOpen] =
    useState<boolean>(false);
  const [permOverlayGranted, setPermOverlayGranted] = useState<boolean>(true);
  const [permAccessGranted, setPermAccessGranted] = useState<boolean>(true);

  // Bubble Overlay 6-state machine: idle -> menu -> scan -> reading -> pick -> hidden
  const [bubbleMode, setBubbleMode] = useState<BubbleModeId>('idle');
  const [playerExpanded, setPlayerExpanded] = useState<boolean>(false);
  const [bubbleTucked, setBubbleTucked] = useState<boolean>(false);
  const [bubbleSide, setBubbleSide] = useState<'left' | 'right'>('right');
  const [bubbleYf, setBubbleYf] = useState<number>(0.55);
  const [isDraggingBubble, setIsDraggingBubble] = useState<boolean>(false);
  const [overTrashTarget, setOverTrashTarget] = useState<boolean>(false);
  const [followReading, setFollowReading] = useState<boolean>(true);
  const [showSkipSettings, setShowSkipSettings] = useState<boolean>(false);
  const [skipPrefs, setSkipPrefs] = useState<SkipPrefs>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem('frb-skip');
        if (raw) {
          return {unit: 'sec', sec: 15, sent: 1, ...JSON.parse(raw)};
        }
      } catch {}
    }
    return {unit: 'sec', sec: 15, sent: 1};
  });

  const updateSkipPrefs = (patch: Partial<SkipPrefs>) => {
    setSkipPrefs((old) => {
      const next = {...old, ...patch};
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('frb-skip', JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  };

  // Audio synthesis & playback state
  const [activeSentenceIdx, setActiveSentenceIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isSynthesizingNeural, setIsSynthesizingNeural] =
    useState<boolean>(false);
  const [samplingVoiceId, setSamplingVoiceId] = useState<string | null>(null);
  const [audioMuted, setAudioMuted] = useState<boolean>(false);

  // Refs for Web Audio & scrolling
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const decodedBufferCacheRef = useRef<Map<string, AudioBuffer>>(new Map());
  const inFlightRequestsRef = useRef<Map<string, Promise<AudioBuffer | null>>>(
    new Map()
  );
  const playbackSessionRef = useRef<number>(0);
  const pauseTimerRef = useRef<number | null>(null);
  const speedRef = useRef<number>(speed);
  const timbreRef = useRef<'doux' | 'naturel' | 'clair'>(timbre);
  const readerScrollRef = useRef<HTMLDivElement | null>(null);
  const hostScrollRef = useRef<HTMLDivElement | null>(null);
  const bubbleAreaRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{
    x0: number;
    y0: number;
    rect: DOMRect;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    timbreRef.current = timbre;
  }, [timbre]);

  const currentDoc = useMemo(
    () => docs.find((d) => d.id === currentDocId) || docs[0],
    [docs, currentDocId]
  );

  const currentHost = useMemo(() => FR_HOSTS[hostId], [hostId]);
  const currentVoice = useMemo(
    () => FR_VOICES.find((v) => v.id === voiceId) || FR_VOICES[0],
    [voiceId]
  );

  // Active sentences list depends on whether we are in Companion App or Bubble Overlay
  const activeSentences = useMemo(() => {
    if (prototypeMode === 'bubble') {
      return [currentHost.title, ...currentHost.paragraphs.flat()];
    }
    return currentDoc.paragraphs.flat();
  }, [prototypeMode, currentHost, currentDoc]);

  // Compute elapsed, duration, progress exactly as in fr-mobile-parts.jsx
  const charsBefore = useCallback(
    (idx: number) =>
      activeSentences
        .slice(0, Math.max(0, idx))
        .reduce((acc, s) => acc + s.length, 0),
    [activeSentences]
  );
  const totalChars = useMemo(
    () => charsBefore(activeSentences.length),
    [charsBefore, activeSentences.length]
  );
  const elapsedSec =
    activeSentenceIdx < 0
      ? 0
      : (charsBefore(activeSentenceIdx) * SEC_PER_CHAR) / speed;
  const durationSec = (totalChars * SEC_PER_CHAR) / speed;
  const progressPct =
    activeSentenceIdx < 0 || totalChars === 0
      ? 0
      : (charsBefore(activeSentenceIdx) / totalChars) * 100;

  // Web Audio API initialization
  const getAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (!audioContextRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as {webkitAudioContext: typeof AudioContext})
          .webkitAudioContext;
      audioContextRef.current = new AudioCtx();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
    }
    return audioContextRef.current;
  }, []);

  const stopAudioPlayback = useCallback(() => {
    playbackSessionRef.current += 1;
    if (pauseTimerRef.current !== null) {
      window.clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.onended = null;
        currentSourceRef.current.stop();
        currentSourceRef.current.disconnect();
      } catch {}
      currentSourceRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSynthesizingNeural(false);
    setSamplingVoiceId(null);
  }, []);

  /**
   * Trims leading and trailing digital silence from a decoded 24 kHz AudioBuffer
   * while keeping a natural 20 ms pre-roll and 35 ms tail with an 8 ms cosine
   * fade-in/fade-out. This eliminates unnatural gaps between consecutive sentences
   * and ensures instant speech onset when pressing Play.
   */
  const trimSilenceAndSmoothBuffer = useCallback(
    (ctx: AudioContext, rawBuffer: AudioBuffer): AudioBuffer => {
      try {
        const channelData = rawBuffer.getChannelData(0);
        const sampleRate = rawBuffer.sampleRate;
        const len = channelData.length;
        const threshold = 0.0035;

        let startSample = 0;
        while (
          startSample < len &&
          Math.abs(channelData[startSample]) < threshold
        ) {
          startSample++;
        }

        let endSample = len - 1;
        while (
          endSample > startSample &&
          Math.abs(channelData[endSample]) < threshold
        ) {
          endSample--;
        }

        if (startSample >= endSample) {
          return rawBuffer;
        }

        // Preserve a gentle 20 ms pre-roll and 35 ms natural decay tail
        const preRollSamples = Math.floor(sampleRate * 0.02);
        const postRollSamples = Math.floor(sampleRate * 0.035);
        const trimmedStart = Math.max(0, startSample - preRollSamples);
        const trimmedEnd = Math.min(len, endSample + postRollSamples);
        const trimmedLength = trimmedEnd - trimmedStart;

        if (trimmedLength <= 0 || trimmedLength >= len * 0.98) {
          return rawBuffer;
        }

        const outBuffer = ctx.createBuffer(
          rawBuffer.numberOfChannels,
          trimmedLength,
          sampleRate
        );
        const fadeSamples = Math.min(
          Math.floor(sampleRate * 0.008),
          Math.floor(trimmedLength / 4)
        );

        for (let ch = 0; ch < rawBuffer.numberOfChannels; ch++) {
          const src = rawBuffer.getChannelData(ch);
          const dst = outBuffer.getChannelData(ch);
          for (let i = 0; i < trimmedLength; i++) {
            let sample = src[trimmedStart + i];
            if (i < fadeSamples) {
              const gain = 0.5 * (1 - Math.cos((Math.PI * i) / fadeSamples));
              sample *= gain;
            } else if (i >= trimmedLength - fadeSamples) {
              const rem = trimmedLength - 1 - i;
              const gain = 0.5 * (1 - Math.cos((Math.PI * rem) / fadeSamples));
              sample *= gain;
            }
            dst[i] = sample;
          }
        }

        return outBuffer;
      } catch {
        return rawBuffer;
      }
    },
    []
  );

  const fetchAndDecodeBuffer = useCallback(
    async (
      text: string,
      voiceSpec: FrVoiceSpec
    ): Promise<AudioBuffer | null> => {
      const trimmedText = text.trim();
      if (!trimmedText) return null;

      const cacheKey = `${voiceSpec.id}::${voiceSpec.geminiVoiceName}::${trimmedText}`;
      const cached = decodedBufferCacheRef.current.get(cacheKey);
      if (cached) return cached;

      const existingPromise = inFlightRequestsRef.current.get(cacheKey);
      if (existingPromise) return existingPromise;

      const requestPromise = (async (): Promise<AudioBuffer | null> => {
        try {
          const language = voiceSpec.bcp === 'en-US' ? 'en' : 'fr';
          let base64Audio: string | null = null;

          for (let attempt = 0; attempt < 2; attempt++) {
            try {
              const res = await fetch('/api/tts', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                  text: trimmedText,
                  voiceName: voiceSpec.geminiVoiceName,
                  voiceId: voiceSpec.id,
                  language,
                }),
              });
              if (!res.ok) continue;
              const data = await res.json();
              base64Audio =
                data.audioBase64 ||
                (typeof data.audioDataUrl === 'string'
                  ? data.audioDataUrl.split(',')[1]
                  : null);
              if (base64Audio) break;
            } catch {
              // Retry once if transient network error
            }
          }

          if (!base64Audio) return null;

          const ctx = getAudioContext();
          if (!ctx) return null;

          const binaryString = window.atob(base64Audio);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          const rawDecoded = await ctx.decodeAudioData(bytes.buffer.slice(0));
          const polishedBuffer = trimSilenceAndSmoothBuffer(ctx, rawDecoded);
          decodedBufferCacheRef.current.set(cacheKey, polishedBuffer);
          return polishedBuffer;
        } catch {
          return null;
        } finally {
          inFlightRequestsRef.current.delete(cacheKey);
        }
      })();

      inFlightRequestsRef.current.set(cacheKey, requestPromise);
      return requestPromise;
    },
    [getAudioContext, trimSilenceAndSmoothBuffer]
  );

  // Warm up first 2 sentences of active text whenever document, host app, or voice changes
  useEffect(() => {
    if (activeSentences.length > 0) {
      void fetchAndDecodeBuffer(activeSentences[0], currentVoice);
    }
    if (activeSentences.length > 1) {
      void fetchAndDecodeBuffer(activeSentences[1], currentVoice);
    }
  }, [activeSentences, currentVoice, fetchAndDecodeBuffer]);

  // Warm up the 3 studio voice samples when opening the Voices tab
  useEffect(() => {
    if (tab === 'voices') {
      for (const v of FR_VOICES) {
        void fetchAndDecodeBuffer(v.sample, v);
      }
    }
  }, [tab, fetchAndDecodeBuffer]);

  const playSentenceRef = useRef<
    (
      idx: number,
      sentencesList?: string[],
      voiceSpec?: FrVoiceSpec
    ) => Promise<void>
  >(async () => {});

  const playSentenceAtIndex = useCallback(
    async (
      idx: number,
      sentencesList: string[] = activeSentences,
      voiceSpec: FrVoiceSpec = currentVoice
    ) => {
      const sentence = sentencesList[idx];
      if (!sentence) {
        setIsPlaying(false);
        setActiveSentenceIdx(-1);
        return;
      }

      stopAudioPlayback();
      const sessionId = playbackSessionRef.current;

      const scheduleNext = () => {
        if (playbackSessionRef.current !== sessionId) return;
        const nextIdx = idx + 1;
        if (nextIdx < sentencesList.length) {
          // Since leading/trailing WAV silence is trimmed, inter-sentence pauses are crisp and natural
          const basePause =
            pauseCadence === 'courtes'
              ? 90
              : pauseCadence === 'marquees'
                ? 290
                : 165;
          const delayMs = Math.round(
            basePause / Math.max(0.75, speedRef.current)
          );
          pauseTimerRef.current = window.setTimeout(() => {
            if (playbackSessionRef.current !== sessionId) return;
            setActiveSentenceIdx(nextIdx);
            void playSentenceRef.current(nextIdx, sentencesList, voiceSpec);
          }, delayMs);
        } else {
          setIsPlaying(false);
          setActiveSentenceIdx(-1);
          if (prototypeMode === 'bubble') {
            setPlayerExpanded(false);
            setBubbleMode('idle');
          }
        }
      };

      if (audioMuted) {
        const simulatedMs =
          Math.max(1400, sentence.length * SEC_PER_CHAR * 1000) /
          speedRef.current;
        pauseTimerRef.current = window.setTimeout(scheduleNext, simulatedMs);
        return;
      }

      // 3-sentence Lookahead Producer-Consumer prefetching so consecutive sentences have 0ms wait
      for (let lookahead = 1; lookahead <= 3; lookahead++) {
        if (idx + lookahead < sentencesList.length) {
          void fetchAndDecodeBuffer(
            sentencesList[idx + lookahead],
            voiceSpec
          );
        }
      }

      const cacheKey = `${voiceSpec.id}::${voiceSpec.geminiVoiceName}::${sentence.trim()}`;
      if (!decodedBufferCacheRef.current.has(cacheKey)) {
        setIsSynthesizingNeural(true);
      }

      const audioBuffer = await fetchAndDecodeBuffer(sentence, voiceSpec);
      if (playbackSessionRef.current !== sessionId) return;
      setIsSynthesizingNeural(false);

      const ctx = getAudioContext();
      if (audioBuffer && ctx) {
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.playbackRate.value = speedRef.current;
        // Subtle, formant-preserving timbre adjustment (-55 cents / 0 / +55 cents)
        const timbreCents =
          timbreRef.current === 'doux'
            ? -55
            : timbreRef.current === 'clair'
              ? 55
              : 0;
        source.detune.value =
          timbreCents + voiceSpec.defaultPitchSemitones * 100;
        source.connect(ctx.destination);
        currentSourceRef.current = source;
        source.onended = () => {
          if (playbackSessionRef.current !== sessionId) return;
          currentSourceRef.current = null;
          scheduleNext();
        };
        source.start(0);
        return;
      }

      // Fallback Web Speech API (only if offline or API unreachable)
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(sentence);
        utterance.lang = voiceSpec.bcp;
        utterance.rate = speedRef.current;
        utterance.onend = () => {
          if (playbackSessionRef.current !== sessionId) return;
          scheduleNext();
        };
        utterance.onerror = () => {
          if (playbackSessionRef.current !== sessionId) return;
          scheduleNext();
        };
        window.speechSynthesis.speak(utterance);
      } else {
        const simulatedMs =
          Math.max(1400, sentence.length * SEC_PER_CHAR * 1000) /
          speedRef.current;
        pauseTimerRef.current = setTimeout(
          scheduleNext,
          simulatedMs
        ) as unknown as number;
      }
    },
    [
      activeSentences,
      audioMuted,
      currentVoice,
      fetchAndDecodeBuffer,
      getAudioContext,
      pauseCadence,
      prototypeMode,
      stopAudioPlayback,
    ]
  );

  useEffect(() => {
    playSentenceRef.current = playSentenceAtIndex;
  }, [playSentenceAtIndex]);

  // Instant speed update without audio glitch
  const handleSpeedUpdate = useCallback((nextSpeed: number) => {
    const rounded = Math.round(nextSpeed * 100) / 100;
    speedRef.current = rounded;
    setSpeed(rounded);
    const activeSource = currentSourceRef.current;
    const ctx = audioContextRef.current;
    if (activeSource && ctx) {
      try {
        activeSource.playbackRate.setTargetAtTime(
          rounded,
          ctx.currentTime,
          0.015
        );
      } catch {
        activeSource.playbackRate.value = rounded;
      }
    }
  }, []);

  // Instant timbre update without audio glitch
  const handleTimbreUpdate = useCallback(
    (nextTimbre: 'doux' | 'naturel' | 'clair') => {
      timbreRef.current = nextTimbre;
      setTimbre(nextTimbre);
      const activeSource = currentSourceRef.current;
      const ctx = audioContextRef.current;
      if (activeSource && ctx) {
        const timbreCents =
          nextTimbre === 'doux' ? -55 : nextTimbre === 'clair' ? 55 : 0;
        const targetCents =
          timbreCents + currentVoice.defaultPitchSemitones * 100;
        try {
          activeSource.detune.setTargetAtTime(
            targetCents,
            ctx.currentTime,
            0.02
          );
        } catch {
          activeSource.detune.value = targetCents;
        }
      }
    },
    [currentVoice.defaultPitchSemitones]
  );

  // Switch voice and immediately apply to active playback if currently reading
  const handleSelectVoice = useCallback(
    (nextVoiceId: 'clara' | 'thomas' | 'emma') => {
      setVoiceId(nextVoiceId);
      const nextVoiceObj =
        FR_VOICES.find((v) => v.id === nextVoiceId) || FR_VOICES[0];
      if (isPlaying) {
        const targetIdx = Math.max(0, activeSentenceIdx);
        void playSentenceAtIndex(targetIdx, activeSentences, nextVoiceObj);
      } else {
        // Warm up first 2 sentences for the newly selected voice immediately
        if (activeSentences.length > 0) {
          void fetchAndDecodeBuffer(activeSentences[0], nextVoiceObj);
        }
        if (activeSentences.length > 1) {
          void fetchAndDecodeBuffer(activeSentences[1], nextVoiceObj);
        }
      }
    },
    [
      activeSentenceIdx,
      activeSentences,
      fetchAndDecodeBuffer,
      isPlaying,
      playSentenceAtIndex,
    ]
  );

  // Update doc progress when reading in Companion App
  useEffect(() => {
    if (
      prototypeMode === 'companion' &&
      activeSentenceIdx >= 0 &&
      activeSentences.length > 0
    ) {
      const p = Math.round((activeSentenceIdx / activeSentences.length) * 100);
      const t = window.setTimeout(() => {
        setDocs((prev) =>
          prev.map((d) => (d.id === currentDocId ? {...d, progress: p} : d))
        );
      }, 0);
      return () => window.clearTimeout(t);
    }
  }, [activeSentenceIdx, activeSentences.length, currentDocId, prototypeMode]);

  // Auto-scroll in Companion Reader
  useEffect(() => {
    if (prototypeMode !== 'companion' || tab !== 'reader') return;
    const container = readerScrollRef.current;
    if (!container || activeSentenceIdx < 0) return;
    const el = container.querySelector(
      `[data-reader-sent="${activeSentenceIdx}"]`
    );
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cr = container.getBoundingClientRect();
    if (r.top < cr.top + 64 || r.bottom > cr.bottom - 48) {
      container.scrollTo({
        top: container.scrollTop + r.top - cr.top - cr.height * 0.3,
        behavior: 'smooth',
      });
    }
  }, [activeSentenceIdx, prototypeMode, tab]);

  // Auto-scroll in Bubble Host App when followReading is enabled
  useEffect(() => {
    if (prototypeMode !== 'bubble' || !followReading || activeSentenceIdx < 0)
      return;
    const container = hostScrollRef.current;
    if (!container) return;
    const el = container.querySelector(
      `[data-host-sent="${activeSentenceIdx}"]`
    );
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cr = container.getBoundingClientRect();
    if (r.top < cr.top + 24 || r.bottom > cr.bottom - cr.height * 0.4) {
      container.scrollTo({
        top: container.scrollTop + r.top - cr.top - cr.height * 0.2,
        behavior: 'smooth',
      });
    }
  }, [activeSentenceIdx, followReading, prototypeMode]);

  // Auto-tuck bubble after 3.5s in idle mode
  useEffect(() => {
    if (
      prototypeMode !== 'bubble' ||
      !autoTuck ||
      bubbleMode !== 'idle' ||
      bubbleShape !== 'edge' ||
      isDraggingBubble
    ) {
      const resetTimer = window.setTimeout(() => setBubbleTucked(false), 0);
      return () => window.clearTimeout(resetTimer);
    }
    const timer = window.setTimeout(() => setBubbleTucked(true), 3500);
    return () => window.clearTimeout(timer);
  }, [
    autoTuck,
    bubbleMode,
    bubbleShape,
    bubbleSide,
    bubbleYf,
    isDraggingBubble,
    prototypeMode,
  ]);

  // Scan transition (1.5s scanline -> reading sentence 0)
  useEffect(() => {
    if (prototypeMode !== 'bubble' || bubbleMode !== 'scan') return;
    const timer = window.setTimeout(() => {
      setBubbleMode('reading');
      setActiveSentenceIdx(0);
      setIsPlaying(true);
      playSentenceAtIndex(0, activeSentences, currentVoice);
    }, 1450);
    return () => window.clearTimeout(timer);
  }, [
    activeSentences,
    bubbleMode,
    currentVoice,
    playSentenceAtIndex,
    prototypeMode,
  ]);

  // Reset bubble state when switching host app
  const handleSelectHostApp = (nextHost: HostAppId) => {
    stopAudioPlayback();
    setIsPlaying(false);
    setHostId(nextHost);
    setBubbleMode('idle');
    setPlayerExpanded(false);
    setActiveSentenceIdx(-1);
  };

  // Play / Pause toggle
  const handleTogglePlay = () => {
    if (isPlaying) {
      stopAudioPlayback();
      setIsPlaying(false);
    } else {
      const startIdx = activeSentenceIdx < 0 ? 0 : activeSentenceIdx;
      setActiveSentenceIdx(startIdx);
      setIsPlaying(true);
      playSentenceAtIndex(startIdx, activeSentences, currentVoice);
    }
  };

  // Seek to specific sentence
  const handleSeekSentence = (idx: number) => {
    setActiveSentenceIdx(idx);
    setIsPlaying(true);
    playSentenceAtIndex(idx, activeSentences, currentVoice);
  };

  // Skip by seconds or sentences (exact formula from fr-mobile-parts.jsx)
  const handleSkipSeconds = (deltaSec: number) => {
    const cur = Math.max(0, activeSentenceIdx);
    const neededChars = (Math.abs(deltaSec) * speed) / SEC_PER_CHAR;
    let i = cur;
    let acc = 0;
    if (deltaSec < 0) {
      while (i > 0 && acc < neededChars) {
        i--;
        acc += activeSentences[i].length;
      }
    } else {
      while (i < activeSentences.length - 1 && acc < neededChars) {
        acc += activeSentences[i].length;
        i++;
      }
    }
    setActiveSentenceIdx(i);
    if (isPlaying) {
      playSentenceAtIndex(i, activeSentences, currentVoice);
    }
  };

  const handleSkipSentences = (deltaSent: number) => {
    const cur = Math.max(0, activeSentenceIdx);
    const nextIdx = Math.min(
      activeSentences.length - 1,
      Math.max(0, cur + deltaSent)
    );
    setActiveSentenceIdx(nextIdx);
    if (isPlaying) {
      playSentenceAtIndex(nextIdx, activeSentences, currentVoice);
    }
  };

  const handleBubblePlayerSkip = (forward: boolean) => {
    if (skipPrefs.unit === 'sec') {
      handleSkipSeconds(forward ? skipPrefs.sec : -skipPrefs.sec);
    } else {
      handleSkipSentences(forward ? skipPrefs.sent : -skipPrefs.sent);
    }
  };

  const handleStopBubbleReading = () => {
    stopAudioPlayback();
    setIsPlaying(false);
    setActiveSentenceIdx(-1);
    setPlayerExpanded(false);
    setBubbleMode('idle');
  };

  // Sample voice in Voices screen
  const handleSampleVoice = async (v: FrVoiceSpec) => {
    if (samplingVoiceId === v.id) {
      stopAudioPlayback();
      return;
    }
    stopAudioPlayback();
    setIsPlaying(false);
    setSamplingVoiceId(v.id);
    const sessionId = playbackSessionRef.current;

    const buffer = await fetchAndDecodeBuffer(v.sample, v);
    if (playbackSessionRef.current !== sessionId) return;

    const ctx = getAudioContext();
    if (buffer && ctx && !audioMuted) {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = speedRef.current;
      const timbreCents =
        timbreRef.current === 'doux'
          ? -55
          : timbreRef.current === 'clair'
            ? 55
            : 0;
      source.detune.value = timbreCents + v.defaultPitchSemitones * 100;
      source.connect(ctx.destination);
      currentSourceRef.current = source;
      source.onended = () => {
        if (playbackSessionRef.current === sessionId) {
          setSamplingVoiceId(null);
        }
      };
      source.start(0);
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(v.sample);
      u.lang = v.bcp;
      u.onend = () => setSamplingVoiceId(null);
      u.onerror = () => setSamplingVoiceId(null);
      window.speechSynthesis.speak(u);
    } else {
      setTimeout(() => setSamplingVoiceId(null), 2000);
    }
  };

  // Open document from Home screen
  const handleOpenDoc = (doc: FrDocItem) => {
    stopAudioPlayback();
    setIsPlaying(false);
    setCurrentDocId(doc.id);
    const flat = doc.paragraphs.flat();
    const resumedIdx = Math.min(
      flat.length - 1,
      Math.floor((flat.length * (doc.progress || 0)) / 100)
    );
    setActiveSentenceIdx(resumedIdx);
    setTab('reader');
  };

  // Paste from clipboard in PasteSheet
  const handleClipboardPaste = async () => {
    setPasteError('');
    try {
      if (!navigator.clipboard) throw new Error('Unavailable');
      const txt = await navigator.clipboard.readText();
      if (!txt.trim()) throw new Error('Empty');
      setPasteText(txt);
    } catch {
      setPasteError(
        `Fish Reader n’a pas pu lire le presse-papiers. Faites un appui long dans le champ, puis choisissez «${NB}Coller${NB}».`
      );
    }
  };

  const handleReadPastedText = () => {
    const cleaned = pasteText.trim();
    if (!cleaned) return;
    const paragraphs = splitTextIntoParagraphs(cleaned);
    const firstSentence = paragraphs[0]?.[0] || cleaned;
    const newDoc: FrDocItem = {
      id: 'c-' + Date.now(),
      when: 'À l’instant',
      kicker: 'Texte collé',
      title:
        firstSentence.length > 48
          ? firstSentence.slice(0, 46).trim() + '…'
          : firstSentence,
      progress: 0,
      paragraphs,
    };
    setDocs((prev) => [newDoc, ...prev]);
    setCurrentDocId(newDoc.id);
    setPasteText('');
    setPasteError('');
    setPasteSheetOpen(false);
    setTab('reader');
    setActiveSentenceIdx(0);
    setIsPlaying(true);
    playSentenceAtIndex(0, paragraphs.flat(), currentVoice);
  };

  // Pointer drag handlers for the Edge Bubble
  const handleBubblePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const area = bubbleAreaRef.current;
    if (!area) return;
    dragStartRef.current = {
      x0: e.clientX,
      y0: e.clientY,
      rect: area.getBoundingClientRect(),
      moved: false,
    };
  };

  const handleBubblePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const st = dragStartRef.current;
    if (!st) return;
    if (
      !st.moved &&
      Math.hypot(e.clientX - st.x0, e.clientY - st.y0) < 6
    ) {
      return;
    }
    st.moved = true;
    setIsDraggingBubble(true);
    const x = e.clientX - st.rect.left;
    const y = e.clientY - st.rect.top;
    setBubbleSide(x < st.rect.width / 2 ? 'left' : 'right');
    setBubbleYf(Math.min(0.8, Math.max(0.1, (y - 28) / st.rect.height)));
    const trashHit =
      Math.hypot(x - st.rect.width / 2, y - (st.rect.height - 64)) < 56;
    setOverTrashTarget(trashHit);
  };

  const handleBubblePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const st = dragStartRef.current;
    dragStartRef.current = null;
    if (!st) return;
    if (!st.moved) {
      if (bubbleTucked) setBubbleTucked(false);
      setBubbleMode('menu');
      return;
    }
    const x = e.clientX - st.rect.left;
    const y = e.clientY - st.rect.top;
    const trashHit =
      Math.hypot(x - st.rect.width / 2, y - (st.rect.height - 64)) < 56;
    setIsDraggingBubble(false);
    setOverTrashTarget(false);
    if (trashHit) {
      setBubbleMode('hidden');
      return;
    }
    setBubbleSide(x < st.rect.width / 2 ? 'left' : 'right');
    setBubbleYf(Math.min(0.8, Math.max(0.1, (y - 28) / st.rect.height)));
  };

  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return docs;
    const q = searchQuery.toLowerCase();
    return docs.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.kicker.toLowerCase().includes(q) ||
        d.paragraphs.flat().some((s) => s.toLowerCase().includes(q))
    );
  }, [docs, searchQuery]);

  const skipButtonText = (sign: string) =>
    skipPrefs.unit === 'sec'
      ? `${sign}${skipPrefs.sec}${NBS}s`
      : `${sign}${skipPrefs.sent}${NBS}phr.`;

  const deviceWidthClass =
    deviceWidth === '375'
      ? 'w-[375px]'
      : deviceWidth === '430'
        ? 'w-[430px]'
        : 'w-[412px]';

  // ==================== RENDER BUBBLE OVERLAY PROTOTYPE (fr-bubble.jsx) ====================
  let sentCounter = 0;
  const renderHostSentence = (s: string) => {
    const i = sentCounter++;
    const isAct = bubbleMode === 'reading' && i === activeSentenceIdx;
    const isRead = bubbleMode === 'reading' && i < activeSentenceIdx;
    const isPick = bubbleMode === 'pick';
    return (
      <React.Fragment key={i}>
        <span
          data-host-sent={i}
          onClick={
            isPick
              ? () => {
                  setBubbleMode('reading');
                  handleSeekSentence(i);
                }
                : undefined
            }
            className={`rounded-[4px] transition-colors duration-250 ${
              isAct
                ? `${theme.highlightBg} ${theme.inkText} ${theme.highlightRing}`
                : isRead
                  ? theme.inkMutedText
                  : theme.inkText
            } ${
              isPick
                ? `underline decoration-[#E2D8C6] underline-offset-4 cursor-pointer hover:${theme.highlightBg}`
                : ''
            }`}
          >
            {s}
          </span>{' '}
        </React.Fragment>
      );
    };

  const bubbleOverlayNode = (
    <div
      ref={bubbleAreaRef}
      className={`relative flex-1 min-h-0 flex flex-col overflow-hidden ${theme.paperRaisedBg} ${theme.inkText}`}
    >
        {/* Top contextual banner if launched from Companion App */}
        <div
          className={`flex items-center justify-between gap-2 min-h-[48px] px-4 border-b ${theme.paperBg} ${theme.ruleBorder}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`text-[12px] leading-[18px] font-semibold uppercase tracking-[0.08em] ${theme.accentText}`}
            >
              Superposition active
            </span>
            <span className={`text-[13px] truncate ${theme.inkMutedText}`}>
              · {currentHost.app}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              handleStopBubbleReading();
              setPrototypeMode('companion');
            }}
            className={`min-h-[44px] px-2.5 rounded-[8px] text-[13px] font-semibold cursor-pointer flex items-center gap-1 ${theme.inkMutedText} hover:${theme.inkText}`}
          >
            <span>Application compagnon</span>
          </button>
        </div>

        {/* Host App Header Bar */}
        <div
          className={`h-[48px] px-4 flex items-center gap-2.5 border-b shrink-0 ${theme.paperBg} ${theme.ruleBorder}`}
        >
          <span className={`text-[13px] font-semibold ${theme.inkText}`}>
            {currentHost.app}
          </span>
          <span
            className={`flex-1 min-h-[30px] px-3 rounded-full flex items-center text-[12px] truncate ${theme.paperRaisedBg} ${theme.inkMutedText}`}
          >
            {currentHost.url}
          </span>
        </div>

        {/* Host App Scrollable Article / Mail / PDF */}
        <div
          ref={hostScrollRef}
          className="flex-1 overflow-y-auto px-5 pt-5 pb-36"
        >
          <p
            className={`m-0 mb-1.5 text-[12px] leading-[18px] font-semibold uppercase tracking-[0.08em] ${theme.accentText}`}
          >
            {currentHost.kicker}
          </p>
          <h2
            className={`m-0 mb-2 font-[family-name:var(--font-serif)] font-semibold text-[24px] leading-[30px] text-balance ${theme.inkText}`}
          >
            {renderHostSentence(currentHost.title)}
          </h2>
          <p
            className={`m-0 mb-5 pb-3.5 border-b text-[13px] leading-[18px] ${theme.inkMutedText} ${theme.ruleBorder}`}
          >
            {currentHost.meta}
          </p>

          {currentHost.paragraphs.map((para, pi) => (
            <p
              key={pi}
              className={`m-0 mb-4 font-[family-name:var(--font-serif)] ${getReadingSizeClass(
                readSize
              )}`}
            >
              {para.map(renderHostSentence)}
            </p>
          ))}
        </div>

        {/* Scanline animation during mode === 'scan' */}
        {bubbleMode === 'scan' && (
          <div
            aria-hidden="true"
            className={`absolute left-0 right-0 top-1/2 h-[2px] z-20 animate-pulse ${theme.accentBg}`}
          />
        )}

        {/* STATE 1A: IDLE EDGE BUBBLE (with optional 3s Auto-Tuck tab) */}
        {bubbleMode === 'idle' && bubbleShape === 'edge' && (
          <button
            type="button"
            aria-label="Ouvrir le menu de lecture Fish Reader"
            onPointerDown={handleBubblePointerDown}
            onPointerMove={handleBubblePointerMove}
            onPointerUp={handleBubblePointerUp}
            className={`absolute z-20 p-0 border-0 bg-transparent grid place-items-center cursor-grab touch-none transition-all duration-250 ${getBubbleTopClass(
              bubbleYf
            )} ${
              bubbleTucked
                ? `w-[44px] h-[72px] ${
                    bubbleSide === 'left'
                      ? 'left-0 justify-items-start'
                      : 'right-0 justify-items-end'
                  }`
                : `w-[56px] h-[56px] ${
                    bubbleSide === 'left' ? 'left-2' : 'right-2'
                  }`
            }`}
          >
            <span
              className={`grid place-items-center transition-all duration-250 ${
                theme.accentBg
              } ${theme.onAccentText} ${
                isDraggingBubble
                  ? theme.highlightRing
                  : theme.id === 'nuit'
                    ? 'ring-3 ring-[#26231F]'
                    : theme.id === 'sepia'
                      ? 'ring-3 ring-[#F6ECD9]'
                      : 'ring-3 ring-[#FFFCF5]'
              } ${
                bubbleTucked
                  ? `w-[14px] h-[64px] ${
                      bubbleSide === 'left'
                        ? 'rounded-r-[8px]'
                        : 'rounded-l-[8px]'
                    }`
                  : 'w-[56px] h-[56px] rounded-full'
              }`}
            >
              {!bubbleTucked && <VolumeStrokeIcon size={22} />}
            </span>
          </button>
        )}

        {/* STATE 1B: IDLE BOTTOM PILL VARIANT */}
        {bubbleMode === 'idle' && bubbleShape === 'pill' && (
          <button
            type="button"
            aria-label="Ouvrir le menu de lecture Fish Reader"
            onClick={() => setBubbleMode('menu')}
            className={`absolute z-20 left-1/2 bottom-3 -translate-x-1/2 min-h-[44px] px-4 rounded-full border-0 flex items-center gap-2 text-[14px] leading-[20px] font-semibold cursor-pointer active:translate-y-[1px] ${theme.accentBg} ${theme.onAccentText}`}
          >
            <VolumeStrokeIcon size={18} />
            <span>Lire</span>
          </button>
        )}

        {/* DRAG TARGET: Cible « Masquer » (80 dp circle at bottom center) */}
        {isDraggingBubble && (
          <div
            aria-hidden="true"
            className={`absolute z-20 left-1/2 bottom-6 -translate-x-1/2 w-[80px] h-[80px] rounded-full border flex flex-col items-center justify-center gap-0.5 text-[12px] leading-[16px] font-semibold pointer-events-none transition-colors duration-150 ${
              overTrashTarget
                ? theme.dangerFillBg
                : `${theme.paperBg} ${theme.inkMutedBorder} ${theme.inkText}`
            }`}
          >
            <X className="w-[22px] h-[22px]" strokeWidth={1.5} />
            <span>Masquer</span>
          </div>
        )}

        {/* STATE 2: MENU SHEET (Feuille Menu de lecture) */}
        {bubbleMode === 'menu' && (
          <>
            <button
              type="button"
              aria-label="Fermer le menu"
              onClick={() => setBubbleMode('idle')}
              className="absolute inset-0 z-20 border-0 p-0 bg-transparent cursor-pointer"
            />
            <div
              role="dialog"
              aria-label="Menu de lecture"
              className={`absolute z-30 left-2 right-2 bottom-2 flex flex-col gap-3 pt-2 px-4 pb-3 rounded-[14px] border ${theme.paperBg} ${theme.ruleBorder}`}
            >
              {/* 1. En-tête */}
              <div className="flex items-center gap-2 min-h-[44px] -mr-2">
                <span
                  className={`font-[family-name:var(--font-serif)] font-semibold text-[18px] leading-[24px] ${theme.inkText}`}
                >
                  Fish Reader
                </span>
                <span
                  className={`px-2 py-0.5 rounded-[4px] border text-[12px] leading-[18px] tabular-nums ${theme.paperRaisedBg} ${theme.ruleBorder} ${theme.inkMutedText}`}
                >
                  {currentVoice.name} · {fmtSpeed(speed)}
                </span>
                <span className="flex-1" />
                <button
                  type="button"
                  aria-label="Fermer le menu"
                  onClick={() => setBubbleMode('idle')}
                  className={`w-[44px] h-[44px] rounded-full grid place-items-center cursor-pointer ${theme.inkMutedText} hover:${theme.inkText}`}
                >
                  <X className="w-5 h-5" strokeWidth={1.5} />
                </button>
              </div>

              {/* 2 & 3. Boutons primaires & secondaires 48 dp */}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPlayerExpanded(false);
                    setBubbleMode('scan');
                  }}
                  className={`w-full min-h-[48px] px-4 rounded-[8px] flex items-center justify-center gap-2 text-[14px] leading-[20px] font-semibold cursor-pointer active:translate-y-[1px] ${theme.accentBg} ${theme.onAccentText}`}
                >
                  <Play className="w-[18px] h-[18px]" strokeWidth={1.5} />
                  <span>Lire cet écran</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    stopAudioPlayback();
                    setIsPlaying(false);
                    setActiveSentenceIdx(-1);
                    setBubbleMode('pick');
                  }}
                  className={`w-full min-h-[48px] px-4 rounded-[8px] border flex items-center justify-center gap-2 text-[14px] leading-[20px] font-semibold cursor-pointer active:translate-y-[1px] ${theme.paperRaisedBg} ${theme.inkMutedBorder} ${theme.inkText}`}
                >
                  <Bookmark className="w-[18px] h-[18px]" strokeWidth={1.5} />
                  <span>Choisir où commencer</span>
                </button>
              </div>

              {/* 4. Vitesse 5 cases */}
              <div className="space-y-1.5">
                <div
                  className={`flex items-center justify-between text-[12px] leading-[18px] font-semibold uppercase tracking-[0.08em] ${theme.inkMutedText}`}
                >
                  <span>Vitesse</span>
                  <span className={`tabular-nums ${theme.inkText}`}>
                    {fmtSpeed(speed)}
                  </span>
                </div>
                <FrSegmented
                  label="Vitesse de lecture"
                  value={speed}
                  onChange={handleSpeedUpdate}
                  theme={theme}
                  options={SPEEDS.map((s) => ({value: s, label: fmtSpeed(s)}))}
                />
              </div>

              {/* 5. Voix (3 puces 44 dp) */}
              <div className="space-y-1.5">
                <div
                  className={`text-[12px] leading-[18px] font-semibold uppercase tracking-[0.08em] ${theme.inkMutedText}`}
                >
                  <span>Voix</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {FR_VOICES.map((v) => (
                    <FrChip
                      key={v.id}
                      selected={voiceId === v.id}
                      onClick={() => setVoiceId(v.id)}
                      theme={theme}
                    >
                      {v.name}
                    </FrChip>
                  ))}
                </div>
              </div>

              <div className={`h-[1px] ${theme.ruleBg}`} />

              {/* 7. Suivre la lecture */}
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p
                    className={`m-0 text-[15px] leading-[22px] font-semibold ${theme.inkText}`}
                  >
                    Suivre la lecture
                  </p>
                  <p
                    className={`m-0 text-[13px] leading-[18px] ${theme.inkMutedText}`}
                  >
                    Fish Reader fait défiler l’écran au rythme de la voix.
                  </p>
                </div>
                <FrSwitch
                  checked={followReading}
                  onChange={setFollowReading}
                  label="Suivre la lecture"
                  theme={theme}
                />
              </div>

              {/* 8. Masquer la bulle */}
              <button
                type="button"
                onClick={() => setBubbleMode('hidden')}
                className={`w-full min-h-[48px] px-4 rounded-[8px] flex items-center justify-center gap-2 text-[14px] leading-[20px] font-semibold cursor-pointer ${theme.inkMutedText} hover:${theme.inkText}`}
              >
                <X className="w-[18px] h-[18px]" strokeWidth={1.5} />
                <span>Masquer la bulle</span>
              </button>
            </div>
          </>
        )}

        {/* STATE 3: SCANNING PILL */}
        {bubbleMode === 'scan' && (
          <div
            role="status"
            className={`absolute z-30 left-1/2 bottom-3 -translate-x-1/2 w-[calc(100%-32px)] max-w-[360px] min-h-[64px] flex items-center gap-3 py-2 pr-2 pl-4 rounded-full border ${theme.paperBg} ${theme.ruleBorder}`}
          >
            <span
              aria-hidden="true"
              className={`w-[22px] h-[22px] rounded-full border-2 ${theme.ruleBorder} border-t-current ${theme.accentText} animate-spin shrink-0`}
            />
            <span className="flex flex-col min-w-0">
              <b
                className={`text-[14px] leading-[20px] font-semibold ${theme.inkText}`}
              >
                Lecture de l’écran…
              </b>
              <span
                className={`text-[13px] leading-[18px] truncate ${theme.inkMutedText}`}
              >
                Fish Reader repère le texte affiché
              </span>
            </span>
          </div>
        )}

        {/* STATE 4: PICK BAR (« Touchez la phrase où commencer ») */}
        {bubbleMode === 'pick' && (
          <div
            role="status"
            className={`absolute z-30 left-2 right-2 bottom-2 min-h-[56px] flex items-center justify-between gap-2 py-1 pr-1 pl-4 rounded-[14px] text-[14px] leading-[20px] font-semibold ${theme.inkBg} ${theme.paperText}`}
          >
            <span>Touchez la phrase où commencer</span>
            <button
              type="button"
              onClick={() => setBubbleMode('menu')}
              className="min-h-[44px] px-3 rounded-[8px] font-semibold cursor-pointer hover:underline"
            >
              Annuler
            </button>
          </div>
        )}

        {/* STATE 5A: READING — PILULE RÉDUITE (64 dp) */}
        {bubbleMode === 'reading' && !playerExpanded && (
          <div
            className={`absolute z-30 left-1/2 bottom-3 -translate-x-1/2 w-[calc(100%-32px)] max-w-[360px] min-h-[64px] flex items-center gap-3 py-2 pr-2 pl-4 rounded-full border ${theme.paperBg} ${theme.ruleBorder}`}
          >
            <button
              type="button"
              aria-label="Ouvrir le lecteur"
              onClick={() => setPlayerExpanded(true)}
              className="flex-1 min-w-0 min-h-[48px] flex items-center gap-3 p-0 border-0 bg-transparent text-left cursor-pointer rounded-full"
            >
              <FrLiveWave playing={isPlaying} theme={theme} />
              <span className="flex flex-col min-w-0">
                <b
                  className={`text-[14px] leading-[20px] font-semibold ${theme.inkText}`}
                >
                  {isPlaying ? `${currentVoice.name} lit` : 'En pause'}
                </b>
                <span
                  className={`text-[13px] leading-[18px] tabular-nums truncate ${theme.inkMutedText}`}
                >
                  {`Phrase ${Math.max(1, activeSentenceIdx + 1)} sur ${
                    activeSentences.length
                  } · ${fmtSpeed(speed)}`}
                </span>
              </span>
            </button>

            <button
              type="button"
              aria-label={isPlaying ? 'Pause' : 'Reprendre'}
              onClick={handleTogglePlay}
              className={`w-[48px] h-[48px] rounded-full border-0 grid place-items-center cursor-pointer shrink-0 active:translate-y-[1px] ${theme.accentBg} ${theme.onAccentText}`}
            >
              {isPlaying ? (
                <Pause className="w-[22px] h-[22px]" strokeWidth={1.5} />
              ) : (
                <Play className="w-[22px] h-[22px]" strokeWidth={1.5} />
              )}
            </button>

            <button
              type="button"
              aria-label="Arrêter la lecture"
              onClick={handleStopBubbleReading}
              className={`w-[44px] h-[44px] rounded-full border grid place-items-center cursor-pointer shrink-0 active:translate-y-[1px] ${theme.ruleBorder} ${theme.inkText} hover:${theme.inkMutedBorder}`}
            >
              <StopSquareIcon />
            </button>
          </div>
        )}

        {/* STATE 5B: READING — LECTEUR DÉPLIÉ (BubblePlayer) */}
        {bubbleMode === 'reading' && playerExpanded && (
          <div
            role="region"
            aria-label="Lecteur Fish Reader"
            className={`absolute z-30 left-2 right-2 bottom-2 flex flex-col gap-2 p-3 rounded-[14px] border ${theme.paperBg} ${theme.ruleBorder}`}
          >
            {/* 1. En-tête */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                title="Toucher pour changer de voix"
                onClick={() => {
                  const idx = FR_VOICES.findIndex((v) => v.id === voiceId);
                  const nextVoice = FR_VOICES[(idx + 1) % FR_VOICES.length];
                  handleSelectVoice(nextVoice.id);
                }}
                className={`w-9 h-9 rounded-full grid place-items-center shrink-0 font-[family-name:var(--font-serif)] font-semibold text-[14px] cursor-pointer ${theme.highlightBg} ${theme.inkText}`}
              >
                {currentVoice.name[0]}
              </button>
              <div className="flex-1 min-w-0">
                <p
                  className={`m-0 text-[14px] leading-[20px] font-semibold ${theme.inkText}`}
                >
                  {isSynthesizingNeural
                    ? `Synthèse studio 24${NBS}kHz (${currentVoice.name})…`
                    : isPlaying
                      ? `${currentVoice.name} lit cet écran`
                      : 'Lecture en pause'}
                </p>
                <p
                  className={`m-0 text-[13px] leading-[18px] tabular-nums ${theme.inkMutedText}`}
                >
                  {`Phrase ${Math.max(1, activeSentenceIdx + 1)} sur ${
                    activeSentences.length
                  } · Studio 24${NBS}kHz`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPlayerExpanded(false)}
                className={`min-h-[44px] px-3 rounded-[8px] text-[14px] leading-[20px] font-semibold cursor-pointer ${theme.inkMutedText} hover:${theme.inkText}`}
              >
                Réduire
              </button>
            </div>

            {/* 2. Barre de progression 3 dp + temps */}
            <div
              className={`h-[3px] rounded-full overflow-hidden ${theme.ruleBg}`}
            >
              <span
                className={`block h-full transition-all duration-300 ${
                  theme.accentBg
                } ${getProgressWidthClass(progressPct)}`}
              />
            </div>
            <div
              className={`flex justify-between -mt-1 text-[12px] leading-[16px] tabular-nums ${theme.inkMutedText}`}
            >
              <span>{fmtTime(elapsedSec)}</span>
              <span>{fmtTime(durationSec)}</span>
            </div>

            {/* 3. Transport (1fr auto 1fr) */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <button
                type="button"
                onClick={() => handleBubblePlayerSkip(false)}
                className={`min-h-[56px] rounded-full border flex items-center justify-center gap-1.5 text-[14px] leading-[20px] font-semibold tabular-nums cursor-pointer active:translate-y-[1px] ${theme.paperRaisedBg} ${theme.ruleBorder} ${theme.inkText} hover:${theme.inkMutedBorder}`}
              >
                <Rewind className="w-[22px] h-[22px]" strokeWidth={1.5} />
                <span>{skipButtonText('−')}</span>
              </button>

              <button
                type="button"
                aria-label={isPlaying ? 'Pause' : 'Reprendre'}
                onClick={handleTogglePlay}
                className={`w-[64px] h-[64px] rounded-full border-0 grid place-items-center cursor-pointer active:translate-y-[1px] ${theme.accentBg} ${theme.onAccentText}`}
              >
                {isPlaying ? (
                  <Pause className="w-[26px] h-[26px]" strokeWidth={1.5} />
                ) : (
                  <Play className="w-[26px] h-[26px]" strokeWidth={1.5} />
                )}
              </button>

              <button
                type="button"
                onClick={() => handleBubblePlayerSkip(true)}
                className={`min-h-[56px] rounded-full border flex items-center justify-center gap-1.5 text-[14px] leading-[20px] font-semibold tabular-nums cursor-pointer active:translate-y-[1px] ${theme.paperRaisedBg} ${theme.ruleBorder} ${theme.inkText} hover:${theme.inkMutedBorder}`}
              >
                <FastForward className="w-[22px] h-[22px]" strokeWidth={1.5} />
                <span>{skipButtonText('+')}</span>
              </button>
            </div>

            {/* 4. Rangée Vitesse · Sauts ±15 s · Arrêter */}
            <div className="grid grid-cols-[64px_1fr_auto] gap-2">
              <button
                type="button"
                onClick={() => {
                  const next =
                    SPEEDS.find((s) => s > speed + 0.001) || SPEEDS[0];
                  handleSpeedUpdate(next);
                }}
                className={`min-h-[44px] px-2.5 rounded-[8px] border text-[14px] leading-[20px] font-semibold tabular-nums cursor-pointer active:translate-y-[1px] ${theme.paperRaisedBg} ${theme.inkMutedBorder} ${theme.inkText}`}
              >
                {fmtSpeed(speed)}
              </button>

              <button
                type="button"
                aria-expanded={showSkipSettings}
                onClick={() => setShowSkipSettings((v) => !v)}
                className={`min-h-[44px] px-3 rounded-[8px] border flex items-center justify-between gap-2 text-[13px] leading-[18px] font-semibold cursor-pointer active:translate-y-[1px] ${theme.paperRaisedBg} ${theme.inkMutedBorder} ${theme.inkMutedText}`}
              >
                <span>Sauts</span>
                <b className={`tabular-nums font-semibold ${theme.inkText}`}>
                  {skipButtonText('±')}
                </b>
              </button>

              <button
                type="button"
                onClick={handleStopBubbleReading}
                className={`min-h-[44px] px-3.5 rounded-[8px] border flex items-center gap-1.5 text-[14px] leading-[20px] font-semibold cursor-pointer transition-colors duration-150 active:translate-y-[1px] bg-transparent ${theme.dangerBorder} ${theme.dangerText} ${theme.dangerBgHover}`}
              >
                <StopSquareIcon />
                <span>Arrêter</span>
              </button>
            </div>

            {/* 5. Réglage des sauts (repliable) */}
            {showSkipSettings && (
              <div
                className={`flex flex-col gap-2 p-3 rounded-[8px] border ${theme.paperRaisedBg} ${theme.ruleBorder}`}
              >
                <div
                  className={`text-[12px] leading-[18px] font-semibold uppercase tracking-[0.08em] ${theme.inkMutedText}`}
                >
                  <span>Avancer et reculer de</span>
                </div>

                <FrSegmented
                  label="Unité du saut"
                  value={skipPrefs.unit}
                  onChange={(u) => updateSkipPrefs({unit: u})}
                  theme={theme}
                  columnsClass="grid-cols-2"
                  options={[
                    {value: 'sec', label: 'Secondes'},
                    {value: 'sent', label: 'Phrases'},
                  ]}
                />

                <FrStepper
                  value={
                    skipPrefs.unit === 'sec' ? skipPrefs.sec : skipPrefs.sent
                  }
                  min={SKIP_LIMITS[skipPrefs.unit][0]}
                  max={SKIP_LIMITS[skipPrefs.unit][1]}
                  step={SKIP_LIMITS[skipPrefs.unit][2]}
                  unit={
                    skipPrefs.unit === 'sec'
                      ? `${NBS}s`
                      : skipPrefs.sent > 1
                        ? `${NBS}phrases`
                        : `${NBS}phrase`
                  }
                  onChange={(val) =>
                    updateSkipPrefs(
                      skipPrefs.unit === 'sec' ? {sec: val} : {sent: val}
                    )
                  }
                  label="Durée du saut"
                  theme={theme}
                />

                <div className="grid grid-cols-4 gap-2">
                  {(skipPrefs.unit === 'sec'
                    ? [5, 10, 15, 30]
                    : [1, 2, 3, 5]
                  ).map((n) => {
                    const currentVal =
                      skipPrefs.unit === 'sec' ? skipPrefs.sec : skipPrefs.sent;
                    return (
                      <FrChip
                        key={n}
                        selected={currentVal === n}
                        onClick={() =>
                          updateSkipPrefs(
                            skipPrefs.unit === 'sec' ? {sec: n} : {sent: n}
                          )
                        }
                        theme={theme}
                      >
                        {skipPrefs.unit === 'sec' ? `${n}${NBS}s` : `${n}`}
                      </FrChip>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 6. Choisir un autre endroit */}
            <button
              type="button"
              onClick={() => {
                stopAudioPlayback();
                setIsPlaying(false);
                setActiveSentenceIdx(-1);
                setBubbleMode('pick');
              }}
              className={`w-full min-h-[44px] px-3 rounded-[8px] flex items-center justify-center gap-2 text-[14px] leading-[20px] font-semibold cursor-pointer ${theme.inkMutedText} hover:${theme.inkText}`}
            >
              <Bookmark className="w-[18px] h-[18px]" strokeWidth={1.5} />
              <span>Choisir un autre endroit</span>
            </button>
          </div>
        )}

        {/* STATE 6: HIDDEN TOAST */}
        {bubbleMode === 'hidden' && (
          <div
            role="status"
            className={`absolute z-30 left-2 right-2 bottom-2 flex items-center justify-between gap-2 py-2 pr-1 pl-4 rounded-[14px] text-[14px] leading-[20px] ${theme.inkBg} ${theme.paperText}`}
          >
            <span>
              La bulle est masquée. Rouvrez Fish Reader pour l’afficher.
            </span>
            <button
              type="button"
              onClick={() => setBubbleMode('idle')}
              className="min-h-[44px] px-3 rounded-[8px] font-semibold cursor-pointer shrink-0 hover:underline"
            >
              Annuler
            </button>
          </div>
        )}
      </div>
  );

  // ==================== RENDER COMPANION MOBILE APP (fr-mobile-screens.jsx) ====================
  let readerSentCounter = 0;

  const companionAppNode = (
      <div
        className={`relative flex-1 min-h-0 flex flex-col overflow-hidden ${theme.paperBg} ${theme.inkText}`}
      >
        {/* ==================== TAB 1: ACCUEIL (HomeScreen) ==================== */}
        {tab === 'home' && (
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
            {/* MHeader 52 dp */}
            <header
              className={`h-[52px] px-4 flex items-center justify-between border-b shrink-0 ${theme.paperBg} ${theme.ruleBorder}`}
            >
              <h1
                className={`m-0 font-[family-name:var(--font-serif)] font-semibold text-[20px] leading-[24px] ${theme.inkText}`}
              >
                Fish Reader
              </h1>
              <button
                type="button"
                onClick={() => setPermissionsSheetOpen(true)}
                className={`min-h-[44px] px-2.5 rounded-[8px] flex items-center gap-1.5 text-[13px] font-semibold cursor-pointer ${theme.inkMutedText} hover:${theme.inkText}`}
              >
                <ShieldCheck className="w-4 h-4" strokeWidth={1.5} />
                <span>
                  {permOverlayGranted && permAccessGranted
                    ? 'Autorisé'
                    : 'Autorisations'}
                </span>
              </button>
            </header>

            <div className="flex-1 flex flex-col justify-between gap-4 p-4">
              {/* Top Greeting + Search + Récents */}
              <div className="space-y-3">
                <div>
                  <h2
                    className={`m-0 font-[family-name:var(--font-serif)] font-semibold text-[26px] leading-[32px] tracking-[-0.01em] ${theme.inkText}`}
                  >
                    Bon retour, Armel
                  </h2>
                  <p
                    className={`m-0 mt-1 text-[15px] leading-[22px] ${theme.inkMutedText}`}
                  >
                    Reprenez là où vous vous êtes arrêté.
                  </p>
                </div>

                {/* Search bar (.fr-search from components.css) */}
                <div
                  className={`flex items-center gap-2 min-h-[42px] px-3 rounded-[8px] border ${theme.paperRaisedBg} ${theme.inkMutedBorder}`}
                >
                  <Search
                    className={`w-4 h-4 shrink-0 ${theme.inkMutedText}`}
                    strokeWidth={1.5}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher un document ou un extrait…"
                    className={`flex-1 border-0 bg-transparent text-[15px] leading-[22px] outline-none ${theme.inkText}`}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      aria-label="Effacer la recherche"
                      onClick={() => setSearchQuery('')}
                      className={`w-7 h-7 grid place-items-center cursor-pointer ${theme.inkMutedText}`}
                    >
                      <X className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  )}
                </div>

                {/* SectionLabel: RÉCENTS */}
                <div className="space-y-2 pt-1">
                  <div
                    className={`text-[12px] leading-[18px] font-semibold uppercase tracking-[0.08em] ${theme.inkMutedText}`}
                  >
                    Récents
                  </div>

                  <div
                    role="list"
                    className={`rounded-[14px] border overflow-hidden divide-y ${theme.paperRaisedBg} ${theme.ruleBorder}`}
                  >
                    {filteredDocs.slice(0, 4).map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        role="listitem"
                        onClick={() => handleOpenDoc(d)}
                        className={`w-full min-h-[64px] py-3 px-4 border-0 bg-transparent grid grid-cols-[1fr_auto] items-center gap-3 text-left cursor-pointer transition-colors duration-150 hover:${theme.paperBg}`}
                      >
                        <span className="min-w-0 flex flex-col gap-0.5">
                          <span
                            className={`text-[15px] leading-[22px] font-semibold truncate ${theme.inkText}`}
                          >
                            {d.title}
                          </span>
                          <span
                            className={`text-[13px] leading-[18px] tabular-nums ${theme.inkMutedText}`}
                          >
                            {d.id === currentDocId ? 'En cours' : d.when}
                            {d.progress ? ` · ${d.progress}${NBS}%` : ''}
                          </span>
                        </span>

                        <span
                          aria-hidden="true"
                          className={`w-[56px] h-[4px] rounded-full overflow-hidden ${theme.ruleBg}`}
                        >
                          <span
                            className={`block h-full ${
                              theme.accentBg
                            } ${getProgressWidthClass(d.progress || 0)}`}
                          />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Thumb-Zone Card: Réglages rapides */}
              <section
                aria-label="Réglages rapides"
                className={`rounded-[14px] border p-4 flex flex-col gap-3 ${theme.paperRaisedBg} ${theme.ruleBorder}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className={`m-0 text-[15px] leading-[22px] font-semibold ${theme.inkText}`}
                    >
                      Bulle de lecture
                    </p>
                    <p
                      className={`m-0 mt-0.5 flex items-center gap-2 flex-wrap text-[13px] leading-[18px] ${theme.inkMutedText}`}
                    >
                      <span
                        className={`px-2 py-0.5 rounded-[4px] text-[12px] font-semibold ${
                          bubbleOn
                            ? `${theme.accentBg} ${theme.onAccentText}`
                            : `${theme.paperBg} ${theme.inkMutedText} border ${theme.ruleBorder}`
                        }`}
                      >
                        {bubbleOn ? 'Active' : 'En pause'}
                      </span>
                      <span>
                        {bubbleOn
                          ? 'Affichée sur toutes vos applications'
                          : 'Masquée sur les autres applications'}
                      </span>
                    </p>
                  </div>
                  <FrSwitch
                    checked={bubbleOn}
                    onChange={setBubbleOn}
                    label="Bulle de lecture"
                    theme={theme}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setBubbleOn(true);
                    setBubbleMode('idle');
                    setPrototypeMode('bubble');
                  }}
                  className={`w-full min-h-[48px] px-4 rounded-[8px] border flex items-center justify-center gap-2 text-[14px] leading-[20px] font-semibold cursor-pointer active:translate-y-[1px] ${theme.paperBg} ${theme.inkMutedBorder} ${theme.inkText}`}
                >
                  <VolumeStrokeIcon size={18} />
                  <span>Voir la bulle en action</span>
                </button>

                <div className={`h-[1px] ${theme.ruleBg}`} />

                {/* Vitesse 5 paliers */}
                <div className="space-y-1.5">
                  <div
                    className={`flex items-center justify-between text-[12px] leading-[18px] font-semibold uppercase tracking-[0.08em] ${theme.inkMutedText}`}
                  >
                    <span>Vitesse</span>
                    <span className={`tabular-nums ${theme.inkText}`}>
                      {fmtSpeed(speed)}
                    </span>
                  </div>
                  <FrSegmented
                    label="Vitesse de lecture"
                    value={speed}
                    onChange={handleSpeedUpdate}
                    theme={theme}
                    options={SPEEDS.map((s) => ({
                      value: s,
                      label: fmtSpeed(s),
                    }))}
                  />
                </div>

                {/* Voix */}
                <div className="space-y-1.5">
                  <div
                    className={`text-[12px] leading-[18px] font-semibold uppercase tracking-[0.08em] ${theme.inkMutedText}`}
                  >
                    <span>Voix</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {FR_VOICES.map((v) => (
                      <FrChip
                        key={v.id}
                        selected={voiceId === v.id}
                        onClick={() => setVoiceId(v.id)}
                        theme={theme}
                      >
                        {v.name}
                      </FrChip>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: LISEUSE (ReaderScreen) ==================== */}
        {tab === 'reader' && (
          <div
            ref={readerScrollRef}
            className="flex-1 min-h-0 overflow-y-auto flex flex-col"
          >
            {/* Top action bar */}
            <div
              className={`flex items-center justify-between gap-2 px-4 py-2.5 border-b ${theme.ruleBorder}`}
            >
              <button
                type="button"
                onClick={() => setPasteSheetOpen(true)}
                className={`min-h-[44px] px-3.5 rounded-[8px] border flex items-center gap-2 text-[14px] leading-[20px] font-semibold cursor-pointer active:translate-y-[1px] ${theme.paperRaisedBg} ${theme.inkMutedBorder} ${theme.inkText}`}
              >
                <Plus className="w-[18px] h-[18px]" strokeWidth={1.5} />
                <span>Nouveau texte</span>
              </button>

              {/* Adjustable reading font size (16-24 px) */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="Réduire la taille du texte"
                  disabled={readSize <= 16}
                  onClick={() => setReadSize((s) => Math.max(16, s - 1))}
                  className={`min-w-[44px] min-h-[44px] rounded-[8px] border font-[family-name:var(--font-serif)] text-[14px] font-semibold cursor-pointer disabled:opacity-50 ${theme.paperRaisedBg} ${theme.ruleBorder} ${theme.inkText}`}
                >
                  A−
                </button>
                <button
                  type="button"
                  aria-label="Augmenter la taille du texte"
                  disabled={readSize >= 24}
                  onClick={() => setReadSize((s) => Math.min(24, s + 1))}
                  className={`min-w-[44px] min-h-[44px] rounded-[8px] border font-[family-name:var(--font-serif)] text-[16px] font-semibold cursor-pointer disabled:opacity-50 ${theme.paperRaisedBg} ${theme.ruleBorder} ${theme.inkText}`}
                >
                  A+
                </button>
              </div>
            </div>

            {/* ReaderText column */}
            <div className="px-5 pt-4 pb-6">
              <p
                className={`m-0 mb-2 text-[12px] leading-[18px] font-semibold uppercase tracking-[0.08em] ${theme.accentText}`}
              >
                {currentDoc.kicker}
              </p>
              <h2
                className={`m-0 mb-4 font-[family-name:var(--font-serif)] font-semibold text-[26px] leading-[32px] text-balance ${theme.inkText}`}
              >
                {currentDoc.title}
              </h2>

              {currentDoc.paragraphs.map((para, pi) => (
                <p
                  key={pi}
                  className={`m-0 mb-5 font-[family-name:var(--font-serif)] ${getReadingSizeClass(
                    readSize
                  )}`}
                >
                  {para.map((sent) => {
                    const idx = readerSentCounter++;
                    const isAct = idx === activeSentenceIdx;
                    const isRead =
                      activeSentenceIdx >= 0 && idx < activeSentenceIdx;
                    return (
                      <React.Fragment key={idx}>
                        <span
                          data-reader-sent={idx}
                          onClick={() => handleSeekSentence(idx)}
                          className={`rounded-[4px] cursor-pointer transition-colors duration-250 ${
                            isAct
                              ? `${theme.highlightBg} ${theme.inkText} ${theme.highlightRing}`
                              : isRead
                                ? theme.inkMutedText
                                : `${theme.inkText} hover:underline hover:decoration-[#E2D8C6] hover:underline-offset-4`
                          }`}
                        >
                          {sent}
                        </span>{' '}
                      </React.Fragment>
                    );
                  })}
                </p>
              ))}

              {activeSentenceIdx < 0 && !isPlaying && (
                <p
                  className={`mt-2 font-[family-name:var(--font-serif)] italic text-[14px] leading-[20px] ${theme.inkMutedText}`}
                >
                  Touchez une phrase pour lancer la lecture à cet endroit.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB 3: VOIX ET VITESSE (VoicesScreen) ==================== */}
        {tab === 'voices' && (
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
            <header
              className={`h-[52px] px-4 flex items-center justify-between border-b shrink-0 ${theme.paperBg} ${theme.ruleBorder}`}
            >
              <h1
                className={`m-0 font-[family-name:var(--font-serif)] font-semibold text-[20px] leading-[24px] ${theme.inkText}`}
              >
                Voix et vitesse
              </h1>
            </header>

            <div className="p-4 flex flex-col gap-3">
              <p
                className={`m-0 text-[15px] leading-[22px] ${theme.inkMutedText}`}
              >
                Choisissez la voix qui lira vos textes. Touchez le bouton
                d’écoute pour entendre un extrait.
              </p>

              {/* 3 VoiceCards */}
              {FR_VOICES.map((v) => (
                <FrVoiceCard
                  key={v.id}
                  voice={v}
                  selected={voiceId === v.id}
                  sampling={samplingVoiceId === v.id}
                  onSelect={() => handleSelectVoice(v.id)}
                  onSample={() => handleSampleVoice(v)}
                  theme={theme}
                />
              ))}

              {/* Vitesse de lecture card */}
              <section
                aria-label="Vitesse"
                className={`rounded-[14px] border p-4 flex flex-col gap-3 ${theme.paperRaisedBg} ${theme.ruleBorder}`}
              >
                <div
                  className={`text-[12px] leading-[18px] font-semibold uppercase tracking-[0.08em] ${theme.inkMutedText}`}
                >
                  <span>Vitesse de lecture</span>
                </div>

                <div
                  aria-live="polite"
                  className={`font-[family-name:var(--font-serif)] font-medium text-[44px] leading-none tracking-[-0.02em] tabular-nums ${theme.inkText}`}
                >
                  {fmtSpeed(speed)}
                </div>

                <input
                  type="range"
                  min={0.5}
                  max={2.0}
                  step={0.05}
                  value={speed}
                  aria-label="Vitesse de lecture"
                  aria-valuetext={fmtSpeed(speed)}
                  onChange={(e) =>
                    handleSpeedUpdate(parseFloat(e.target.value))
                  }
                  className="w-full h-[36px] cursor-pointer accent-[#1F5F63]"
                />

                <div className="grid grid-cols-5 gap-1">
                  {[0.75, 1, 1.25, 1.5, 2].map((s) => {
                    const active = Math.abs(speed - s) < 0.005;
                    return (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={active}
                        onClick={() => handleSpeedUpdate(s)}
                        className={`min-h-[44px] rounded-[8px] text-[13px] leading-[18px] font-semibold tabular-nums cursor-pointer transition-colors duration-150 ${
                          active
                            ? `${theme.inkText} ring-1 ring-inset ${
                                theme.id === 'nuit'
                                  ? 'ring-[#A89E8F]'
                                  : 'ring-[#6B6155]'
                              }`
                            : `${theme.inkMutedText} hover:${theme.paperBg} hover:${theme.inkText}`
                        }`}
                      >
                        {fmtSpeed(s)}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Timbre card */}
              <section
                aria-label="Timbre"
                className={`rounded-[14px] border p-4 flex flex-col gap-3 ${theme.paperRaisedBg} ${theme.ruleBorder}`}
              >
                <div
                  className={`text-[12px] leading-[18px] font-semibold uppercase tracking-[0.08em] ${theme.inkMutedText}`}
                >
                  <span>Timbre</span>
                </div>
                <FrSegmented
                  label="Timbre de la voix"
                  value={timbre}
                  onChange={handleTimbreUpdate}
                  theme={theme}
                  columnsClass="grid-cols-3"
                  options={[
                    {value: 'doux', label: 'Plus doux'},
                    {value: 'naturel', label: 'Naturel'},
                    {value: 'clair', label: 'Plus clair'},
                  ]}
                />
              </section>

              {/* Rythme des pauses de ponctuation (nouvelle fonctionnalité inspirée du design) */}
              <section
                aria-label="Respiration aux virgules et aux points"
                className={`rounded-[14px] border p-4 flex flex-col gap-3 ${theme.paperRaisedBg} ${theme.ruleBorder}`}
              >
                <div>
                  <div
                    className={`text-[12px] leading-[18px] font-semibold uppercase tracking-[0.08em] ${theme.inkMutedText}`}
                  >
                    <span>Pauses de ponctuation</span>
                  </div>
                  <p
                    className={`m-0 mt-1 text-[13px] leading-[18px] ${theme.inkMutedText}`}
                  >
                    Ajuste la durée des respirations entre les phrases.
                  </p>
                </div>
                <FrSegmented
                  label="Pauses de ponctuation"
                  value={pauseCadence}
                  onChange={setPauseCadence}
                  theme={theme}
                  columnsClass="grid-cols-3"
                  options={[
                    {value: 'courtes', label: 'Courtes'},
                    {value: 'naturelles', label: 'Naturelles'},
                    {value: 'marquees', label: 'Marquées'},
                  ]}
                />
              </section>
            </div>
          </div>
        )}

        {/* ==================== FIXED READER PLAYER BAR (60 dp above TabBar) ==================== */}
        {tab === 'reader' && (
          <div
            className={`border-t shrink-0 ${theme.paperRaisedBg} ${theme.ruleBorder}`}
          >
            <div
              role="progressbar"
              aria-label="Progression"
              aria-valuenow={Math.round(progressPct)}
              aria-valuemin={0}
              aria-valuemax={100}
              className={`h-[3px] overflow-hidden ${theme.ruleBg}`}
            >
              <span
                className={`block h-full transition-all duration-300 ${
                  theme.accentBg
                } ${getProgressWidthClass(progressPct)}`}
              />
            </div>

            <div className="h-[60px] px-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <span
                className={`text-[13px] leading-[18px] tabular-nums ${theme.inkMutedText}`}
              >
                {fmtTime(elapsedSec)}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Reculer de 15 secondes"
                  onClick={() => handleSkipSeconds(-15)}
                  className={`w-[44px] h-[44px] rounded-full grid place-items-center cursor-pointer active:translate-y-[1px] ${theme.inkText} hover:${theme.paperBg}`}
                >
                  <Rewind className="w-5 h-5" strokeWidth={1.5} />
                </button>

                <button
                  type="button"
                  aria-label={isPlaying ? 'Pause' : 'Lire'}
                  onClick={handleTogglePlay}
                  className={`w-[48px] h-[48px] rounded-full border-0 grid place-items-center cursor-pointer active:translate-y-[1px] ${theme.accentBg} ${theme.onAccentText}`}
                >
                  {isPlaying ? (
                    <Pause className="w-[22px] h-[22px]" strokeWidth={1.5} />
                  ) : (
                    <Play className="w-[22px] h-[22px]" strokeWidth={1.5} />
                  )}
                </button>

                <button
                  type="button"
                  aria-label="Phrase suivante"
                  onClick={() => handleSkipSentences(1)}
                  className={`w-[44px] h-[44px] rounded-full grid place-items-center cursor-pointer active:translate-y-[1px] ${theme.inkText} hover:${theme.paperBg}`}
                >
                  <FastForward className="w-5 h-5" strokeWidth={1.5} />
                </button>
              </div>

              <button
                type="button"
                aria-label={`Vitesse ${fmtSpeed(speed)}, toucher pour changer`}
                onClick={() => {
                  const next =
                    SPEEDS.find((s) => s > speed + 0.001) || SPEEDS[0];
                  handleSpeedUpdate(next);
                }}
                className={`justify-self-end min-w-[56px] min-h-[44px] px-2.5 rounded-[8px] border text-[14px] leading-[20px] font-semibold tabular-nums cursor-pointer active:translate-y-[1px] ${theme.paperBg} ${theme.inkMutedBorder} ${theme.inkText}`}
              >
                {fmtSpeed(speed)}
              </button>
            </div>
          </div>
        )}

        {/* ==================== BOTTOM TAB BAR (60 dp) ==================== */}
        <nav
          aria-label="Navigation principale"
          className={`h-[60px] grid grid-cols-3 border-t shrink-0 ${theme.paperBg} ${theme.ruleBorder}`}
        >
          {(
            [
              ['home', 'Accueil', Home],
              ['reader', 'Liseuse', BookOpen],
              ['voices', 'Voix', Volume2],
            ] as const
          ).map(([id, label, IconComp]) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => setTab(id)}
                className={`border-0 bg-transparent flex flex-col items-center justify-center gap-0.5 text-[12px] leading-[16px] font-semibold cursor-pointer ${
                  active ? theme.inkText : theme.inkMutedText
                }`}
              >
                <span
                  className={`w-[56px] h-[28px] rounded-full grid place-items-center transition-colors duration-150 ${
                    active
                      ? `${theme.paperRaisedBg} ${theme.accentText} ring-1 ring-inset ${
                          theme.id === 'nuit'
                            ? 'ring-[#3A352E]'
                            : theme.id === 'sepia'
                              ? 'ring-[#D9C7A6]'
                              : 'ring-[#E2D8C6]'
                        }`
                      : ''
                  }`}
                >
                  <IconComp className="w-5 h-5" strokeWidth={1.5} />
                </span>
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* ==================== MODAL SHEET 1: NOUVEAU TEXTE (PasteSheet) ==================== */}
        {pasteSheetOpen && (
          <div
            role="dialog"
            aria-label="Nouveau texte"
            className={`absolute inset-0 z-30 flex flex-col ${theme.paperBg} ${theme.inkText}`}
          >
            <header
              className={`h-[52px] px-4 flex items-center justify-between border-b shrink-0 ${theme.ruleBorder}`}
            >
              <h1
                className={`m-0 font-[family-name:var(--font-serif)] font-semibold text-[20px] leading-[24px] ${theme.inkText}`}
              >
                Nouveau texte
              </h1>
              <button
                type="button"
                aria-label="Fermer"
                onClick={() => setPasteSheetOpen(false)}
                className={`w-[44px] h-[44px] rounded-full grid place-items-center cursor-pointer ${theme.inkMutedText} hover:${theme.inkText}`}
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </header>

            <div className="flex-1 min-h-0 p-4 flex flex-col gap-2">
              <label
                htmlFor="fr-paste-ta"
                className={`flex items-center justify-between text-[12px] leading-[18px] font-semibold uppercase tracking-[0.08em] ${theme.inkMutedText}`}
              >
                <span>Votre texte ou article</span>
                <span className={`tabular-nums ${theme.inkText}`}>
                  {pasteText.trim()
                    ? pasteText.trim().split(/\s+/).length
                    : 0}{' '}
                  mots
                </span>
              </label>

              <textarea
                id="fr-paste-ta"
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Collez ici un courriel, un article ou n’importe quel texte."
                className={`flex-1 w-full p-3.5 rounded-[14px] border resize-none font-[family-name:var(--font-serif)] text-[17px] leading-[27px] outline-none ${theme.paperRaisedBg} ${theme.inkMutedBorder} ${theme.inkText}`}
              />

              {pasteError && (
                <p
                  role="alert"
                  className={`m-0 text-[13px] leading-[18px] ${theme.dangerText}`}
                >
                  {pasteError}
                </p>
              )}
            </div>

            <div
              className={`p-4 border-t flex flex-col gap-2.5 ${theme.paperRaisedBg} ${theme.ruleBorder}`}
            >
              {!pasteText.trim() && (
                <p
                  className={`m-0 text-[13px] leading-[18px] ${theme.inkMutedText}`}
                >
                  Collez ou saisissez un texte pour commencer.
                </p>
              )}

              <button
                type="button"
                onClick={handleClipboardPaste}
                className={`w-full min-h-[48px] px-4 rounded-[8px] border flex items-center justify-center gap-2 text-[14px] leading-[20px] font-semibold cursor-pointer active:translate-y-[1px] ${theme.paperBg} ${theme.inkMutedBorder} ${theme.inkText}`}
              >
                <Copy className="w-[18px] h-[18px]" strokeWidth={1.5} />
                <span>Coller depuis le presse-papiers</span>
              </button>

              <button
                type="button"
                disabled={!pasteText.trim()}
                onClick={handleReadPastedText}
                className={`w-full min-h-[48px] px-4 rounded-[8px] flex items-center justify-center gap-2 text-[14px] leading-[20px] font-semibold cursor-pointer active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed ${theme.accentBg} ${theme.onAccentText}`}
              >
                <Play className="w-[18px] h-[18px]" strokeWidth={1.5} />
                <span>Lire ce texte</span>
              </button>
            </div>
          </div>
        )}

        {/* ==================== MODAL SHEET 2: PARCOURS D'AUTORISATION SIMPLE (PROMPT_AI_STUDIO #8) ==================== */}
        {permissionsSheetOpen && (
          <div
            role="dialog"
            aria-label="Autorisations de Fish Reader"
            className={`absolute inset-0 z-30 flex flex-col ${theme.paperBg} ${theme.inkText}`}
          >
            <header
              className={`h-[52px] px-4 flex items-center justify-between border-b shrink-0 ${theme.ruleBorder}`}
            >
              <h1
                className={`m-0 font-[family-name:var(--font-serif)] font-semibold text-[20px] leading-[24px] ${theme.inkText}`}
              >
                Mise en route
              </h1>
              <button
                type="button"
                aria-label="Fermer"
                onClick={() => setPermissionsSheetOpen(false)}
                className={`w-[44px] h-[44px] rounded-full grid place-items-center cursor-pointer ${theme.inkMutedText} hover:${theme.inkText}`}
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              <div>
                <h2
                  className={`m-0 font-[family-name:var(--font-serif)] font-semibold text-[24px] leading-[30px] ${theme.inkText}`}
                >
                  Deux réglages simples pour lire vos écrans
                </h2>
                <p
                  className={`m-0 mt-1 text-[15px] leading-[22px] ${theme.inkMutedText}`}
                >
                  Fish Reader fonctionne entièrement sur votre téléphone. Aucun
                  texte n’est envoyé sur Internet.
                </p>
              </div>

              {/* Step 1: Superposition */}
              <div
                className={`rounded-[14px] border p-4 flex flex-col gap-3 ${theme.paperRaisedBg} ${theme.ruleBorder}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div
                      className={`text-[12px] leading-[18px] font-semibold uppercase tracking-[0.08em] ${theme.accentText}`}
                    >
                      1. Bulle flottante
                    </div>
                    <h3
                      className={`m-0 mt-0.5 font-[family-name:var(--font-serif)] font-semibold text-[18px] leading-[24px] ${theme.inkText}`}
                    >
                      Afficher par-dessus vos applications
                    </h3>
                  </div>
                  <FrSwitch
                    checked={permOverlayGranted}
                    onChange={setPermOverlayGranted}
                    label="Afficher par-dessus vos applications"
                    theme={theme}
                  />
                </div>
                <p
                  className={`m-0 text-[14px] leading-[20px] ${theme.inkMutedText}`}
                >
                  Permet à la bulle de rester accessible au bord de l’écran
                  pendant que vous consultez vos courriels ou le journal.
                </p>
              </div>

              {/* Step 2: Lecture de l'écran */}
              <div
                className={`rounded-[14px] border p-4 flex flex-col gap-3 ${theme.paperRaisedBg} ${theme.ruleBorder}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div
                      className={`text-[12px] leading-[18px] font-semibold uppercase tracking-[0.08em] ${theme.accentText}`}
                    >
                      2. Lecture de l’écran
                    </div>
                    <h3
                      className={`m-0 mt-0.5 font-[family-name:var(--font-serif)] font-semibold text-[18px] leading-[24px] ${theme.inkText}`}
                    >
                      Repérer les phrases affichées
                    </h3>
                  </div>
                  <FrSwitch
                    checked={permAccessGranted}
                    onChange={setPermAccessGranted}
                    label="Repérer les phrases affichées"
                    theme={theme}
                  />
                </div>
                <p
                  className={`m-0 text-[14px] leading-[20px] ${theme.inkMutedText}`}
                >
                  Permet à Fish Reader de lire les paragraphes visibles dès que
                  vous touchez «{NB}Lire cet écran{NB}» et de surligner la
                  phrase prononcée.
                </p>
              </div>
            </div>

            <div
              className={`p-4 border-t ${theme.paperRaisedBg} ${theme.ruleBorder}`}
            >
              <button
                type="button"
                onClick={() => {
                  setPermOverlayGranted(true);
                  setPermAccessGranted(true);
                  setBubbleOn(true);
                  setPermissionsSheetOpen(false);
                }}
                className={`w-full min-h-[48px] px-4 rounded-[8px] flex items-center justify-center gap-2 text-[14px] leading-[20px] font-semibold cursor-pointer active:translate-y-[1px] ${theme.accentBg} ${theme.onAccentText}`}
              >
                <Check className="w-[18px] h-[18px]" strokeWidth={1.5} />
                <span>Terminer et revenir à l’accueil</span>
              </button>
            </div>
          </div>
        )}
      </div>
  );

  // ==================== FULLSCREEN MOBILE VIEW ====================
  if (isFullscreenMobile) {
    return (
      <div
        className={`fixed inset-0 z-50 flex flex-col ${theme.paperBg} ${theme.inkText}`}
      >
        <div
          className={`h-[44px] px-4 flex items-center justify-between border-b text-[13px] ${theme.paperRaisedBg} ${theme.ruleBorder}`}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPrototypeMode('companion')}
              className={`px-2.5 py-1 rounded-[6px] font-semibold cursor-pointer ${
                prototypeMode === 'companion'
                  ? `${theme.accentBg} ${theme.onAccentText}`
                  : theme.inkMutedText
              }`}
            >
              Application compagnon
            </button>
            <button
              type="button"
              onClick={() => setPrototypeMode('bubble')}
              className={`px-2.5 py-1 rounded-[6px] font-semibold cursor-pointer ${
                prototypeMode === 'bubble'
                  ? `${theme.accentBg} ${theme.onAccentText}`
                  : theme.inkMutedText
              }`}
            >
              Bulle flottante
            </button>
          </div>
          <button
            type="button"
            onClick={() => setIsFullscreenMobile(false)}
            className={`min-h-[36px] px-2.5 rounded-[6px] flex items-center gap-1.5 font-semibold cursor-pointer ${theme.inkText}`}
          >
            <Minimize2 className="w-4 h-4" strokeWidth={1.5} />
            <span>Quitter le plein écran</span>
          </button>
        </div>
        {prototypeMode === 'bubble' ? bubbleOverlayNode : companionAppNode}
      </div>
    );
  }

  // ==================== DESKTOP SPLIT LAYOUT: ANDROID FRAME + TWEAKS & STATS ====================
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left / Center Column: Authentic Android Device Frame (from android-frame.jsx) */}
      <div className="lg:col-span-6 flex flex-col items-center">
        {/* Prototype Mode Switcher above device */}
        <div className="w-full max-w-[430px] mb-4 flex items-center justify-between gap-2">
          <div
            className={`grid grid-cols-2 p-[3px] gap-[2px] rounded-[8px] border flex-1 ${theme.paperBg} ${theme.ruleBorder}`}
          >
            <button
              type="button"
              aria-pressed={prototypeMode === 'companion'}
              onClick={() => setPrototypeMode('companion')}
              className={`min-h-[40px] px-3 rounded-[6px] text-[13px] font-semibold cursor-pointer transition-colors ${
                prototypeMode === 'companion'
                  ? theme.segActive
                  : `${theme.inkMutedText} hover:${theme.inkText}`
              }`}
            >
              1. Application compagnon
            </button>
            <button
              type="button"
              aria-pressed={prototypeMode === 'bubble'}
              onClick={() => setPrototypeMode('bubble')}
              className={`min-h-[40px] px-3 rounded-[6px] text-[13px] font-semibold cursor-pointer transition-colors ${
                prototypeMode === 'bubble'
                  ? theme.segActive
                  : `${theme.inkMutedText} hover:${theme.inkText}`
              }`}
            >
              2. Bulle flottante (6 états)
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsFullscreenMobile(true)}
            title="Plein écran mobile"
            className={`min-w-[44px] min-h-[44px] rounded-[8px] border grid place-items-center cursor-pointer ${theme.paperRaisedBg} ${theme.ruleBorder} ${theme.inkText}`}
          >
            <Maximize2 className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Android Device Shell matching android-frame.jsx */}
        <div className="p-[10px] rounded-[42px] bg-[#1D1B18] border border-white/10">
          <div
            className={`${deviceWidthClass} max-w-full h-[820px] rounded-[32px] overflow-hidden flex flex-col relative ${
              prototypeMode === 'bubble' ? theme.paperRaisedBg : theme.paperBg
            }`}
          >
            {/* Android Status Bar (28 px) */}
            <div
              className={`h-[28px] px-[22px] pt-[4px] flex items-center justify-between text-[12px] font-semibold tabular-nums select-none relative shrink-0 ${theme.inkText}`}
            >
              <span>9:41</span>
              <span
                aria-hidden="true"
                className="w-[10px] h-[10px] rounded-full bg-[#11100E] absolute left-1/2 top-[8px] -translate-x-1/2"
              />
              <span className="text-[11px] tracking-wider">5G · 100%</span>
            </div>

            {/* Screen Body */}
            <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
              {prototypeMode === 'bubble' ? bubbleOverlayNode : companionAppNode}
            </div>

            {/* Android Gesture Bar (20 px) */}
            <div className="h-[20px] grid place-items-center shrink-0">
              <span
                className={`w-[108px] h-[4px] rounded-full opacity-35 ${theme.inkBg}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Interactive Tweaks Panel, Bubble State Inspector & Stats (from tweaks-panel.jsx & components.css) */}
      <div className="lg:col-span-6 flex flex-col gap-6">
        {/* Card 1: Réglages de la Maquette (Tweaks Panel from tweaks-panel.jsx) */}
        <section
          aria-label="Réglages du prototype"
          className={`rounded-[14px] border p-6 flex flex-col gap-4 ${theme.paperRaisedBg} ${theme.ruleBorder}`}
        >
          <div className="flex items-center justify-between gap-2 border-b pb-3 border-inherit">
            <div>
              <div
                className={`text-[12px] leading-[18px] font-semibold uppercase tracking-[0.08em] ${theme.accentText}`}
              >
                Banc d’essai interactif
              </div>
              <h3
                className={`m-0 mt-0.5 font-[family-name:var(--font-serif)] font-semibold text-[22px] leading-[28px] ${theme.inkText}`}
              >
                Réglages du design et de l’appareil
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setAudioMuted((m) => !m)}
              className={`min-h-[44px] px-3 rounded-[8px] border flex items-center gap-2 text-[13px] font-semibold cursor-pointer ${theme.paperBg} ${theme.ruleBorder} ${theme.inkText}`}
            >
              {audioMuted ? (
                <>
                  <VolumeX className="w-4 h-4" strokeWidth={1.5} />
                  <span>Son coupé</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" strokeWidth={1.5} />
                  <span>Voix active</span>
                </>
              )}
            </button>
          </div>

          {/* 1. Thème : Papier / Sépia / Nuit */}
          <div className="space-y-1.5">
            <div
              className={`flex items-center justify-between text-[12px] leading-[18px] font-semibold uppercase tracking-[0.08em] ${theme.inkMutedText}`}
            >
              <span>Thème éditorial</span>
              <span className={theme.inkText}>{theme.label}</span>
            </div>
            <FrSegmented
              label="Thème"
              value={activeThemeId}
              onChange={handleSetTheme}
              theme={theme}
              columnsClass="grid-cols-3"
              options={[
                {value: 'papier', label: 'Papier (#F7F2E8)'},
                {value: 'sepia', label: 'Sépia (#EFE3CC)'},
                {value: 'nuit', label: 'Nuit (#1C1A17)'},
              ]}
            />
          </div>

          {/* 2. Largeur de l'appareil Android : 375 / 412 / 430 dp */}
          <div className="space-y-1.5">
            <div
              className={`flex items-center justify-between text-[12px] leading-[18px] font-semibold uppercase tracking-[0.08em] ${theme.inkMutedText}`}
            >
              <span>Largeur de l’appareil Android</span>
              <span className={`tabular-nums ${theme.inkText}`}>
                {deviceWidth} dp
              </span>
            </div>
            <FrSegmented
              label="Largeur de l’appareil"
              value={deviceWidth}
              onChange={setDeviceWidth}
              theme={theme}
              columnsClass="grid-cols-3"
              options={[
                {value: '375', label: '375 dp (Compact)'},
                {value: '412', label: '412 dp (Pixel)'},
                {value: '430', label: '430 dp (Grand)'},
              ]}
            />
          </div>

          {/* 3. Taille du texte de lecture : 16–24 px */}
          <div className="space-y-1.5">
            <div
              className={`flex items-center justify-between text-[12px] leading-[18px] font-semibold uppercase tracking-[0.08em] ${theme.inkMutedText}`}
            >
              <span>Corps du texte de lecture (Literata)</span>
              <span className={`tabular-nums ${theme.inkText}`}>
                {readSize} px
              </span>
            </div>
            <input
              type="range"
              min={16}
              max={24}
              step={1}
              value={readSize}
              onChange={(e) => setReadSize(parseInt(e.target.value, 10))}
              className="w-full cursor-pointer accent-[#1F5F63]"
            />
          </div>

          {/* 3b. Voix neuronale Studio 24 kHz (Clara / Thomas / Emma) */}
          <div className="space-y-1.5">
            <div
              className={`flex items-center justify-between text-[12px] leading-[18px] font-semibold uppercase tracking-[0.08em] ${theme.inkMutedText}`}
            >
              <span>Voix neuronale Studio 24 kHz</span>
              <button
                type="button"
                onClick={() => handleSampleVoice(currentVoice)}
                className={`text-[12px] font-semibold cursor-pointer underline underline-offset-2 ${theme.accentText}`}
              >
                {samplingVoiceId === currentVoice.id
                  ? 'Arrêter l’extrait'
                  : `Écouter ${currentVoice.name}`}
              </button>
            </div>
            <FrSegmented
              label="Voix neuronale Studio"
              value={voiceId}
              onChange={handleSelectVoice}
              theme={theme}
              columnsClass="grid-cols-3"
              options={[
                {value: 'clara', label: 'Clara (FR · Studio)'},
                {value: 'thomas', label: 'Thomas (FR · Posé)'},
                {value: 'emma', label: 'Emma (EN · Studio)'},
              ]}
            />
          </div>

          <div className={`h-[1px] ${theme.ruleBg}`} />

          {/* 4. Options spécifiques à la Bulle Flottante */}
          <div className="space-y-3">
            <div
              className={`text-[12px] leading-[18px] font-semibold uppercase tracking-[0.08em] ${theme.accentText}`}
            >
              Comportement de la bulle flottante
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className={`text-[13px] ${theme.inkMutedText}`}>
                  Forme au repos
                </span>
                <FrSegmented
                  label="Forme au repos"
                  value={bubbleShape}
                  onChange={(v) => {
                    setBubbleShape(v);
                    setPrototypeMode('bubble');
                    setBubbleMode('idle');
                  }}
                  theme={theme}
                  columnsClass="grid-cols-2"
                  options={[
                    {value: 'edge', label: 'Bulle au bord'},
                    {value: 'pill', label: 'Pilule en bas'},
                  ]}
                />
              </div>

              <div className="space-y-1">
                <span className={`text-[13px] ${theme.inkMutedText}`}>
                  Application dessous
                </span>
                <FrSegmented
                  label="Application dessous"
                  value={hostId}
                  onChange={(h) => {
                    handleSelectHostApp(h);
                    setPrototypeMode('bubble');
                  }}
                  theme={theme}
                  columnsClass="grid-cols-3"
                  options={[
                    {value: 'article', label: 'Article'},
                    {value: 'mail', label: 'Courriel'},
                    {value: 'pdf', label: 'PDF'},
                  ]}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <div>
                <p
                  className={`m-0 text-[14px] leading-[20px] font-semibold ${theme.inkText}`}
                >
                  Se rétracter après 3 secondes
                </p>
                <p
                  className={`m-0 text-[13px] leading-[18px] ${theme.inkMutedText}`}
                >
                  Transforme la bulle au repos en languette discrète de 14 × 64
                  dp collée au bord.
                </p>
              </div>
              <FrSwitch
                checked={autoTuck}
                onChange={(val) => {
                  setAutoTuck(val);
                  setPrototypeMode('bubble');
                  setBubbleMode('idle');
                }}
                label="Se rétracter après 3 secondes"
                theme={theme}
              />
            </div>
          </div>
        </section>

        {/* Card 2: Direct 6-State Machine Trigger for the Bubble */}
        <section
          aria-label="États de la bulle flottante"
          className={`rounded-[14px] border p-6 flex flex-col gap-3 ${theme.paperRaisedBg} ${theme.ruleBorder}`}
        >
          <div>
            <div
              className={`text-[12px] leading-[18px] font-semibold uppercase tracking-[0.08em] ${theme.accentText}`}
            >
              Machine d’état · fr-bubble.jsx
            </div>
            <h3
              className={`m-0 mt-0.5 font-[family-name:var(--font-serif)] font-semibold text-[20px] leading-[26px] ${theme.inkText}`}
            >
              Tester directement les 6 états de la bulle
            </h3>
            <p
              className={`m-0 mt-1 text-[14px] leading-[20px] ${theme.inkMutedText}`}
            >
              Cliquez sur un état pour basculer immédiatement l’écran Android
              dans cette configuration.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(
              [
                {
                  id: 'idle' as const,
                  title: '1. Au repos (idle)',
                  sub: 'Bulle 56 dp ou languette',
                },
                {
                  id: 'menu' as const,
                  title: '2. Menu (menu)',
                  sub: 'Feuille d’actions & suivi',
                },
                {
                  id: 'scan' as const,
                  title: '3. Balayage (scan)',
                  sub: 'Repérage du texte',
                },
                {
                  id: 'pick' as const,
                  title: '4. Choix (pick)',
                  sub: 'Toucher où commencer',
                },
                {
                  id: 'reading' as const,
                  title: '5. Pilule & Lecteur',
                  sub: 'Onde 5 barres & sauts ±',
                },
                {
                  id: 'hidden' as const,
                  title: '6. Masquée (hidden)',
                  sub: 'Toast avec annulation',
                },
              ] as const
            ).map((st) => {
              const isCurrent =
                prototypeMode === 'bubble' && bubbleMode === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    setPrototypeMode('bubble');
                    if (st.id === 'idle') {
                      setBubbleMode('idle');
                      setPlayerExpanded(false);
                    } else if (st.id === 'menu') {
                      setBubbleMode('menu');
                    } else if (st.id === 'scan') {
                      setBubbleMode('scan');
                    } else if (st.id === 'pick') {
                      stopAudioPlayback();
                      setIsPlaying(false);
                      setBubbleMode('pick');
                    } else if (st.id === 'reading') {
                      setBubbleMode('reading');
                      setPlayerExpanded(true);
                      if (activeSentenceIdx < 0) setActiveSentenceIdx(0);
                    } else if (st.id === 'hidden') {
                      stopAudioPlayback();
                      setIsPlaying(false);
                      setBubbleMode('hidden');
                    }
                  }}
                  className={`p-3 rounded-[8px] border text-left cursor-pointer transition-colors duration-150 ${
                    isCurrent
                      ? `${theme.accentBorder} ${theme.paperBg} ring-1 ring-inset ${
                          theme.id === 'nuit'
                            ? 'ring-[#7FB8B3]'
                            : 'ring-[#1F5F63]'
                        }`
                      : `${theme.paperBg} ${theme.ruleBorder} hover:${theme.inkMutedBorder}`
                  }`}
                >
                  <div
                    className={`text-[13px] leading-[18px] font-semibold ${theme.inkText}`}
                  >
                    {st.title}
                  </div>
                  <div
                    className={`text-[12px] leading-[16px] mt-0.5 ${theme.inkMutedText}`}
                  >
                    {st.sub}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Card 3: Listening Statistics Card (.fr-stats from design-system/components.css) */}
        <section
          aria-label="Statistiques d’écoute"
          className={`rounded-[14px] border overflow-hidden ${theme.paperBg} ${theme.ruleBorder}`}
        >
          <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-baseline gap-2.5">
              <span
                className={`font-[family-name:var(--font-serif)] font-medium text-[32px] leading-none tracking-[-0.02em] tabular-nums ${theme.inkText}`}
              >
                3{NBS}h{NBS}40
              </span>
              <span className={`text-[15px] leading-[20px] ${theme.inkMutedText}`}>
                écoutées cette semaine
              </span>
            </div>

            <div className="flex items-baseline gap-2.5">
              <span
                className={`font-[family-name:var(--font-serif)] font-medium text-[32px] leading-none tracking-[-0.02em] tabular-nums ${theme.inkText}`}
              >
                14
              </span>
              <span className={`text-[15px] leading-[20px] ${theme.inkMutedText}`}>
                articles et rapports lus
              </span>
            </div>
          </div>

          <div
            className={`px-6 pt-4 pb-5 border-t ${theme.paperRaisedBg} ${theme.ruleBorder}`}
          >
            <p
              className={`m-0 mb-0.5 text-[15px] leading-[22px] font-semibold ${theme.inkText}`}
            >
              Confort visuel hebdomadaire
            </p>
            <p
              className={`m-0 mb-3 text-[13px] leading-[18px] ${theme.inkMutedText}`}
            >
              Lecture vocale hors ligne activée sur vos journaux, courriels et
              documents PDF.
            </p>
            <div
              className={`flex items-center gap-2 text-[12px] leading-[16px] tabular-nums ${theme.inkMutedText}`}
            >
              <div
                className={`flex-1 h-[6px] rounded-full overflow-hidden ${theme.ruleBg}`}
              >
                <span className={`block h-full w-[75%] rounded-full ${theme.accentBg}`} />
              </div>
              <span>75{NBS}%</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
