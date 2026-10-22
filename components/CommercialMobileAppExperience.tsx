'use client';

import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import {
  Play,
  Pause,
  Rewind,
  FastForward,
  Volume2,
  ClipboardPaste,
  Globe,
  Camera,
  SlidersHorizontal,
  X,
  Check,
  Sparkles,
  FileText,
  Hand,
  RotateCcw,
  Plus,
  Trash2,
  Loader2,
  Gauge,
  Download,
  Smartphone,
  MoreHorizontal,
} from 'lucide-react';
import {
  FrThemeId,
  FR_THEMES,
  FR_VOICES,
  FrVoiceId,
  FrVoiceSpec,
  INITIAL_FR_DOCS,
  FrDocItem,
  SPEEDS,
  SEC_PER_CHAR,
  NBS,
  fmtSpeed,
  fmtWpm,
  fmtTime,
  splitTextIntoParagraphs,
  FrSwitch,
  FrSegmented,
  FrStepper,
  FrChip,
  FrLiveWave,
  FrVoiceCard,
  StopSquareIcon,
} from '@/lib/fishreader-ds';
import {
  downloadFishReaderApkClientSide,
  shareFishReaderApkFile,
} from '@/lib/apk-data';

type BubbleMode = 'idle' | 'menu' | 'scan' | 'pick' | 'reading' | 'hidden';

interface SkipPrefs {
  unit: 'sent' | 'sec' | 'para';
  sent: number;
  sec: number;
}

interface CommercialMobileAppExperienceProps {
  themeId?: FrThemeId;
  onThemeChange?: (next: FrThemeId) => void;
}

function getProgressWidthClass(pct: number): string {
  const clamped = Math.max(0, Math.min(100, Math.round(pct / 5) * 5));
  const map: Record<number, string> = {
    0: 'w-0',
    5: 'w-[5%]',
    10: 'w-[10%]',
    15: 'w-[15%]',
    20: 'w-[20%]',
    25: 'w-1/4',
    30: 'w-[30%]',
    35: 'w-[35%]',
    40: 'w-2/5',
    45: 'w-[45%]',
    50: 'w-1/2',
    55: 'w-[55%]',
    60: 'w-3/5',
    65: 'w-[65%]',
    70: 'w-[70%]',
    75: 'w-3/4',
    80: 'w-4/5',
    85: 'w-[85%]',
    90: 'w-[90%]',
    95: 'w-[95%]',
    100: 'w-full',
  };
  return map[clamped] || 'w-0';
}

function getReadingSizeClass(px: number): string {
  const map: Record<number, string> = {
    16: 'text-[16px] leading-[26px]',
    17: 'text-[17px] leading-[27px]',
    18: 'text-[18px] leading-[29px]',
    19: 'text-[19px] leading-[30px]',
    20: 'text-[20px] leading-[32px]',
    21: 'text-[21px] leading-[34px]',
    22: 'text-[22px] leading-[35px]',
    23: 'text-[23px] leading-[37px]',
    24: 'text-[24px] leading-[38px]',
  };
  return map[px] || 'text-[19px] leading-[30px]';
}

function getBubbleTopClass(yf: number): string {
  const pct = Math.max(10, Math.min(80, Math.round((yf * 100) / 5) * 5));
  const map: Record<number, string> = {
    10: 'top-[10%]',
    15: 'top-[15%]',
    20: 'top-[20%]',
    25: 'top-[25%]',
    30: 'top-[30%]',
    35: 'top-[35%]',
    40: 'top-[40%]',
    45: 'top-[45%]',
    50: 'top-[50%]',
    55: 'top-[55%]',
    60: 'top-[60%]',
    65: 'top-[65%]',
    70: 'top-[70%]',
    75: 'top-[75%]',
    80: 'top-[80%]',
  };
  return map[pct] || 'top-[60%]';
}

/**
 * Forces the browser's native WSOLA (Waveform Similarity Overlap-Add)
 * time-stretcher on an HTMLAudioElement so increasing speech rate (words per minute)
 * NEVER increases vocal pitch (zero "chipmunk" / high-pitched effect).
 */
function applyPitchPreservingSpeed(audioEl: HTMLAudioElement, rate: number) {
  const clampedRate = Math.max(0.5, Math.min(2.2, rate));
  audioEl.preservesPitch = true;
  (
    audioEl as HTMLAudioElement & {
      mozPreservesPitch?: boolean;
      webkitPreservesPitch?: boolean;
    }
  ).mozPreservesPitch = true;
  (
    audioEl as HTMLAudioElement & {
      mozPreservesPitch?: boolean;
      webkitPreservesPitch?: boolean;
    }
  ).webkitPreservesPitch = true;
  audioEl.defaultPlaybackRate = clampedRate;
  audioEl.playbackRate = clampedRate;
}

export default function CommercialMobileAppExperience({
  themeId: externalThemeId,
  onThemeChange,
}: CommercialMobileAppExperienceProps) {
  const [internalThemeId, setInternalThemeId] = useState<FrThemeId>('papier');
  const activeThemeId = externalThemeId || internalThemeId;
  const theme = FR_THEMES[activeThemeId];

  const handleSetTheme = (next: FrThemeId) => {
    setInternalThemeId(next);
    onThemeChange?.(next);
  };

  // Documents / screens available to read
  const [docs, setDocs] = useState<FrDocItem[]>(INITIAL_FR_DOCS);
  const [currentDocId, setCurrentDocId] = useState<string>(
    INITIAL_FR_DOCS[0].id
  );

  // Voice & reading settings — locked to user's manual selection across all paragraphs & readings
  const [voiceId, setVoiceId] = useState<FrVoiceId>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = window.localStorage.getItem('frb-selected-voice');
        if (
          saved === 'clara' ||
          saved === 'thomas' ||
          saved === 'nicolas' ||
          saved === 'emma'
        ) {
          return saved;
        }
      } catch {}
    }
    return 'clara';
  });
  const [speed, setSpeed] = useState<number>(1.0);
  const [pauseCadence, setPauseCadence] = useState<
    'courtes' | 'naturelles' | 'marquees'
  >('naturelles');
  const [readSize, setReadSize] = useState<number>(19);

  // Floating Bubble state
  const [bubbleMode, setBubbleMode] = useState<BubbleMode>('idle');
  const [bubbleSide, setBubbleSide] = useState<'left' | 'right'>('right');
  const [bubbleYf, setBubbleYf] = useState<number>(0.65);
  const [bubbleTucked, setBubbleTucked] = useState<boolean>(false);
  const [isDraggingBubble, setIsDraggingBubble] = useState<boolean>(false);
  const [playerExpanded, setPlayerExpanded] = useState<boolean>(false);
  const [followReading, setFollowReading] = useState<boolean>(true);
  const [showSkipSettings, setShowSkipSettings] = useState<boolean>(false);

  // Sheets & Modals
  const [activeSheet, setActiveSheet] = useState<
    'none' | 'paste' | 'url' | 'voices' | 'docs' | 'android'
  >('none');
  const [pasteText, setPasteText] = useState<string>('');
  const [urlInput, setUrlInput] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [pwaInstallPrompt, setPwaInstallPrompt] = useState<
    | (Event & {
        prompt: () => Promise<void>;
        userChoice: Promise<{outcome: 'accepted' | 'dismissed'}>;
      })
    | null
  >(null);
  const [apkDownloaded, setApkDownloaded] = useState<boolean>(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setPwaInstallPrompt(
        e as Event & {
          prompt: () => Promise<void>;
          userChoice: Promise<{outcome: 'accepted' | 'dismissed'}>;
        }
      );
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const [skipPrefs, setSkipPrefs] = useState<SkipPrefs>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem('frb-skip');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            return {
              unit: parsed.unit || 'sec',
              sent: parsed.sent || 1,
              sec: parsed.sec || 15,
            };
          }
        }
      } catch {}
    }
    return {unit: 'sec', sent: 1, sec: 15};
  });

  const updateSkipPrefs = (patch: Partial<SkipPrefs>) => {
    setSkipPrefs((prev) => {
      const next = {...prev, ...patch};
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('frb-skip', JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  };

  // Playback state
  const [activeSentenceIdx, setActiveSentenceIdx] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isSynthesizingNeural, setIsSynthesizingNeural] =
    useState<boolean>(false);
  const [samplingVoiceId, setSamplingVoiceId] = useState<string | null>(null);

  const currentDoc = useMemo(
    () => docs.find((d) => d.id === currentDocId) || docs[0],
    [docs, currentDocId]
  );

  const currentVoice = useMemo(
    () => FR_VOICES.find((v) => v.id === voiceId) || FR_VOICES[0],
    [voiceId]
  );

  // All sentences currently visible on screen (Title + Paragraphs)
  const activeSentences = useMemo(() => {
    return [currentDoc.title, ...currentDoc.paragraphs.flat()];
  }, [currentDoc]);

  // Refs for WSOLA HTMLAudioElement & state synchronization
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const wavBlobUrlCacheRef = useRef<Map<string, string>>(new Map());
  const inFlightRequestsRef = useRef<Map<string, Promise<string | null>>>(
    new Map()
  );
  const playbackSessionRef = useRef<number>(0);
  const pauseTimerRef = useRef<number | null>(null);
  const speedRef = useRef<number>(speed);
  const voiceRef = useRef<FrVoiceSpec>(currentVoice);
  const sentencesRef = useRef<string[]>(activeSentences);
  const mainScrollRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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
    voiceRef.current = currentVoice;
  }, [currentVoice]);

  useEffect(() => {
    sentencesRef.current = activeSentences;
  }, [activeSentences]);

  // Compute paragraph start indices for paragraph skipping
  const paraStarts = useMemo(() => {
    const starts: number[] = [0];
    let acc = 1;
    for (const p of currentDoc.paragraphs) {
      starts.push(acc);
      acc += p.length;
    }
    return starts;
  }, [currentDoc]);

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

  // Get or create persistent HTMLAudioElement with WSOLA pitch preservation enabled
  const getAudioElement = useCallback((): HTMLAudioElement | null => {
    if (typeof window === 'undefined') return null;
    if (!audioElementRef.current) {
      const el = new Audio();
      el.preload = 'auto';
      applyPitchPreservingSpeed(el, speedRef.current);
      audioElementRef.current = el;
    }
    return audioElementRef.current;
  }, []);

  const stopAudioPlayback = useCallback(() => {
    playbackSessionRef.current += 1;
    if (pauseTimerRef.current !== null) {
      window.clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
    const el = audioElementRef.current;
    if (el) {
      try {
        el.onended = null;
        el.onerror = null;
        el.onloadedmetadata = null;
        el.onplay = null;
        el.pause();
        el.removeAttribute('src');
        el.load();
      } catch {}
    }
    setIsSynthesizingNeural(false);
    setSamplingVoiceId(null);
  }, []);

  /**
   * Fetches the server-normalized 24 kHz WAV for (text, voiceSpec, speed, wpm) and caches
   * it as an in-memory Blob URL keyed strictly by voiceSpec.id so the locked voice
   * remains 100% constant across all paragraphs and readings.
   */
  const fetchVoiceWavBlobUrl = useCallback(
    async (
      text: string,
      voiceSpec: FrVoiceSpec
    ): Promise<string | null> => {
      const trimmedText = text.trim();
      if (!trimmedText) return null;

      const cacheKey = `v5-locked::${voiceSpec.id}::${trimmedText}`;
      const cachedUrl = wavBlobUrlCacheRef.current.get(cacheKey);
      if (cachedUrl) return cachedUrl;

      const existingPromise = inFlightRequestsRef.current.get(cacheKey);
      if (existingPromise) return existingPromise;

      const requestPromise = (async (): Promise<string | null> => {
        try {
          const language = voiceSpec.bcp === 'en-US' ? 'en' : 'fr';

          for (let attempt = 0; attempt < 3; attempt++) {
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
              if (!res.ok) {
                await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
                continue;
              }

              const contentType = res.headers.get('content-type') || '';
              if (contentType.includes('audio/wav')) {
                const wavArrayBuffer = await res.arrayBuffer();
                if (wavArrayBuffer.byteLength > 44 && typeof window !== 'undefined') {
                  const wavBlob = new Blob([wavArrayBuffer], {type: 'audio/wav'});
                  const blobUrl = URL.createObjectURL(wavBlob);
                  wavBlobUrlCacheRef.current.set(cacheKey, blobUrl);
                  return blobUrl;
                }
              } else {
                const data = await res.json();
                const audioMimeType =
                  typeof data.mimeType === 'string' ? data.mimeType : 'audio/wav';
                const base64Audio: string | null =
                  data.audioBase64 ||
                  (typeof data.audioDataUrl === 'string'
                    ? data.audioDataUrl.split(',')[1]
                    : null);
                if (base64Audio && typeof window !== 'undefined') {
                  const binaryString = window.atob(base64Audio);
                  const len = binaryString.length;
                  const bytes = new Uint8Array(len);
                  for (let i = 0; i < len; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                  }
                  const wavBlob = new Blob([bytes], {type: audioMimeType});
                  const blobUrl = URL.createObjectURL(wavBlob);
                  wavBlobUrlCacheRef.current.set(cacheKey, blobUrl);
                  return blobUrl;
                }
              }
            } catch {
              await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
            }
          }
          return null;
        } catch {
          return null;
        } finally {
          inFlightRequestsRef.current.delete(cacheKey);
        }
      })();

      inFlightRequestsRef.current.set(cacheKey, requestPromise);
      return requestPromise;
    },
    []
  );

  // Warm up only sentence 0 in currentVoice so initial tap starts fast without burning quota
  useEffect(() => {
    if (activeSentences.length > 0) {
      void fetchVoiceWavBlobUrl(activeSentences[0], currentVoice);
    }
  }, [activeSentences, currentVoice, fetchVoiceWavBlobUrl]);

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
      sentencesList: string[] = sentencesRef.current,
      voiceSpec: FrVoiceSpec = voiceRef.current
    ) => {
      const sentence = sentencesList[idx];
      if (!sentence) {
        setIsPlaying(false);
        setActiveSentenceIdx(-1);
        setPlayerExpanded(false);
        setBubbleMode('idle');
        return;
      }

      stopAudioPlayback();
      const sessionId = playbackSessionRef.current;

      // Strictly lock the user's manually selected voice across all sentences and paragraphs
      const lockedVoice = voiceRef.current || voiceSpec;

      const scheduleNext = () => {
        if (playbackSessionRef.current !== sessionId) return;
        const nextIdx = idx + 1;
        if (nextIdx < sentencesList.length) {
          const basePause =
            pauseCadence === 'courtes'
              ? 80
              : pauseCadence === 'marquees'
                ? 260
                : 145;
          const delayMs = Math.round(
            basePause / Math.max(0.75, speedRef.current)
          );
          pauseTimerRef.current = window.setTimeout(() => {
            if (playbackSessionRef.current !== sessionId) return;
            setActiveSentenceIdx(nextIdx);
            // Always use the exact locked voice from voiceRef.current across paragraphs
            void playSentenceRef.current(
              nextIdx,
              sentencesList,
              voiceRef.current
            );
          }, delayMs);
        } else {
          setIsPlaying(false);
          setActiveSentenceIdx(-1);
          setPlayerExpanded(false);
          setBubbleMode('idle');
        }
      };

      // Prefetch the immediate next sentence (and the one after if crossing paragraphs) with the exact same locked voice
      if (idx + 1 < sentencesList.length) {
        void fetchVoiceWavBlobUrl(sentencesList[idx + 1], lockedVoice);
      }
      if (idx + 2 < sentencesList.length) {
        void fetchVoiceWavBlobUrl(sentencesList[idx + 2], lockedVoice);
      }

      const cacheKey = `v5-locked::${lockedVoice.id}::${sentence.trim()}`;
      if (!wavBlobUrlCacheRef.current.has(cacheKey)) {
        setIsSynthesizingNeural(true);
      }

      const blobUrl = await fetchVoiceWavBlobUrl(sentence, lockedVoice);
      if (playbackSessionRef.current !== sessionId) return;
      setIsSynthesizingNeural(false);

      const audioEl = getAudioElement();
      if (blobUrl && audioEl) {
        try {
          audioEl.src = blobUrl;
          applyPitchPreservingSpeed(audioEl, speedRef.current);

          audioEl.onloadedmetadata = () => {
            if (playbackSessionRef.current !== sessionId) return;
            applyPitchPreservingSpeed(audioEl, speedRef.current);
          };

          audioEl.onplay = () => {
            if (playbackSessionRef.current !== sessionId) return;
            applyPitchPreservingSpeed(audioEl, speedRef.current);
          };

          audioEl.onended = () => {
            if (playbackSessionRef.current !== sessionId) return;
            scheduleNext();
          };

          audioEl.onerror = () => {
            if (playbackSessionRef.current !== sessionId) return;
            scheduleNext();
          };

          await audioEl.play();
          return;
        } catch {
          if (playbackSessionRef.current !== sessionId) return;
        }
      }

      // If offline and neural audio unavailable, advance after reading time
      const simulatedMs =
        Math.max(1400, sentence.length * SEC_PER_CHAR * 1000) /
        speedRef.current;
      pauseTimerRef.current = window.setTimeout(scheduleNext, simulatedMs);
    },
    [fetchVoiceWavBlobUrl, getAudioElement, pauseCadence, stopAudioPlayback]
  );

  useEffect(() => {
    playSentenceRef.current = playSentenceAtIndex;
  }, [playSentenceAtIndex]);

  // Instant WPM speed update with strict WSOLA pitch preservation (zero high-pitched effect)
  const handleSpeedUpdate = useCallback((nextSpeed: number) => {
    const rounded = Math.round(nextSpeed * 100) / 100;
    speedRef.current = rounded;
    setSpeed(rounded);
    const audioEl = audioElementRef.current;
    if (audioEl) {
      applyPitchPreservingSpeed(audioEl, rounded);
    }
  }, []);

  /**
   * Direct, immediate voice switching (1/4 Clara | 2/4 Thomas | 3/4 Nicolas | 4/4 Emma):
   * Locks the chosen voice in voiceRef and localStorage so it remains 100% constant
   * across all paragraphs and all readings until manually changed by the user.
   */
  const handleSelectVoice = useCallback(
    (nextVoiceId: FrVoiceId, autoSpeakNow = true) => {
      const nextVoiceObj =
        FR_VOICES.find((v) => v.id === nextVoiceId) || FR_VOICES[0];
      voiceRef.current = nextVoiceObj;
      setVoiceId(nextVoiceId);
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('frb-selected-voice', nextVoiceId);
        } catch {}
      }

      // Cut off old voice playback immediately so the new speaker starts cleanly
      stopAudioPlayback();

      if (isPlaying || autoSpeakNow) {
        const targetIdx = activeSentenceIdx >= 0 ? activeSentenceIdx : 0;
        setActiveSentenceIdx(targetIdx);
        setIsPlaying(true);
        if (bubbleMode === 'idle') {
          setBubbleMode('reading');
        }
        void playSentenceAtIndex(
          targetIdx,
          sentencesRef.current,
          nextVoiceObj
        );
      }
    },
    [
      activeSentenceIdx,
      bubbleMode,
      isPlaying,
      playSentenceAtIndex,
      stopAudioPlayback,
    ]
  );

  // Auto-scroll active sentence into view when followReading is enabled
  useEffect(() => {
    if (!followReading || activeSentenceIdx < 0) return;
    const container = mainScrollRef.current;
    if (!container) return;
    const el = container.querySelector(`[data-sent="${activeSentenceIdx}"]`);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cr = container.getBoundingClientRect();
    if (r.top < cr.top + 80 || r.bottom > cr.bottom - 160) {
      container.scrollTo({
        top: container.scrollTop + r.top - cr.top - cr.height * 0.28,
        behavior: 'smooth',
      });
    }
  }, [activeSentenceIdx, followReading]);

  // Auto-tuck bubble after 3.2s in idle mode
  useEffect(() => {
    if (bubbleMode !== 'idle' || isDraggingBubble) {
      const resetTimer = window.setTimeout(() => setBubbleTucked(false), 0);
      return () => window.clearTimeout(resetTimer);
    }
    const timer = window.setTimeout(() => setBubbleTucked(true), 3200);
    return () => window.clearTimeout(timer);
  }, [bubbleMode, bubbleSide, bubbleYf, isDraggingBubble]);

  // Scan transition (450ms visual scan sweep -> interactive paragraph selection on screen)
  useEffect(() => {
    if (bubbleMode !== 'scan') return;
    const timer = window.setTimeout(() => {
      setBubbleMode('pick');
    }, 450);
    return () => window.clearTimeout(timer);
  }, [bubbleMode]);

  // Update doc progress when reading
  useEffect(() => {
    if (activeSentenceIdx >= 0 && activeSentences.length > 0) {
      const p = Math.round((activeSentenceIdx / activeSentences.length) * 100);
      const t = window.setTimeout(() => {
        setDocs((prev) =>
          prev.map((d) => (d.id === currentDocId ? {...d, progress: p} : d))
        );
      }, 0);
      return () => window.clearTimeout(t);
    }
  }, [activeSentenceIdx, activeSentences.length, currentDocId]);

  // Direct action when starting reading from a selected paragraph or sentence:
  // Automatically collapses the floating controller into the vertical pill [◉ / ⋯]
  const handleStartReadingScreen = useCallback(
    (startIndex = 0) => {
      const list = sentencesRef.current;
      const targetIdx =
        startIndex >= 0 && startIndex < list.length ? startIndex : 0;
      setPlayerExpanded(false);
      setBubbleMode('reading');
      setActiveSentenceIdx(targetIdx);
      setIsPlaying(true);
      void playSentenceAtIndex(targetIdx, list, voiceRef.current);
    },
    [playSentenceAtIndex]
  );

  // Play / Pause toggle
  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      stopAudioPlayback();
      setIsPlaying(false);
    } else {
      const startIdx = activeSentenceIdx < 0 ? 0 : activeSentenceIdx;
      setBubbleMode('reading');
      setActiveSentenceIdx(startIdx);
      setIsPlaying(true);
      void playSentenceAtIndex(
        startIdx,
        sentencesRef.current,
        voiceRef.current
      );
    }
  }, [activeSentenceIdx, isPlaying, playSentenceAtIndex, stopAudioPlayback]);

  // Skip helpers
  const handleSkipSeconds = useCallback(
    (deltaSec: number) => {
      const list = sentencesRef.current;
      const cur = Math.max(0, activeSentenceIdx);
      const neededChars = (Math.abs(deltaSec) * speedRef.current) / SEC_PER_CHAR;
      let i = cur;
      let acc = 0;
      if (deltaSec < 0) {
        while (i > 0 && acc < neededChars) {
          i--;
          acc += list[i].length;
        }
      } else {
        while (i < list.length - 1 && acc < neededChars) {
          acc += list[i].length;
          i++;
        }
      }
      setActiveSentenceIdx(i);
      if (isPlaying) {
        void playSentenceAtIndex(i, list, voiceRef.current);
      }
    },
    [activeSentenceIdx, isPlaying, playSentenceAtIndex]
  );

  const handleSkipSentences = useCallback(
    (deltaSent: number) => {
      const list = sentencesRef.current;
      const cur = Math.max(0, activeSentenceIdx);
      const nextIdx = Math.min(list.length - 1, Math.max(0, cur + deltaSent));
      setActiveSentenceIdx(nextIdx);
      if (isPlaying) {
        void playSentenceAtIndex(nextIdx, list, voiceRef.current);
      }
    },
    [activeSentenceIdx, isPlaying, playSentenceAtIndex]
  );

  const handleSkipParagraph = useCallback(
    (forward: boolean) => {
      const list = sentencesRef.current;
      const cur = Math.max(0, activeSentenceIdx);
      let nextIdx = cur;
      if (forward) {
        const found = paraStarts.find((s) => s > cur);
        nextIdx = found !== undefined ? found : list.length - 1;
      } else {
        const prevStarts = paraStarts.filter((s) => s < cur);
        nextIdx = prevStarts.length > 0 ? prevStarts[prevStarts.length - 1] : 0;
      }
      setActiveSentenceIdx(nextIdx);
      if (isPlaying) {
        void playSentenceAtIndex(nextIdx, list, voiceRef.current);
      }
    },
    [activeSentenceIdx, isPlaying, paraStarts, playSentenceAtIndex]
  );

  const handleBubblePlayerSkip = useCallback(
    (forward: boolean) => {
      if (skipPrefs.unit === 'sec') {
        handleSkipSeconds(forward ? skipPrefs.sec : -skipPrefs.sec);
      } else if (skipPrefs.unit === 'para') {
        handleSkipParagraph(forward);
      } else {
        handleSkipSentences(forward ? skipPrefs.sent : -skipPrefs.sent);
      }
    },
    [
      handleSkipParagraph,
      handleSkipSeconds,
      handleSkipSentences,
      skipPrefs.sec,
      skipPrefs.sent,
      skipPrefs.unit,
    ]
  );

  const handleStopBubbleReading = useCallback(() => {
    stopAudioPlayback();
    setIsPlaying(false);
    setActiveSentenceIdx(-1);
    setPlayerExpanded(false);
    setBubbleMode('idle');
  }, [stopAudioPlayback]);

  // Native Android / iOS MediaSession API integration
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) {
      return;
    }
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentDoc.title,
        artist: `Fish Reader · ${currentVoice.shortLabel}`,
        album: currentDoc.kicker || 'Lecture à voix haute',
      });
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
      navigator.mediaSession.setActionHandler('play', () => handleTogglePlay());
      navigator.mediaSession.setActionHandler('pause', () =>
        handleTogglePlay()
      );
      navigator.mediaSession.setActionHandler('seekbackward', () =>
        handleSkipSeconds(-15)
      );
      navigator.mediaSession.setActionHandler('seekforward', () =>
        handleSkipSeconds(15)
      );
      navigator.mediaSession.setActionHandler('previoustrack', () =>
        handleSkipSentences(-1)
      );
      navigator.mediaSession.setActionHandler('nexttrack', () =>
        handleSkipSentences(1)
      );
    } catch {}
  }, [
    currentDoc.kicker,
    currentDoc.title,
    currentVoice.shortLabel,
    handleSkipSeconds,
    handleSkipSentences,
    handleTogglePlay,
    isPlaying,
  ]);

  // Load new text onto the screen and immediately start reading it
  const loadNewScreenDocument = useCallback(
    (title: string, rawText: string, kicker: string, autoPlay = true) => {
      const paragraphs = splitTextIntoParagraphs(rawText);
      if (paragraphs.length === 0) return;

      const newDoc: FrDocItem = {
        id: 'doc-' + Date.now(),
        when: 'À l’instant',
        kicker,
        title:
          title.length > 64 ? title.slice(0, 62).trim() + '…' : title.trim(),
        progress: 0,
        paragraphs,
      };

      const newSentences = [newDoc.title, ...newDoc.paragraphs.flat()];
      sentencesRef.current = newSentences;

      setDocs((prev) => [newDoc, ...prev]);
      setCurrentDocId(newDoc.id);
      setActiveSheet('none');

      if (autoPlay) {
        setBubbleMode('reading');
        setActiveSentenceIdx(0);
        setIsPlaying(true);
        void playSentenceAtIndex(0, newSentences, voiceRef.current);
      } else {
        setActiveSentenceIdx(-1);
        setIsPlaying(false);
        setBubbleMode('idle');
      }
    },
    [playSentenceAtIndex]
  );

  // Instant 1-tap Clipboard Read
  const handleReadClipboardNow = async () => {
    setStatusBanner(null);
    try {
      if (!navigator.clipboard) throw new Error('Unavailable');
      const txt = await navigator.clipboard.readText();
      if (!txt || !txt.trim()) {
        setActiveSheet('paste');
        return;
      }
      const cleaned = txt.trim();
      const firstLine = cleaned.split('\n')[0] || cleaned;
      loadNewScreenDocument(firstLine, cleaned, 'Presse-papiers', true);
    } catch {
      setActiveSheet('paste');
    }
  };

  // Extract and read from a live URL
  const handleExtractUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim() || isExtracting) return;
    setIsExtracting(true);
    setStatusBanner('Extraction du texte de la page Web…');
    try {
      const res = await fetch('/api/extract-content', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({url: urlInput.trim()}),
      });
      const data = await res.json();
      if (!res.ok || !data.text) {
        setStatusBanner(
          data.error || 'Impossible de lire cette adresse Web.'
        );
        setIsExtracting(false);
        return;
      }
      setUrlInput('');
      setStatusBanner(null);
      loadNewScreenDocument(
        data.title || 'Article Web',
        data.text,
        data.source || 'Page Web',
        true
      );
    } catch {
      setStatusBanner('Erreur réseau lors de l’ouverture du lien.');
    } finally {
      setIsExtracting(false);
    }
  };

  // Extract and read from a phone Screenshot, Image, PDF, or TXT file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (
      file.type.startsWith('text/') ||
      /\.(txt|md|csv)$/i.test(file.name)
    ) {
      const text = await file.text();
      if (text.trim()) {
        loadNewScreenDocument(
          file.name.replace(/\.[^.]+$/, ''),
          text,
          'Fichier local',
          true
        );
      }
      return;
    }

    setIsExtracting(true);
    setBubbleMode('scan');
    setStatusBanner('Lecture de votre capture d’écran en cours…');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const fileBase64 = window.btoa(binary);

      const res = await fetch('/api/extract-content', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          fileBase64,
          mimeType: file.type || 'image/png',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.text) {
        setBubbleMode('idle');
        setStatusBanner(
          data.error || 'Aucun texte détecté sur cette capture.'
        );
        setIsExtracting(false);
        return;
      }

      setStatusBanner(null);
      loadNewScreenDocument(
        data.title || file.name.replace(/\.[^.]+$/, ''),
        data.text,
        'Capture d’écran',
        true
      );
    } catch {
      setBubbleMode('idle');
      setStatusBanner('Erreur lors de l’analyse de la capture d’écran.');
    } finally {
      setIsExtracting(false);
    }
  };

  // Sample voice in Voices sheet with WSOLA pitch preservation
  const handleSampleVoice = async (v: FrVoiceSpec) => {
    if (samplingVoiceId === v.id) {
      stopAudioPlayback();
      return;
    }
    stopAudioPlayback();
    setIsPlaying(false);
    setSamplingVoiceId(v.id);
    const sessionId = playbackSessionRef.current;

    const blobUrl = await fetchVoiceWavBlobUrl(v.sample, v);
    if (playbackSessionRef.current !== sessionId) return;

    const audioEl = getAudioElement();
    if (blobUrl && audioEl) {
      try {
        audioEl.src = blobUrl;
        applyPitchPreservingSpeed(audioEl, speedRef.current);
        audioEl.onloadedmetadata = () => {
          applyPitchPreservingSpeed(audioEl, speedRef.current);
        };
        audioEl.onplay = () => {
          applyPitchPreservingSpeed(audioEl, speedRef.current);
        };
        audioEl.onended = () => {
          if (playbackSessionRef.current === sessionId) {
            setSamplingVoiceId(null);
          }
        };
        await audioEl.play();
      } catch {
        setSamplingVoiceId(null);
      }
    } else {
      setTimeout(() => setSamplingVoiceId(null), 1500);
    }
  };

  // Bubble pointer drag handlers
  const handleBubblePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    const area = viewportRef.current;
    if (!area) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = area.getBoundingClientRect();
    dragStartRef.current = {
      x0: e.clientX,
      y0: e.clientY,
      rect,
      moved: false,
    };
  };

  const handleBubblePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const st = dragStartRef.current;
    if (!st) return;
    const dx = e.clientX - st.x0;
    const dy = e.clientY - st.y0;
    if (!st.moved && Math.hypot(dx, dy) < 6) return;
    st.moved = true;
    setIsDraggingBubble(true);
    setBubbleTucked(false);
    const yf = Math.min(
      0.8,
      Math.max(0.1, (e.clientY - st.rect.top - 28) / st.rect.height)
    );
    const side =
      e.clientX - st.rect.left < st.rect.width / 2 ? 'left' : 'right';
    setBubbleYf(yf);
    setBubbleSide(side);
  };

  const handleBubblePointerUp = () => {
    const st = dragStartRef.current;
    dragStartRef.current = null;
    if (!st) return;
    if (st.moved) {
      window.setTimeout(() => setIsDraggingBubble(false), 0);
      return;
    }
    if (bubbleTucked) {
      setBubbleTucked(false);
    }
    if (isPlaying || activeSentenceIdx >= 0) {
      // Never restart from sentence 0 if playback is already active or paused
      setPlayerExpanded(false);
      setBubbleMode('reading');
      return;
    }
    // Short tap when idle -> 450ms screen scan + framed clickable paragraphs
    setBubbleMode('scan');
  };

  const skipButtonText = (sign: '−' | '+' | '±') => {
    if (skipPrefs.unit === 'sec') {
      return `${sign}${skipPrefs.sec}${NBS}s`;
    }
    if (skipPrefs.unit === 'para') {
      return `${sign}1${NBS}¶`;
    }
    return `${sign}${skipPrefs.sent}${NBS}phr.`;
  };

  let sentCounter = 1; // 0 is the document title

  return (
    <div
      ref={viewportRef}
      className={`relative w-full h-dvh flex flex-col overflow-hidden select-none ${theme.paperBg} ${theme.inkText} font-[family-name:var(--font-sans)]`}
    >
      {/* Hidden file input for Screenshot / PDF / Image / TXT */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.txt,.md"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* ==================== TOP BAR: CONTENT + DIRECT VOICE SWITCHER ==================== */}
      <header
        className={`px-3 sm:px-5 py-2 flex flex-col gap-2 border-b shrink-0 z-10 ${theme.paperRaisedBg} ${theme.ruleBorder}`}
      >
        <div className="flex items-center justify-between gap-2">
          {/* Left: Switch / Load Screen Content */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveSheet('docs')}
              className={`min-h-[38px] px-3 rounded-[8px] border flex items-center gap-1.5 text-[13px] font-semibold cursor-pointer shrink-0 ${theme.paperBg} ${theme.ruleBorder} ${theme.inkText}`}
            >
              <FileText className="w-4 h-4 shrink-0" strokeWidth={1.6} />
              <span className="truncate max-w-[115px] sm:max-w-[200px]">
                {currentDoc.title}
              </span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Lire une capture d’écran ou un PDF"
              className={`min-h-[38px] px-2.5 rounded-[8px] border flex items-center gap-1.5 text-[13px] font-semibold cursor-pointer shrink-0 ${theme.paperBg} ${theme.ruleBorder} ${theme.inkText}`}
            >
              <Camera className="w-4 h-4 shrink-0" strokeWidth={1.6} />
              <span>Capture / PDF</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSheet('paste')}
              title="Coller un texte à lire"
              className={`min-h-[38px] px-2.5 rounded-[8px] border flex items-center gap-1.5 text-[13px] font-semibold cursor-pointer shrink-0 ${theme.paperBg} ${theme.ruleBorder} ${theme.inkText}`}
            >
              <ClipboardPaste className="w-4 h-4 shrink-0" strokeWidth={1.6} />
              <span className="hidden sm:inline">Coller</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSheet('url')}
              title="Ouvrir une page Web (URL)"
              className={`min-h-[38px] px-2.5 rounded-[8px] border flex items-center gap-1.5 text-[13px] font-semibold cursor-pointer shrink-0 ${theme.paperBg} ${theme.ruleBorder} ${theme.inkText}`}
            >
              <Globe className="w-4 h-4 shrink-0" strokeWidth={1.6} />
              <span className="hidden md:inline">Lien Web</span>
            </button>
          </div>

          {/* Right: Android APK Download + Speed (WPM) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setActiveSheet('android')}
              className={`min-h-[38px] px-3 rounded-[8px] border flex items-center gap-1.5 text-[13px] font-semibold cursor-pointer shrink-0 ${theme.accentBg} ${theme.onAccentText} ${theme.accentBorder}`}
            >
              <Download className="w-4 h-4 shrink-0" strokeWidth={1.8} />
              <span>APK v1.2</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSheet('voices')}
              className={`min-h-[38px] px-2.5 rounded-[8px] border flex items-center gap-1.5 text-[13px] font-semibold cursor-pointer shrink-0 ${theme.paperBg} ${theme.ruleBorder} ${theme.inkText}`}
            >
              <Gauge className="w-4 h-4 shrink-0" strokeWidth={1.6} />
              <span className="tabular-nums">{fmtSpeed(speed)}</span>
              <span
                className={`hidden sm:inline text-[12px] tabular-nums ${theme.inkMutedText}`}
              >
                ({fmtWpm(speed)})
              </span>
            </button>
          </div>
        </div>

        {/* Direct 1-Tap Voice Bar (4 Stored Voices: 1/4 Clara | 2/4 Thomas | 3/4 Nicolas | 4/4 Emma) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span
            className={`text-[11px] font-semibold uppercase tracking-[0.06em] shrink-0 mr-1 ${theme.inkMutedText}`}
          >
            4 Voix (verrouillée) :
          </span>
          {FR_VOICES.map((v) => {
            const active = voiceId === v.id;
            return (
              <button
                key={v.id}
                type="button"
                aria-pressed={active}
                onClick={() => handleSelectVoice(v.id, true)}
                className={`min-h-[34px] px-3 rounded-full border text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors duration-150 ${
                  active
                    ? `${theme.accentBg} ${theme.onAccentText} ${theme.accentBorder}`
                    : `${theme.paperBg} ${theme.ruleBorder} ${theme.inkText}`
                }`}
              >
                <Volume2 className="w-3.5 h-3.5 shrink-0" strokeWidth={1.7} />
                <span>{v.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Status banner when extracting screenshot / URL */}
      {statusBanner && (
        <div
          className={`px-4 py-2.5 flex items-center justify-between gap-2 text-[13px] font-semibold border-b ${theme.highlightBg} ${theme.inkText} ${theme.ruleBorder}`}
        >
          <div className="flex items-center gap-2">
            {isExtracting && (
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            )}
            <span>{statusBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="p-1 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ==================== SCREEN CONTENT TO READ ==================== */}
      <main
        ref={mainScrollRef}
        className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-8 pt-6 pb-40 max-w-2xl w-full mx-auto select-text"
      >
        <div
          className={`text-[12px] leading-[18px] font-semibold uppercase tracking-[0.08em] ${theme.accentText}`}
        >
          {currentDoc.kicker} · {currentDoc.when}
        </div>

        {/* Title (Sentence 0) */}
        <h1
          data-sent={0}
          onClick={() => handleStartReadingScreen(0)}
          className={`m-0 mt-1.5 mb-4 font-[family-name:var(--font-serif)] font-semibold text-[25px] sm:text-[28px] leading-[32px] sm:leading-[36px] tracking-[-0.015em] rounded-[6px] cursor-pointer transition-colors duration-200 ${
            activeSentenceIdx === 0
              ? `${theme.highlightBg} ${theme.inkText} ${theme.highlightRing}`
              : theme.inkText
          }`}
        >
          {currentDoc.title}
        </h1>

        <div className={`h-[1px] my-4 ${theme.ruleBg}`} />

        {/* Paragraphs & Sentences */}
        {currentDoc.paragraphs.map((para, pi) => {
          const paraFirstSentIdx = sentCounter;
          return (
            <p
              key={pi}
              onClick={
                bubbleMode === 'pick'
                  ? () => handleStartReadingScreen(paraFirstSentIdx)
                  : undefined
              }
              className={`relative m-0 mb-5 font-[family-name:var(--font-serif)] ${getReadingSizeClass(
                readSize
              )} ${
                bubbleMode === 'pick'
                  ? `p-3 -mx-3 rounded-[10px] border border-dashed cursor-pointer ${theme.accentBorder} ${theme.paperRaisedBg}`
                  : ''
              }`}
            >
              {bubbleMode === 'pick' && (
                <span
                  aria-hidden="true"
                  className={`inline-flex items-center justify-center w-[22px] h-[22px] mr-2 rounded-full text-[12px] font-semibold font-[family-name:var(--font-sans)] align-middle ${theme.accentBg} ${theme.onAccentText}`}
                >
                  {pi + 1}
                </span>
              )}

              {para.map((sent) => {
                const idx = sentCounter++;
                const isAct = idx === activeSentenceIdx;
                const isRead =
                  activeSentenceIdx >= 0 && idx < activeSentenceIdx;
                return (
                  <React.Fragment key={idx}>
                    <span
                      data-sent={idx}
                      onClick={(e) => {
                        if (bubbleMode === 'pick') return;
                        e.stopPropagation();
                        handleStartReadingScreen(idx);
                      }}
                      className={`rounded-[4px] cursor-pointer transition-colors duration-200 ${
                        isAct
                          ? `${theme.highlightBg} ${theme.inkText} ${theme.highlightRing}`
                          : isRead
                            ? theme.inkMutedText
                            : theme.inkText
                      }`}
                    >
                      {sent}
                    </span>{' '}
                  </React.Fragment>
                );
              })}
            </p>
          );
        })}
      </main>

      {/* ==================== FLOATING OVERLAY BUBBLE MODULE ==================== */}

      {/* VISUAL SCANNING WAVE (450ms sweep across screen) */}
      {bubbleMode === 'scan' && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-30 pointer-events-none overflow-hidden"
        >
          <div className="w-full h-16 bg-gradient-to-b from-[#4BA37E]/0 via-[#4BA37E]/30 to-[#4BA37E]/0 border-b-2 border-[#4BA37E] animate-bounce" />
        </div>
      )}

      {/* STATE 1: IDLE FLOATING CIRCLE (44x44dp semi-transparent circle with FishReader logo) */}
      {bubbleMode === 'idle' && (
        <div
          className={`fixed z-30 flex items-center transition-all duration-200 ${getBubbleTopClass(
            bubbleYf
          )} ${
            bubbleSide === 'left'
              ? bubbleTucked
                ? 'left-1'
                : 'left-3'
              : bubbleTucked
                ? 'right-1'
                : 'right-3'
          }`}
        >
          <button
            type="button"
            aria-label="Scanner l’écran et choisir le paragraphe à lire"
            title="Toucher pour scanner l’écran et choisir où commencer la lecture"
            onPointerDown={handleBubblePointerDown}
            onPointerMove={handleBubblePointerMove}
            onPointerUp={handleBubblePointerUp}
            className={`touch-none select-none cursor-grab active:cursor-grabbing w-[46px] h-[46px] rounded-full border border-[#4BA37E]/75 bg-[#141311]/70 backdrop-blur-md text-[#FFFCF5] shadow-lg flex items-center justify-center transition-all duration-200 ${
              bubbleTucked ? 'opacity-65 scale-95' : 'opacity-90 hover:opacity-100'
            }`}
          >
            <span className="relative flex items-center justify-center w-7 h-7 rounded-full bg-[#1E4D3B]/80 border border-[#4BA37E]/60">
              <Volume2 className="w-4 h-4 text-[#8ED9B6]" strokeWidth={1.9} />
            </span>
          </button>
        </div>
      )}

      {/* STATE 2: BUBBLE QUICK MENU SHEET */}
      {bubbleMode === 'menu' && (
        <>
          <div
            onClick={() => setBubbleMode('idle')}
            className="fixed inset-0 z-30 bg-[#14110D]/40"
          />
          <div
            role="dialog"
            aria-label="Actions Fish Reader"
            className={`fixed z-40 left-3 right-3 bottom-3 max-w-md mx-auto rounded-[16px] border p-3 flex flex-col gap-2 shadow-2xl ${theme.paperBg} ${theme.ruleBorder}`}
          >
            <div className="flex items-center justify-between px-2 py-1">
              <div className="flex items-center gap-2">
                <span
                  className={`w-7 h-7 rounded-full grid place-items-center ${theme.accentBg} ${theme.onAccentText}`}
                >
                  <Volume2 className="w-4 h-4" strokeWidth={1.7} />
                </span>
                <span className={`text-[15px] font-semibold ${theme.inkText}`}>
                  Module Fish Reader
                </span>
              </div>
              <button
                type="button"
                aria-label="Fermer"
                onClick={() => setBubbleMode('idle')}
                className={`w-9 h-9 rounded-full grid place-items-center cursor-pointer ${theme.inkMutedText}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className={`h-[1px] ${theme.ruleBg}`} />

            <button
              type="button"
              onClick={() => setBubbleMode('scan')}
              className={`w-full min-h-[52px] px-3.5 py-2.5 rounded-[10px] flex items-center gap-3 text-left cursor-pointer ${theme.accentBg} ${theme.onAccentText}`}
            >
              <Hand className="w-5 h-5 shrink-0" />
              <span className="flex flex-col">
                <span className="text-[15px] leading-[20px] font-semibold">
                  Scanner l’écran et choisir un paragraphe
                </span>
                <span className="text-[12px] leading-[16px] opacity-90">
                  Encadre les paragraphes pour toucher où démarrer
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleStartReadingScreen(0)}
              className={`w-full min-h-[50px] px-3.5 py-2 rounded-[10px] border flex items-center gap-3 text-left cursor-pointer ${theme.paperRaisedBg} ${theme.ruleBorder} ${theme.inkText}`}
            >
              <Play className="w-5 h-5 fill-current shrink-0" strokeWidth={1.6} />
              <span className="flex flex-col">
                <span className="text-[14px] leading-[19px] font-semibold">
                  Lire tout l’écran dès le début
                </span>
                <span className={`text-[12px] ${theme.inkMutedText}`}>
                  Lecteur actif : {currentVoice.shortLabel} · {fmtWpm(speed)}
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={handleReadClipboardNow}
              className={`w-full min-h-[50px] px-3.5 py-2 rounded-[10px] border flex items-center gap-3 text-left cursor-pointer ${theme.paperRaisedBg} ${theme.ruleBorder} ${theme.inkText}`}
            >
              <ClipboardPaste className="w-5 h-5 shrink-0" strokeWidth={1.6} />
              <span className="flex flex-col">
                <span className="text-[14px] leading-[19px] font-semibold">
                  Lire le texte copié (Presse-papiers)
                </span>
                <span className={`text-[12px] ${theme.inkMutedText}`}>
                  Lit ce que vous venez de copier dans une autre appli
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setBubbleMode('idle');
                fileInputRef.current?.click();
              }}
              className={`w-full min-h-[50px] px-3.5 py-2 rounded-[10px] border flex items-center gap-3 text-left cursor-pointer ${theme.paperRaisedBg} ${theme.ruleBorder} ${theme.inkText}`}
            >
              <Camera className="w-5 h-5 shrink-0" strokeWidth={1.6} />
              <span className="flex flex-col">
                <span className="text-[14px] leading-[19px] font-semibold">
                  Lire une capture d’écran ou un PDF
                </span>
                <span className={`text-[12px] ${theme.inkMutedText}`}>
                  Extrait et lit le texte d’une capture d’écran de votre téléphone
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setBubbleMode('idle');
                setActiveSheet('android');
              }}
              className={`w-full min-h-[50px] px-3.5 py-2 rounded-[10px] border flex items-center gap-3 text-left cursor-pointer ${theme.paperRaisedBg} ${theme.accentBorder} ${theme.inkText}`}
            >
              <Smartphone
                className={`w-5 h-5 shrink-0 ${theme.accentText}`}
                strokeWidth={1.7}
              />
              <span className="flex flex-col">
                <span className="text-[14px] leading-[19px] font-semibold">
                  Télécharger l’application Android (FishReader-v1.2.apk)
                </span>
                <span className={`text-[12px] ${theme.inkMutedText}`}>
                  Installe le petit rond discret et la pilule verticale sur Android
                </span>
              </span>
            </button>
          </div>
        </>
      )}

      {/* STATE 3: SCANNING BANNER */}
      {bubbleMode === 'scan' && (
        <div
          role="status"
          className={`fixed z-30 left-3 right-3 top-16 max-w-md mx-auto flex items-center justify-between gap-3 py-2.5 px-4 rounded-full border shadow-lg bg-[#141311]/90 text-[#FFFCF5] border-[#4BA37E]`}
        >
          <div className="flex items-center gap-2.5">
            <Sparkles
              className="w-4 h-4 animate-spin text-[#8ED9B6]"
              strokeWidth={1.8}
            />
            <span className="text-[13px] font-semibold">
              Scan de l’écran en cours (filtrage des en-têtes)…
            </span>
          </div>
        </div>
      )}

      {/* STATE 4: PICK PARAGRAPH BANNER */}
      {bubbleMode === 'pick' && (
        <div
          role="status"
          className="fixed z-30 left-3 right-3 top-16 max-w-md mx-auto flex items-center justify-between gap-2 py-2 pl-4 pr-2 rounded-full shadow-xl bg-[#141311]/92 text-[#FFFCF5] border border-[#4BA37E]"
        >
          <span className="text-[13px] font-semibold leading-[18px] truncate">
            Touchez un paragraphe encadré pour lire d’ici
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => handleStartReadingScreen(0)}
              className="min-h-[32px] px-3 rounded-full text-[12px] font-semibold cursor-pointer bg-[#1E4D3B] text-[#FFFCF5]"
            >
              Tout lire
            </button>
            <button
              type="button"
              onClick={() => setBubbleMode('idle')}
              className="min-h-[32px] px-2.5 rounded-full text-[12px] font-semibold cursor-pointer text-[#D5CFC4]"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* STATE 5A: AUTOMATIC VERTICAL PILL DURING READING [ ◉ / ⋯ ] */}
      {bubbleMode === 'reading' && !playerExpanded && (
        <div
          role="region"
          aria-label="Pilule verticale Fish Reader"
          className={`fixed z-30 flex flex-col items-center justify-between py-1.5 px-1 w-[46px] h-[90px] rounded-full border border-[#4BA37E]/80 bg-[#141311]/82 backdrop-blur-md shadow-2xl transition-all duration-200 ${getBubbleTopClass(
            bubbleYf
          )} ${bubbleSide === 'left' ? 'left-2.5' : 'right-2.5'}`}
        >
          {/* Top: Animated Circle with glowing halo (Pause / Resume without resetting) */}
          <button
            type="button"
            aria-label={
              isPlaying
                ? 'Mettre la lecture en pause'
                : 'Reprendre la lecture à cet endroit'
            }
            title={
              isPlaying
                ? 'Toucher pour mettre en pause'
                : 'Toucher pour reprendre la lecture'
            }
            onClick={handleTogglePlay}
            className="relative w-[36px] h-[36px] rounded-full flex items-center justify-center cursor-pointer active:scale-95"
          >
            {isPlaying && (
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-[#4BA37E]/35 animate-ping"
              />
            )}
            <span
              className={`relative w-[34px] h-[34px] rounded-full flex items-center justify-center border ${
                isPlaying
                  ? 'bg-[#1E4D3B] border-[#8ED9B6] text-[#FFFCF5]'
                  : 'bg-[#26231F] border-[#6B6155] text-[#ECE4D6]'
              }`}
            >
              {isSynthesizingNeural ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#8ED9B6]" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 fill-current" strokeWidth={1.8} />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" strokeWidth={1.8} />
              )}
            </span>
          </button>

          {/* Subtle divider */}
          <span
            aria-hidden="true"
            className="w-5 h-[1px] bg-[#ECE4D6]/20 rounded-full"
          />

          {/* Bottom: Three dots (⋯) to open compact configuration panel */}
          <button
            type="button"
            aria-label="Ouvrir les paramètres de voix et vitesse"
            title="Ouvrir le panneau de configuration (Voix, Vitesse WPM, Stop)"
            onClick={() => setPlayerExpanded(true)}
            className="w-[36px] h-[34px] rounded-full flex items-center justify-center text-[#ECE4D6] hover:text-white cursor-pointer active:scale-95"
          >
            <MoreHorizontal className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>
      )}

      {/* STATE 5B: COMPACT CONFIGURATION PANEL (Opened via ⋯, NO redundant text box) */}
      {bubbleMode === 'reading' && playerExpanded && (
        <div
          role="region"
          aria-label="Panneau de configuration Fish Reader"
          className={`fixed z-30 left-3 right-3 bottom-3 max-w-md mx-auto flex flex-col gap-2.5 p-3.5 rounded-[18px] border shadow-2xl ${theme.paperBg} ${theme.ruleBorder}`}
        >
          {/* 1. Compact Header (No redundant text preview box — text is highlighted directly on screen) */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <FrLiveWave playing={isPlaying} theme={theme} />
              <div className="min-w-0">
                <p
                  className={`m-0 text-[13px] leading-[18px] font-semibold truncate ${theme.inkText}`}
                >
                  {isSynthesizingNeural
                    ? `Chargement de ${currentVoice.shortLabel}…`
                    : `${currentVoice.shortLabel} · Surbrillance directe`}
                </p>
                <p
                  className={`m-0 text-[11px] leading-[15px] tabular-nums ${theme.inkMutedText}`}
                >
                  {`Bloc ${Math.max(1, activeSentenceIdx + 1)}/${
                    activeSentences.length
                  } · ${fmtWpm(speed)}`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPlayerExpanded(false)}
              className={`min-h-[34px] px-3 rounded-full border text-[12px] font-semibold cursor-pointer ${theme.paperRaisedBg} ${theme.ruleBorder} ${theme.inkText}`}
            >
              Replier pilule
            </button>
          </div>

          {/* 2. Direct Voice Selector (Clara Femme | Thomas Homme | Nicolas Homme | Emma EN) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {FR_VOICES.map((v) => {
              const active = voiceId === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => handleSelectVoice(v.id, true)}
                  className={`min-h-[36px] px-2.5 rounded-[8px] border text-[12px] font-semibold cursor-pointer transition-colors duration-150 truncate ${
                    active
                      ? `${theme.accentBg} ${theme.onAccentText} ${theme.accentBorder}`
                      : `${theme.paperRaisedBg} ${theme.ruleBorder} ${theme.inkText}`
                  }`}
                >
                  {v.shortLabel}
                </button>
              );
            })}
          </div>

          {/* 3. Direct WPM Speed Presets & Slider (Pitch-invariant) */}
          <div
            className={`px-3 py-2 rounded-[10px] border flex flex-col gap-1.5 ${theme.paperRaisedBg} ${theme.ruleBorder}`}
          >
            <div className="flex items-center justify-between text-[12px]">
              <span className={`font-semibold ${theme.inkMutedText}`}>
                Vitesse WPM (hauteur tonale fixe)
              </span>
              <span className={`font-semibold tabular-nums ${theme.inkText}`}>
                {fmtSpeed(speed)} · {fmtWpm(speed)}
              </span>
            </div>
            <div className="grid grid-cols-6 gap-1">
              {SPEEDS.map((s) => {
                const active = Math.abs(speed - s) < 0.03;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSpeedUpdate(s)}
                    className={`min-h-[30px] rounded-[6px] text-[11px] font-semibold tabular-nums cursor-pointer ${
                      active
                        ? `${theme.accentBg} ${theme.onAccentText}`
                        : `${theme.paperBg} ${theme.inkText}`
                    }`}
                  >
                    {fmtSpeed(s)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Compact Transport: -1 phr, Pause/Play, +1 phr, Stop (⏹) */}
          <div className="grid grid-cols-4 items-center gap-2">
            <button
              type="button"
              onClick={() => handleBubblePlayerSkip(false)}
              className={`min-h-[42px] rounded-[10px] border flex items-center justify-center gap-1 text-[13px] font-semibold tabular-nums cursor-pointer ${theme.paperRaisedBg} ${theme.ruleBorder} ${theme.inkText}`}
            >
              <Rewind className="w-4 h-4" strokeWidth={1.7} />
              <span>{skipButtonText('−')}</span>
            </button>

            <button
              type="button"
              aria-label={isPlaying ? 'Pause' : 'Reprendre'}
              onClick={handleTogglePlay}
              className={`min-h-[42px] rounded-[10px] border-0 flex items-center justify-center gap-1.5 text-[13px] font-semibold cursor-pointer ${theme.accentBg} ${theme.onAccentText}`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4" strokeWidth={1.8} />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" strokeWidth={1.8} />
                  <span>Lire</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleBubblePlayerSkip(true)}
              className={`min-h-[42px] rounded-[10px] border flex items-center justify-center gap-1 text-[13px] font-semibold tabular-nums cursor-pointer ${theme.paperRaisedBg} ${theme.ruleBorder} ${theme.inkText}`}
            >
              <FastForward className="w-4 h-4" strokeWidth={1.7} />
              <span>{skipButtonText('+')}</span>
            </button>

            <button
              type="button"
              onClick={handleStopBubbleReading}
              className={`min-h-[42px] rounded-[10px] border flex items-center justify-center gap-1.5 text-[13px] font-semibold cursor-pointer ${theme.dangerBorder} ${theme.dangerText}`}
            >
              <StopSquareIcon />
              <span>Stop</span>
            </button>
          </div>

          {/* 5. Quick Actions: Scanner / Choisir paragraphe & Texte copié */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setPlayerExpanded(false);
                setBubbleMode('scan');
              }}
              className={`min-h-[38px] px-3 rounded-[8px] border flex items-center justify-center gap-1.5 text-[12px] font-semibold cursor-pointer ${theme.paperRaisedBg} ${theme.ruleBorder} ${theme.inkText}`}
            >
              <Hand className="w-3.5 h-3.5" />
              <span>Choisir paragraphe</span>
            </button>

            <button
              type="button"
              onClick={handleReadClipboardNow}
              className={`min-h-[38px] px-3 rounded-[8px] border flex items-center justify-center gap-1.5 text-[12px] font-semibold cursor-pointer ${theme.paperRaisedBg} ${theme.ruleBorder} ${theme.inkText}`}
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Texte copié</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================== SHEET 1: PASTE TEXT / CLIPBOARD ==================== */}
      {activeSheet === 'paste' && (
        <div
          role="dialog"
          aria-label="Coller un texte à lire"
          className={`fixed inset-0 z-50 flex flex-col ${theme.paperBg} ${theme.inkText}`}
        >
          <header
            className={`h-[54px] px-4 flex items-center justify-between border-b shrink-0 ${theme.paperRaisedBg} ${theme.ruleBorder}`}
          >
            <h2
              className={`m-0 font-[family-name:var(--font-serif)] font-semibold text-[19px] ${theme.inkText}`}
            >
              Coller un texte à lire
            </h2>
            <button
              type="button"
              onClick={() => setActiveSheet('none')}
              className={`w-10 h-10 rounded-full grid place-items-center cursor-pointer ${theme.inkMutedText}`}
            >
              <X className="w-5 h-5" />
            </button>
          </header>

          <div className="flex-1 min-h-0 p-4 max-w-2xl w-full mx-auto flex flex-col gap-3">
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Touchez ici et collez n’importe quel texte, courriel ou article pour que Fish Reader le lise à voix haute…"
              className={`flex-1 w-full p-4 rounded-[12px] border resize-none font-[family-name:var(--font-serif)] text-[17px] leading-[27px] outline-none ${theme.paperRaisedBg} ${theme.inkMutedBorder} ${theme.inkText}`}
            />

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const txt = await navigator.clipboard.readText();
                    if (txt.trim()) setPasteText(txt);
                  } catch {}
                }}
                className={`min-h-[48px] px-4 rounded-[10px] border flex items-center justify-center gap-2 text-[14px] font-semibold cursor-pointer ${theme.paperRaisedBg} ${theme.inkMutedBorder} ${theme.inkText}`}
              >
                <ClipboardPaste className="w-4 h-4" />
                <span>Coller le presse-papiers</span>
              </button>

              <button
                type="button"
                disabled={!pasteText.trim()}
                onClick={() => {
                  const cleaned = pasteText.trim();
                  if (!cleaned) return;
                  const firstLine = cleaned.split('\n')[0] || cleaned;
                  setPasteText('');
                  loadNewScreenDocument(
                    firstLine,
                    cleaned,
                    'Texte collé',
                    true
                  );
                }}
                className={`flex-1 min-h-[48px] px-4 rounded-[10px] flex items-center justify-center gap-2 text-[15px] font-semibold cursor-pointer disabled:opacity-40 ${theme.accentBg} ${theme.onAccentText}`}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Lire ce texte maintenant</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SHEET 2: OPEN WEB URL ==================== */}
      {activeSheet === 'url' && (
        <div
          role="dialog"
          aria-label="Lire une page Web"
          className={`fixed inset-0 z-50 flex flex-col ${theme.paperBg} ${theme.inkText}`}
        >
          <header
            className={`h-[54px] px-4 flex items-center justify-between border-b shrink-0 ${theme.paperRaisedBg} ${theme.ruleBorder}`}
          >
            <h2
              className={`m-0 font-[family-name:var(--font-serif)] font-semibold text-[19px] ${theme.inkText}`}
            >
              Lire une page Web (URL)
            </h2>
            <button
              type="button"
              onClick={() => setActiveSheet('none')}
              className={`w-10 h-10 rounded-full grid place-items-center cursor-pointer ${theme.inkMutedText}`}
            >
              <X className="w-5 h-5" />
            </button>
          </header>

          <form
            onSubmit={handleExtractUrl}
            className="p-5 max-w-xl w-full mx-auto flex flex-col gap-4"
          >
            <label className={`text-[14px] font-semibold ${theme.inkText}`}>
              Adresse de l’article ou de la page Web
            </label>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://fr.wikipedia.org/wiki/..."
              className={`w-full h-[48px] px-4 rounded-[10px] border text-[15px] outline-none ${theme.paperRaisedBg} ${theme.inkMutedBorder} ${theme.inkText}`}
            />
            <button
              type="submit"
              disabled={!urlInput.trim() || isExtracting}
              className={`w-full min-h-[48px] px-4 rounded-[10px] flex items-center justify-center gap-2 text-[15px] font-semibold cursor-pointer disabled:opacity-40 ${theme.accentBg} ${theme.onAccentText}`}
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Extraction de la page…</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Charger à l’écran et lire</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ==================== SHEET 3: VOICES, WPM CADENCE & DISPLAY ==================== */}
      {activeSheet === 'voices' && (
        <div
          role="dialog"
          aria-label="Voix et débit de parole"
          className={`fixed inset-0 z-50 flex flex-col ${theme.paperBg} ${theme.inkText}`}
        >
          <header
            className={`h-[54px] px-4 flex items-center justify-between border-b shrink-0 ${theme.paperRaisedBg} ${theme.ruleBorder}`}
          >
            <h2
              className={`m-0 font-[family-name:var(--font-serif)] font-semibold text-[19px] ${theme.inkText}`}
            >
              Lecteurs et débit de parole
            </h2>
            <button
              type="button"
              onClick={() => setActiveSheet('none')}
              className={`min-h-[38px] px-3 rounded-[8px] flex items-center gap-1.5 text-[14px] font-semibold cursor-pointer ${theme.accentBg} ${theme.onAccentText}`}
            >
              <Check className="w-4 h-4" />
              <span>Fermer</span>
            </button>
          </header>

          <div className="flex-1 min-h-0 overflow-y-auto p-4 max-w-xl w-full mx-auto flex flex-col gap-4">
            {/* Voice Constancy & Post-Processing Normalization Banner */}
            <div
              className={`rounded-[12px] border p-3.5 flex flex-col gap-1 ${theme.paperRaisedBg} ${theme.accentBorder}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-[12px] font-semibold uppercase tracking-[0.06em] ${theme.accentText}`}
                >
                  4 voix stockées · Constance vocale 100 % verrouillée
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${theme.accentBg} ${theme.onAccentText}`}
                >
                  Active : {currentVoice.slotBadge} · {currentVoice.name}
                </span>
              </div>
              <p className={`m-0 text-[13px] leading-[19px] ${theme.inkMutedText}`}>
                La voix choisie ci-dessous reste strictement constante d’un paragraphe à l’autre et pour toutes vos lectures jusqu’à ce que vous la changiez manuellement. Le post-traitement Piper élimine tout bruit parasite en fin de phrase.
              </p>
            </div>

            {/* 4 Studio Voices (1/4 Clara, 2/4 Thomas, 3/4 Nicolas, 4/4 Emma) */}
            <div className="flex flex-col gap-2.5">
              {FR_VOICES.map((v) => (
                <FrVoiceCard
                  key={v.id}
                  voice={v}
                  selected={voiceId === v.id}
                  sampling={samplingVoiceId === v.id}
                  onSelect={() => {
                    handleSelectVoice(v.id, true);
                    setActiveSheet('none');
                  }}
                  onSample={() => handleSampleVoice(v)}
                  theme={theme}
                />
              ))}
            </div>

            {/* WPM Speaking Rate (Pitch-Preserving WSOLA) */}
            <section
              className={`rounded-[14px] border p-4 flex flex-col gap-3 ${theme.paperRaisedBg} ${theme.ruleBorder}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span
                    className={`text-[12px] font-semibold uppercase tracking-[0.08em] ${theme.inkMutedText}`}
                  >
                    Débit de parole (mots par minute)
                  </span>
                  <span className={`text-[12px] ${theme.inkMutedText}`}>
                    Accélère l’élocution sans rendre la voix aiguë
                  </span>
                </div>
                <div className="text-right">
                  <div
                    className={`font-[family-name:var(--font-serif)] font-semibold text-[24px] leading-none tabular-nums ${theme.inkText}`}
                  >
                    {fmtWpm(speed)}
                  </div>
                  <div
                    className={`text-[12px] font-semibold tabular-nums mt-0.5 ${theme.accentText}`}
                  >
                    {fmtSpeed(speed)}
                  </div>
                </div>
              </div>
              <input
                type="range"
                min={0.75}
                max={2.0}
                step={0.05}
                value={speed}
                onChange={(e) => handleSpeedUpdate(parseFloat(e.target.value))}
                className="w-full h-[36px] cursor-pointer accent-[#1F5F63]"
              />
              <div className="grid grid-cols-5 gap-1">
                {[0.75, 1, 1.25, 1.5, 2].map((s) => {
                  const active = Math.abs(speed - s) < 0.005;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSpeedUpdate(s)}
                      className={`min-h-[42px] rounded-[8px] flex flex-col items-center justify-center text-[12px] font-semibold tabular-nums cursor-pointer ${
                        active
                          ? `${theme.accentBg} ${theme.onAccentText}`
                          : `${theme.inkMutedText}`
                      }`}
                    >
                      <span>{fmtSpeed(s)}</span>
                      <span className="text-[10px] opacity-80">
                        {Math.round(155 * s)} m/m
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Pauses */}
            <section
              className={`rounded-[14px] border p-4 flex flex-col gap-3 ${theme.paperRaisedBg} ${theme.ruleBorder}`}
            >
              <span
                className={`text-[12px] font-semibold uppercase tracking-[0.08em] ${theme.inkMutedText}`}
              >
                Respiration entre les phrases
              </span>
              <FrSegmented
                label="Pauses"
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

            {/* Theme & Font size */}
            <section
              className={`rounded-[14px] border p-4 flex flex-col gap-3 ${theme.paperRaisedBg} ${theme.ruleBorder}`}
            >
              <span
                className={`text-[12px] font-semibold uppercase tracking-[0.08em] ${theme.inkMutedText}`}
              >
                Thème et taille du texte
              </span>
              <FrSegmented
                label="Thème"
                value={activeThemeId}
                onChange={handleSetTheme}
                theme={theme}
                columnsClass="grid-cols-3"
                options={[
                  {value: 'papier', label: 'Papier'},
                  {value: 'sepia', label: 'Sépia'},
                  {value: 'nuit', label: 'Nuit'},
                ]}
              />
              <FrStepper
                value={readSize}
                min={16}
                max={24}
                step={1}
                unit=" px"
                onChange={setReadSize}
                label="Taille de police"
                theme={theme}
              />
            </section>
          </div>
        </div>
      )}

      {/* ==================== SHEET 4: SAVED TEXTS & DOCUMENTS ==================== */}
      {activeSheet === 'docs' && (
        <div
          role="dialog"
          aria-label="Textes disponibles"
          className={`fixed inset-0 z-50 flex flex-col ${theme.paperBg} ${theme.inkText}`}
        >
          <header
            className={`h-[54px] px-4 flex items-center justify-between border-b shrink-0 ${theme.paperRaisedBg} ${theme.ruleBorder}`}
          >
            <h2
              className={`m-0 font-[family-name:var(--font-serif)] font-semibold text-[19px] ${theme.inkText}`}
            >
              Textes à lire
            </h2>
            <button
              type="button"
              onClick={() => setActiveSheet('none')}
              className={`w-10 h-10 rounded-full grid place-items-center cursor-pointer ${theme.inkMutedText}`}
            >
              <X className="w-5 h-5" />
            </button>
          </header>

          <div className="flex-1 min-h-0 overflow-y-auto p-4 max-w-xl w-full mx-auto flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setActiveSheet('paste')}
                className={`min-h-[46px] px-3 rounded-[10px] border flex items-center justify-center gap-1.5 text-[13px] font-semibold cursor-pointer ${theme.paperRaisedBg} ${theme.ruleBorder} ${theme.inkText}`}
              >
                <Plus className="w-4 h-4" />
                <span>Coller</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveSheet('none');
                  fileInputRef.current?.click();
                }}
                className={`min-h-[46px] px-3 rounded-[10px] border flex items-center justify-center gap-1.5 text-[13px] font-semibold cursor-pointer ${theme.paperRaisedBg} ${theme.ruleBorder} ${theme.inkText}`}
              >
                <Camera className="w-4 h-4" />
                <span>Capture / PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSheet('url')}
                className={`min-h-[46px] px-3 rounded-[10px] border flex items-center justify-center gap-1.5 text-[13px] font-semibold cursor-pointer ${theme.paperRaisedBg} ${theme.ruleBorder} ${theme.inkText}`}
              >
                <Globe className="w-4 h-4" />
                <span>Lien Web</span>
              </button>
            </div>

            {docs.map((d) => {
              const isCurrent = d.id === currentDocId;
              return (
                <div
                  key={d.id}
                  className={`rounded-[12px] border p-3.5 flex items-center justify-between gap-3 ${
                    isCurrent
                      ? `${theme.paperRaisedBg} ${theme.accentBorder}`
                      : `${theme.paperRaisedBg} ${theme.ruleBorder}`
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      stopAudioPlayback();
                      setIsPlaying(false);
                      setCurrentDocId(d.id);
                      setActiveSentenceIdx(-1);
                      setActiveSheet('none');
                    }}
                    className="flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <div
                      className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${theme.inkMutedText}`}
                    >
                      {d.kicker} · {d.when}
                    </div>
                    <div
                      className={`font-[family-name:var(--font-serif)] font-semibold text-[16px] leading-[22px] truncate ${theme.inkText}`}
                    >
                      {d.title}
                    </div>
                  </button>

                  <button
                    type="button"
                    aria-label="Lire maintenant"
                    onClick={() => {
                      const sents = [d.title, ...d.paragraphs.flat()];
                      sentencesRef.current = sents;
                      setCurrentDocId(d.id);
                      setActiveSheet('none');
                      setBubbleMode('reading');
                      setActiveSentenceIdx(0);
                      setIsPlaying(true);
                      void playSentenceAtIndex(0, sents, voiceRef.current);
                    }}
                    className={`w-10 h-10 rounded-full grid place-items-center shrink-0 cursor-pointer ${theme.accentBg} ${theme.onAccentText}`}
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </button>

                  {docs.length > 1 && (
                    <button
                      type="button"
                      aria-label="Supprimer"
                      onClick={() => {
                        setDocs((prev) => prev.filter((x) => x.id !== d.id));
                        if (currentDocId === d.id) {
                          const rem = docs.filter((x) => x.id !== d.id);
                          if (rem[0]) setCurrentDocId(rem[0].id);
                        }
                      }}
                      className={`w-9 h-9 rounded-full grid place-items-center shrink-0 cursor-pointer ${theme.inkMutedText}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}

            <button
              type="button"
              onClick={() => {
                setDocs(INITIAL_FR_DOCS);
                setCurrentDocId(INITIAL_FR_DOCS[0].id);
              }}
              className={`mt-2 min-h-[42px] px-3 rounded-[8px] flex items-center justify-center gap-1.5 text-[13px] font-semibold cursor-pointer ${theme.inkMutedText}`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Rétablir les exemples par défaut</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================== SHEET 5: INSTALL NATIVE ANDROID APK ==================== */}
      {activeSheet === 'android' && (
        <div
          role="dialog"
          aria-label="Installer Fish Reader sur Android"
          className={`fixed inset-0 z-50 flex flex-col ${theme.paperBg} ${theme.inkText}`}
        >
          <header
            className={`h-[54px] px-4 flex items-center justify-between border-b shrink-0 ${theme.paperRaisedBg} ${theme.ruleBorder}`}
          >
            <h2
              className={`m-0 font-[family-name:var(--font-serif)] font-semibold text-[19px] ${theme.inkText}`}
            >
              Installer sur téléphone Android (.APK)
            </h2>
            <button
              type="button"
              onClick={() => setActiveSheet('none')}
              className={`w-10 h-10 rounded-full grid place-items-center cursor-pointer ${theme.inkMutedText}`}
            >
              <X className="w-5 h-5" />
            </button>
          </header>

          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 max-w-xl w-full mx-auto flex flex-col gap-4">
            <div
              className={`rounded-[16px] border p-5 flex flex-col gap-3.5 ${theme.paperRaisedBg} ${theme.accentBorder}`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-10 h-10 rounded-full grid place-items-center shrink-0 ${theme.accentBg} ${theme.onAccentText}`}
                >
                  <Smartphone className="w-5 h-5" strokeWidth={1.8} />
                </div>
                <div>
                  <div
                    className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${theme.accentText}`}
                  >
                    Application Android native compilée et signée
                  </div>
                  <div
                    className={`font-[family-name:var(--font-serif)] font-semibold text-[20px] leading-[26px] ${theme.inkText}`}
                  >
                    FishReader-v1.2.apk (Version 1.2 — 4 Voix verrouillées)
                  </div>
                </div>
              </div>

              <p className={`m-0 text-[14px] leading-[21px] ${theme.inkText}`}>
                Ce nouveau fichier <b>FishReader-v1.2.apk</b> possède son propre
                identifiant de version (<code>app.fishreadv2</code> · v1.2) : il{' '}
                <b>s’installe directement sans conflit</b> avec l’ancienne
                version déjà présente sur votre téléphone et ne peut pas être
                confondu avec les anciens fichiers dans vos Téléchargements.
              </p>

              <button
                type="button"
                onClick={() => {
                  try {
                    downloadFishReaderApkClientSide('FishReader-v1.2.apk');
                    setApkDownloaded(true);
                  } catch {
                    window.location.href = '/api/download-apk?v=1.2';
                  }
                }}
                className={`w-full min-h-[54px] px-4 rounded-[12px] border-0 flex items-center justify-center gap-2.5 text-[16px] font-semibold shadow-md cursor-pointer ${theme.accentBg} ${theme.onAccentText}`}
              >
                <Download className="w-5 h-5 shrink-0" strokeWidth={2} />
                <span>
                  {apkDownloaded
                    ? '✓ Téléchargement lancé (FishReader-v1.2.apk)'
                    : 'Télécharger FishReader-v1.2.apk (Version 1.2)'}
                </span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  const shared = await shareFishReaderApkFile(
                    'FishReader-v1.2.apk'
                  );
                  if (!shared) {
                    downloadFishReaderApkClientSide('FishReader-v1.2.apk');
                  }
                  setApkDownloaded(true);
                }}
                className={`w-full min-h-[46px] px-4 rounded-[10px] border flex items-center justify-center gap-2 text-[14px] font-semibold cursor-pointer ${theme.paperBg} ${theme.accentBorder} ${theme.accentText}`}
              >
                <Smartphone className="w-4 h-4 shrink-0" strokeWidth={1.8} />
                <span>
                  Alternative directe : Enregistrer FishReader-v1.2.apk dans mes Fichiers
                </span>
              </button>

              {apkDownloaded && (
                <div
                  className={`p-3 rounded-[10px] text-[13px] leading-[19px] border ${theme.highlightBg} ${theme.inkText} ${theme.highlightRing}`}
                >
                  <b>Fichier FishReader-v1.2.apk prêt !</b> Ouvrez votre
                  application <b>Téléchargements</b> ou <b>Files de Google</b>,
                  repérez le fichier nommé exactement{' '}
                  <b>FishReader-v1.2.apk</b> (45 Ko), puis touchez-le pour
                  lancer l’installation de <b>Fish Reader v1.2</b>.
                </div>
              )}

              {pwaInstallPrompt && (
                <button
                  type="button"
                  onClick={async () => {
                    await pwaInstallPrompt.prompt();
                    const choice = await pwaInstallPrompt.userChoice;
                    if (choice.outcome === 'accepted') {
                      setPwaInstallPrompt(null);
                    }
                  }}
                  className={`w-full min-h-[46px] px-4 rounded-[10px] border flex items-center justify-center gap-2 text-[14px] font-semibold cursor-pointer ${theme.paperBg} ${theme.ruleBorder} ${theme.inkText}`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter aussi le raccourci Web à l’écran d’accueil</span>
                </button>
              )}
            </div>

            {/* Note d'aide spécifique pour l'ouverture avec Files by Google / Edge */}
            <div
              className={`rounded-[14px] border p-4 flex flex-col gap-2.5 ${theme.paperRaisedBg} ${theme.ruleBorder}`}
            >
              <div
                className={`text-[12px] font-semibold uppercase tracking-[0.08em] ${theme.inkMutedText}`}
              >
                Pourquoi le fichier a été renommé FishReader-v1.2.apk
              </div>
              <p className={`m-0 text-[13px] leading-[19px] ${theme.inkMutedText}`}>
                Sur Android, l’ancien fichier <code>FishReader.apk</code> entrait
                en conflit de signature avec la première version installée ou
                ouvrait un ancien fichier mis en cache par Edge :
              </p>
              <ol className={`m-0 pl-4 text-[13px] leading-[20px] space-y-1 ${theme.inkText}`}>
                <li>
                  Touchez le bouton ci-dessus pour télécharger{' '}
                  <b>FishReader-v1.2.apk</b>.
                </li>
                <li>
                  Dans votre application <b>Files (de Google)</b> ou{' '}
                  <b>Téléchargements</b>, touchez bien{' '}
                  <b>FishReader-v1.2.apk</b> (et non l’ancien{' '}
                  <code>FishReader.apk</code>).
                </li>
                <li>
                  Choisissez <b>« Installateur de package »</b> pour installer{' '}
                  <b>Fish Reader v1.2</b>.
                </li>
              </ol>
            </div>

            <div
              className={`rounded-[14px] border p-4 flex flex-col gap-3 ${theme.paperRaisedBg} ${theme.ruleBorder}`}
            >
              <div
                className={`text-[12px] font-semibold uppercase tracking-[0.08em] ${theme.accentText}`}
              >
                Comment l’activer en 30 secondes sur votre Android
              </div>

              <div className="flex items-start gap-3">
                <span
                  className={`w-6 h-6 rounded-full grid place-items-center text-[12px] font-semibold shrink-0 mt-0.5 ${theme.accentBg} ${theme.onAccentText}`}
                >
                  1
                </span>
                <p className={`m-0 text-[14px] leading-[20px] ${theme.inkText}`}>
                  <b>Ouvrez le fichier FishReader-v1.2.apk téléchargé</b> et
                  appuyez sur <b>Installer</b>. Si Google Play Protect affiche un
                  message (application hors Play Store), appuyez sur{' '}
                  <i>Plus de détails</i> puis <i>Installer quand même</i>.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span
                  className={`w-6 h-6 rounded-full grid place-items-center text-[12px] font-semibold shrink-0 mt-0.5 ${theme.accentBg} ${theme.onAccentText}`}
                >
                  2
                </span>
                <p className={`m-0 text-[14px] leading-[20px] ${theme.inkText}`}>
                  Dans l’application <b>Fish Reader</b>, touchez le bouton{' '}
                  <b>« 1. Autoriser Afficher par-dessus d’autres applis »</b>{' '}
                  puis le bouton{' '}
                  <b>« 2. Activer Fish Reader dans Accessibilité »</b>.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span
                  className={`w-6 h-6 rounded-full grid place-items-center text-[12px] font-semibold shrink-0 mt-0.5 ${theme.accentBg} ${theme.onAccentText}`}
                >
                  3
                </span>
                <p className={`m-0 text-[14px] leading-[20px] ${theme.inkText}`}>
                  Appuyez sur{' '}
                  <b>« ▶ Activer le petit rond flottant »</b> : ouvrez ensuite
                  Facebook, Chrome ou vos courriels, touchez le{' '}
                  <b>petit rond discret (◉)</b> pour scanner l’écran, puis
                  touchez <b>directement le paragraphe encadré</b> où commencer
                  la lecture. Le lecteur se replie alors dans la{' '}
                  <b>petite pilule verticale (◉ Pause / ⋯ Réglages)</b> !
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
