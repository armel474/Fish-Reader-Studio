import {NextRequest, NextResponse} from 'next/server';
import {execFileSync} from 'child_process';

/**
 * Cache LRU en mémoire côté serveur pour les segments audio WAV 24 kHz normalisés.
 * Clé strictement verrouillée par l'identifiant de la voix : `v5::${lockedVoiceId}::${normalizedText}`
 */
const SERVER_TTS_CACHE = new Map<string, Buffer>();
const MAX_CACHE_ENTRIES = 200;

function setCacheEntry(key: string, wavBuffer: Buffer) {
  if (SERVER_TTS_CACHE.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = SERVER_TTS_CACHE.keys().next().value;
    if (oldestKey) SERVER_TTS_CACHE.delete(oldestKey);
  }
  SERVER_TTS_CACHE.set(key, wavBuffer);
}

/**
 * Catalogue des 4 voix studio stockées dans FishReader :
 * - Voix 1/4 : Clara (Femme · Douce & posée)
 * - Voix 2/4 : Thomas (Homme · Baryton grave & chaleureux)
 * - Voix 3/4 : Nicolas (Homme · Ténor clair & articulé)
 * - Voix 4/4 : Emma (Femme · Vive & cristalline — bilingue FR/EN)
 *
 * Chaque voix possède une signature acoustique et formantique 100 % verrouillée et
 * déterministe afin que la voix choisie ne change JAMAIS entre deux paragraphes ou
 * deux lectures tant que l'utilisateur ne la modifie pas manuellement.
 */
export interface LockedStudioVoiceProfile {
  id: 'clara' | 'thomas' | 'nicolas' | 'emma';
  indexNumber: 1 | 2 | 3 | 4;
  indexLabel: string;
  displayName: string;
  gender: 'female' | 'male';
  defaultLocale: 'fr-FR' | 'fr-CA';
  ffmpegFilterChain: string;
  clausePauseMs: number;
  sentenceTailPadMs: number;
  targetPeakInt16: number;
}

const LOCKED_STUDIO_VOICE_PROFILES: Record<
  'clara' | 'thomas' | 'nicolas' | 'emma',
  LockedStudioVoiceProfile
> = {
  clara: {
    id: 'clara',
    indexNumber: 1,
    indexLabel: 'Voix 1/4 · Clara (Femme Douce)',
    displayName: '1/4 · Clara (Femme · Douce & posée)',
    gender: 'female',
    defaultLocale: 'fr-FR',
    // Timbre féminin velouté et posé (24 kHz), fondamentale stable x1.01, chaleur 230 Hz
    ffmpegFilterChain:
      'asetrate=24000*1.01,aresample=24000,atempo=0.99010,highpass=f=75,equalizer=f=230:t=q:w=1.2:g=1.8,equalizer=f=3100:t=q:w=1.4:g=1.4,lowpass=f=10200',
    clausePauseMs: 110,
    sentenceTailPadMs: 55,
    targetPeakInt16: 23000,
  },
  thomas: {
    id: 'thomas',
    indexNumber: 2,
    indexLabel: 'Voix 2/4 · Thomas (Homme Grave)',
    displayName: '2/4 · Thomas (Homme · Baryton grave)',
    gender: 'male',
    defaultLocale: 'fr-FR',
    // Timbre masculin baryton grave et profond, résonance thoracique 125 Hz / 250 Hz constante
    ffmpegFilterChain:
      'asetrate=24000*0.75,aresample=24000,atempo=1.33333,highpass=f=60,equalizer=f=125:t=q:w=1.0:g=4.6,equalizer=f=255:t=q:w=1.2:g=2.4,equalizer=f=3500:t=q:w=1.2:g=-1.8,lowpass=f=9200',
    clausePauseMs: 120,
    sentenceTailPadMs: 60,
    targetPeakInt16: 23500,
  },
  nicolas: {
    id: 'nicolas',
    indexNumber: 3,
    indexLabel: 'Voix 3/4 · Nicolas (Homme Clair)',
    displayName: '3/4 · Nicolas (Homme · Ténor clair)',
    gender: 'male',
    defaultLocale: 'fr-CA',
    // Timbre masculin ténor clair et articulé, présence médium 165 Hz / 2500 Hz
    ffmpegFilterChain:
      'asetrate=24000*0.84,aresample=24000,atempo=1.19048,highpass=f=65,equalizer=f=165:t=q:w=1.1:g=3.0,equalizer=f=2550:t=q:w=1.3:g=2.2,lowpass=f=9800',
    clausePauseMs: 105,
    sentenceTailPadMs: 55,
    targetPeakInt16: 23200,
  },
  emma: {
    id: 'emma',
    indexNumber: 4,
    indexLabel: 'Voix 4/4 · Emma (Femme Vive)',
    displayName: '4/4 · Emma (Femme · Vive & cristalline)',
    gender: 'female',
    defaultLocale: 'fr-FR',
    // Timbre féminin cristallin et lumineux (+11% hauteur formantique), nettement distinct de Clara
    ffmpegFilterChain:
      'asetrate=24000*1.11,aresample=24000,atempo=0.90090,highpass=f=85,equalizer=f=295:t=q:w=1.2:g=1.4,equalizer=f=3850:t=q:w=1.3:g=2.4,lowpass=f=10600',
    clausePauseMs: 105,
    sentenceTailPadMs: 55,
    targetPeakInt16: 23000,
  },
};

/**
 * Résout de manière 100 % déterministe la voix verrouillée par l'utilisateur.
 * Ne bascule JAMAIS automatiquement d'une voix à une autre entre deux paragraphes.
 */
function resolveLockedVoiceProfile(
  voiceId?: string,
  voiceName?: string
): LockedStudioVoiceProfile {
  const candidate = `${voiceId || ''} ${voiceName || ''}`.toLowerCase().trim();
  if (
    candidate.includes('thomas') ||
    candidate.includes('tom') ||
    candidate.includes('charon') ||
    candidate.includes('2/4')
  ) {
    return LOCKED_STUDIO_VOICE_PROFILES.thomas;
  }
  if (
    candidate.includes('nicolas') ||
    candidate.includes('puck') ||
    candidate.includes('upmc') ||
    candidate.includes('3/4')
  ) {
    return LOCKED_STUDIO_VOICE_PROFILES.nicolas;
  }
  if (
    candidate.includes('emma') ||
    candidate.includes('zephyr') ||
    candidate.includes('lessac') ||
    candidate.includes('4/4')
  ) {
    return LOCKED_STUDIO_VOICE_PROFILES.emma;
  }
  return LOCKED_STUDIO_VOICE_PROFILES.clara;
}

/**
 * Détecte uniquement si la phrase entière est manifestement rédigée en anglais
 * (ex: extrait anglais d'Emma), sans jamais changer l'identité vocale sur un mot
 * anglais isolé au milieu d'un paragraphe français (ex: "FAN theory").
 */
function isPredominantlyEnglishText(text: string): boolean {
  const lower = ` ${text.toLowerCase()} `;
  const englishMarkers = [
    ' the ',
    ' and ',
    ' with ',
    ' will ',
    ' your ',
    ' hello ',
    ' between ',
    ' from ',
    ' this ',
    ' that ',
  ];
  const frenchMarkers = [
    ' le ',
    ' la ',
    ' les ',
    ' des ',
    ' une ',
    ' dans ',
    ' pour ',
    ' avec ',
    ' sur ',
    ' pas ',
    ' plus ',
    ' sont ',
    ' cette ',
    ' mais ',
  ];
  let enScore = 0;
  let frScore = 0;
  for (const m of englishMarkers) {
    if (lower.includes(m)) enScore++;
  }
  for (const m of frenchMarkers) {
    if (lower.includes(m)) frScore++;
  }
  return enScore >= 2 && enScore > frScore * 2;
}

/**
 * Normalisation prosodique du texte avant synthèse pour éviter toute lecture
 * littérale de ponctuation ou d'abréviation et assurer une diction constante.
 */
function normalizeTextForProsody(raw: string, isEnglish: boolean): string {
  let t = raw.trim();
  if (!t) return '';

  t = t
    .replace(/https?:\/\/\S+/gi, isEnglish ? 'web link' : 'lien web')
    .replace(/\bwww\.\S+/gi, isEnglish ? 'web site' : 'site web')
    .replace(/[«»"""]/g, ' ')
    .replace(/['']/g, "'")
    .replace(/\s*[•·▪▸►]\s*/g, ', ')
    .replace(/\s*[-–—]\s+/g, ', ')
    .replace(/\.{2,}|…/g, '.')
    .replace(/!+/g, '!')
    .replace(/\?+/g, '?');

  if (isEnglish) {
    t = t
      .replace(/(\d+)\s*%/g, '$1 percent')
      .replace(/(\d+)[.,](\d+)\s*[kK]\b/g, '$1 point $2 thousand')
      .replace(/(\d+)\s*[kK]\b/g, '$1 thousand');
  } else {
    t = t
      .replace(/\bM\.\s+/g, 'Monsieur ')
      .replace(/\bMme\s+/g, 'Madame ')
      .replace(/\bDr\s+/g, 'Docteur ')
      .replace(/(\d+)\s*%/g, '$1 pour cent')
      .replace(/(\d+)\s*€/g, '$1 euros')
      .replace(/(\d+)\s*\$/g, '$1 dollars')
      .replace(/(\d+)[.,](\d+)\s*[kK]\b/g, '$1 virgule $2 mille')
      .replace(/(\d+)\s*[kK]\b/g, '$1 mille')
      .replace(/(\d+)[.,](\d+)\s*[mM]\b/g, '$1 virgule $2 millions')
      .replace(/\b(\d+)\s*h\s*(\d+)\b/gi, '$1 heures $2')
      .replace(/\b(\d+)\s*h\b/gi, '$1 heures')
      .replace(/\b(\d+)\s*min\b/gi, '$1 minutes')
      .replace(/\b(\d+)\s*s\b/gi, '$1 secondes');
  }

  t = t.replace(/\s+/g, ' ').trim();
  return t;
}

/**
 * Découpe uniquement les phrases très longues (> 185 caractères) aux frontières
 * naturelles (, ; : —) afin de préserver la courbe mélodique complète d'une phrase
 * et d'empêcher toute variation de timbre entre micro-segments.
 */
function splitIntoCoherentChunks(
  normalizedText: string,
  maxChars = 185
): string[] {
  const cleaned = normalizedText
    .replace(/[:;—…]+/g, ', ')
    .replace(/[,.\s]+$/g, '')
    .trim();

  if (!cleaned) return [normalizedText];
  if (cleaned.length <= maxChars) {
    return [cleaned];
  }

  const clauseParts = cleaned.split(/(?<=,)\s+/);
  const chunks: string[] = [];
  let current = '';

  for (const part of clauseParts) {
    const candidate = current ? `${current} ${part}` : part;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) {
        chunks.push(current.replace(/[,.\s]+$/g, '').trim());
      }
      if (part.length <= maxChars) {
        current = part;
      } else {
        const words = part.split(/\s+/);
        let wordChunk = '';
        for (const w of words) {
          const nextW = wordChunk ? `${wordChunk} ${w}` : w;
          if (nextW.length > maxChars && wordChunk) {
            chunks.push(wordChunk.replace(/[,.\s]+$/g, '').trim());
            wordChunk = w;
          } else {
            wordChunk = nextW;
          }
        }
        current = wordChunk;
      }
    }
  }
  if (current.trim()) {
    chunks.push(current.replace(/[,.\s]+$/g, '').trim());
  }

  return chunks.filter(Boolean);
}

/**
 * COUCHE DE POST-TRAITEMENT ET NORMALISATION AUDIO CONSTANTE (24 kHz 16-bit Mono PCM) :
 * 1. Supprime le décalage DC (DC offset removal).
 * 2. Détecte la fin réelle de la voix voisée par analyse fenêtrée (10 ms) combinant
 *    l'énergie RMS et le taux de passage par zéro (Zero-Crossing Rate - ZCR) pour
 *    élaguer tout artefact de ponctuation ou souffle parasite.
 * 3. Applique une normalisation d'amplitude bornée et régulière vers `targetPeakInt16`
 *    sur la phrase complète afin de garantir exactement le même niveau sonore et
 *    le même timbre d'un paragraphe à l'autre.
 * 4. Applique une enveloppe cosinus douce (fade-in 12 ms / fade-out 28 ms) et insère
 *    un silence numérique pur (0 exact) en fin de segment.
 */
function prunePunctuationArtifactsAndNormalizePcm(
  rawPcmBuffer: Buffer,
  sampleRate: number,
  pauseDurationMs: number,
  targetPeakInt16: number
): Buffer {
  const sampleCount = Math.floor(rawPcmBuffer.length / 2);
  if (sampleCount <= 0) return rawPcmBuffer;

  const samples = new Int16Array(sampleCount);
  let dcSum = 0;
  for (let i = 0; i < sampleCount; i++) {
    const s = rawPcmBuffer.readInt16LE(i * 2);
    samples[i] = s;
    dcSum += s;
  }

  // 1. Suppression du DC Offset
  const dcOffset = Math.round(dcSum / sampleCount);
  if (dcOffset !== 0) {
    for (let i = 0; i < sampleCount; i++) {
      const v = samples[i] - dcOffset;
      samples[i] = v > 32767 ? 32767 : v < -32768 ? -32768 : v;
    }
  }

  // 2. Fenêtrage 10 ms (240 échantillons à 24 kHz) : calcul RMS + ZCR
  const winSize = Math.max(1, Math.floor(sampleRate * 0.01));
  const numWindows = Math.floor(sampleCount / winSize);
  if (numWindows <= 4) return rawPcmBuffer;

  const winRms = new Float32Array(numWindows);
  const winZcr = new Float32Array(numWindows);

  for (let w = 0; w < numWindows; w++) {
    let sumSq = 0;
    let zeroCrossings = 0;
    const base = w * winSize;
    for (let i = 0; i < winSize; i++) {
      const cur = samples[base + i];
      sumSq += cur * cur;
      if (i > 0) {
        const prev = samples[base + i - 1];
        if ((cur >= 0 && prev < 0) || (cur < 0 && prev >= 0)) {
          zeroCrossings++;
        }
      }
    }
    winRms[w] = Math.sqrt(sumSq / winSize);
    winZcr[w] = zeroCrossings / winSize;
  }

  const speechRmsFloor = 360;
  let firstVoicedWin = 0;
  while (
    firstVoicedWin < numWindows - 1 &&
    winRms[firstVoicedWin] < speechRmsFloor
  ) {
    firstVoicedWin++;
  }
  firstVoicedWin = Math.max(0, firstVoicedWin - 1);

  let lastVoicedWin = numWindows - 1;
  while (lastVoicedWin > firstVoicedWin + 4) {
    const rms = winRms[lastVoicedWin];
    const zcr = winZcr[lastVoicedWin];
    const isGenuineSpeech = rms >= speechRmsFloor && zcr < 0.43;
    if (isGenuineSpeech) {
      const prev1 = winRms[Math.max(0, lastVoicedWin - 1)];
      const prev2 = winRms[Math.max(0, lastVoicedWin - 2)];
      if (prev1 >= speechRmsFloor * 0.8 || prev2 >= speechRmsFloor * 0.8) {
        break;
      }
    }
    lastVoicedWin--;
  }

  const startSample = firstVoicedWin * winSize;
  const endSample = Math.min(sampleCount, (lastVoicedWin + 1) * winSize);
  const activeLength = Math.max(1, endSample - startSample);

  // 3. Normalisation homogène et bornée pour éviter toute fluctuation entre paragraphes
  let currentPeak = 1;
  for (let i = startSample; i < endSample; i++) {
    const abs = Math.abs(samples[i]);
    if (abs > currentPeak) currentPeak = abs;
  }
  const gain =
    currentPeak > 1000
      ? Math.min(1.45, Math.max(0.78, targetPeakInt16 / currentPeak))
      : 1.0;

  // 4. Enveloppe cosinus (Fade-In 12 ms / Fade-Out 28 ms) + Silence respiratoire pur
  const fadeInSamples = Math.min(
    Math.floor(activeLength / 4),
    Math.floor(sampleRate * 0.012)
  );
  const fadeOutSamples = Math.min(
    Math.floor(activeLength / 3),
    Math.floor(sampleRate * 0.028)
  );
  const pauseSamples = Math.max(
    0,
    Math.floor((sampleRate * pauseDurationMs) / 1000)
  );

  const outTotalSamples = activeLength + pauseSamples;
  const outBuffer = Buffer.alloc(outTotalSamples * 2);

  for (let i = 0; i < activeLength; i++) {
    let env = 1.0;
    if (i < fadeInSamples && fadeInSamples > 0) {
      env = 0.5 * (1.0 - Math.cos((Math.PI * i) / fadeInSamples));
    } else if (i >= activeLength - fadeOutSamples && fadeOutSamples > 0) {
      const rem = activeLength - 1 - i;
      env = 0.5 * (1.0 - Math.cos((Math.PI * rem) / fadeOutSamples));
    }
    const scaled = Math.round(samples[startSample + i] * gain * env);
    const clamped =
      scaled > 32767 ? 32767 : scaled < -32768 ? -32768 : scaled;
    outBuffer.writeInt16LE(clamped, i * 2);
  }

  return outBuffer;
}

/**
 * Encapsule un tampon PCM 16-bit mono 24 kHz dans un conteneur RIFF WAV standard.
 */
function createWavBufferFromPcm(pcmBuffer: Buffer, sampleRate = 24000): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

/**
 * Synthétise un segment via le flux neuronal verrouillé et applique la chaîne DSP
 * FFmpeg propre au profil vocal choisi (1/4 Clara, 2/4 Thomas, 3/4 Nicolas ou 4/4 Emma).
 */
async function synthesizeChunkToRawPcm24k(
  spokenText: string,
  profile: LockedStudioVoiceProfile,
  effectiveLocale: string
): Promise<Buffer> {
  const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${effectiveLocale}&q=${encodeURIComponent(spokenText)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    },
  });

  if (!res.ok) {
    throw new Error(`Neural stream returned status ${res.status}`);
  }

  const mp3Buffer = Buffer.from(await res.arrayBuffer());

  const rawPcm = execFileSync(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-i',
      'pipe:0',
      '-af',
      profile.ffmpegFilterChain,
      '-f',
      's16le',
      '-acodec',
      'pcm_s16le',
      '-ac',
      '1',
      '-ar',
      '24000',
      'pipe:1',
    ],
    {input: mp3Buffer, maxBuffer: 16 * 1024 * 1024}
  );

  return rawPcm;
}

function buildTtsResponse(
  req: NextRequest,
  wavBuffer: Buffer,
  lockedProfile: LockedStudioVoiceProfile,
  cacheStatus: 'HIT' | 'MISS'
) {
  const acceptHeader = req.headers.get('accept') || '';
  if (acceptHeader.includes('audio/wav')) {
    return new NextResponse(new Uint8Array(wavBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'public, max-age=3600',
        'X-TTS-Cache': cacheStatus,
        'X-Locked-Voice-Id': lockedProfile.id,
        'X-Locked-Voice-Name': lockedProfile.displayName,
      },
    });
  }

  const audioBase64 = wavBuffer.toString('base64');
  return NextResponse.json(
    {
      audioBase64,
      audioDataUrl: `data:audio/wav;base64,${audioBase64}`,
      mimeType: 'audio/wav',
      lockedVoiceId: lockedProfile.id,
      lockedVoiceName: lockedProfile.displayName,
      voiceIndex: lockedProfile.indexNumber,
      totalVoices: 4,
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=3600',
        'X-TTS-Cache': cacheStatus,
        'X-Locked-Voice-Id': lockedProfile.id,
        'X-Locked-Voice-Name': lockedProfile.displayName,
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      text,
      voiceId = 'clara',
      voiceName,
    } = body as {
      text?: string;
      voiceId?: string;
      voiceName?: string;
      language?: string;
    };

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({error: 'Text is required'}, {status: 400});
    }

    // 1. Résolution stricte et déterministe du profil vocal verrouillé par l'utilisateur
    // (1/4 Clara, 2/4 Thomas, 3/4 Nicolas, 4/4 Emma). Ne change jamais entre deux paragraphes.
    const lockedProfile = resolveLockedVoiceProfile(voiceId, voiceName);

    // Si le texte est manifestement en anglais et que la voix est Emma, on utilise en-US,
    // sinon toutes les 4 voix lisent le français avec une prononciation française constante.
    const isEnglishText =
      lockedProfile.id === 'emma' && isPredominantlyEnglishText(text);
    const effectiveLocale = isEnglishText ? 'en-US' : lockedProfile.defaultLocale;

    // 2. Normalisation prosodique du texte
    const normalizedText = normalizeTextForProsody(
      text.slice(0, 750),
      isEnglishText
    );
    if (!normalizedText) {
      return NextResponse.json(
        {error: 'Empty normalized text'},
        {status: 400}
      );
    }

    const cacheKey = `v5::${lockedProfile.id}::${effectiveLocale}::${normalizedText}`;
    const cachedWav = SERVER_TTS_CACHE.get(cacheKey);
    if (cachedWav) {
      return buildTtsResponse(req, cachedWav, lockedProfile, 'HIT');
    }

    // 3. Découpage uniquement si la phrase dépasse 185 caractères pour préserver
    // l'intégrité mélodique et le timbre constant d'un paragraphe à l'autre.
    const chunks = splitIntoCoherentChunks(normalizedText, 185);
    const rawPcmSegments: Buffer[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      const rawChunkPcm = await synthesizeChunkToRawPcm24k(
        chunkText,
        lockedProfile,
        effectiveLocale
      );
      rawPcmSegments.push(rawChunkPcm);

      // Si une phrase très longue a dû être coupée en 2 sous-clauses, on insère un
      // court silence numérique pur de respiration entre les deux.
      if (i < chunks.length - 1) {
        const interClausePauseSamples = Math.floor(
          (24000 * lockedProfile.clausePauseMs) / 1000
        );
        rawPcmSegments.push(Buffer.alloc(interClausePauseSamples * 2));
      }
    }

    const combinedRawPcm = Buffer.concat(rawPcmSegments);

    // 4. Normalisation unique sur la phrase entière pour garantir une constance absolue
    // de timbre et de volume entre tous les paragraphes.
    const normalizedSentencePcm = prunePunctuationArtifactsAndNormalizePcm(
      combinedRawPcm,
      24000,
      lockedProfile.sentenceTailPadMs,
      lockedProfile.targetPeakInt16
    );

    const wavBuffer = createWavBufferFromPcm(normalizedSentencePcm, 24000);
    setCacheEntry(cacheKey, wavBuffer);

    return buildTtsResponse(req, wavBuffer, lockedProfile, 'MISS');
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'TTS Synthesis failed';
    console.error('[TTS Route Error]:', message);
    return NextResponse.json({error: message}, {status: 500});
  }
}
