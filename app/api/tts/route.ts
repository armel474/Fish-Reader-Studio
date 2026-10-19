import {GoogleGenAI} from '@google/genai';
import {NextRequest, NextResponse} from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Server-side in-memory LRU cache to eliminate latency on repeated sentences, voice samples, and rewinds
const SERVER_TTS_CACHE = new Map<string, string>();
const MAX_CACHE_ENTRIES = 250;

const ALLOWED_VOICES = new Set(['Kore', 'Charon', 'Zephyr', 'Puck', 'Fenrir']);

function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY non configurée sur le serveur.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Normalizes editorial typography (non-breaking spaces, French guillemets,
 * typographic dashes, and symbols) into clean acoustic text so the neural TTS
 * model produces smooth liaisons and zero micro-stutters.
 */
function normalizeTextForTts(rawText: string, language: 'fr' | 'en'): string {
  let cleaned = rawText
    // Replace narrow non-breaking spaces and regular non-breaking spaces with standard space
    .replace(/[\u00A0\u202F\u2009]/g, ' ')
    // Replace guillemets with soft quotation marks that don't cause unnatural glottal stops
    .replace(/[«»“”]/g, '"')
    // Replace typographic apostrophes with standard apostrophe for natural French elisions (l', d', qu')
    .replace(/[’‘]/g, "'")
    // Normalize em-dashes into a natural comma-like prosodic pause
    .replace(/\s*—\s*/g, ', ')
    // Collapse multiple spaces
    .replace(/\s+/g, ' ')
    .trim();

  if (language === 'fr') {
    // Remove space before French high punctuation so tokenizer doesn't treat ':' or ';' as isolated tokens
    cleaned = cleaned.replace(/\s+([:;?!])/g, '$1');
  }

  return cleaned;
}

/**
 * Returns a tailored studio voice direction prompt per voice persona and language
 * so that Clara (Kore), Thomas (Charon), and Emma (Zephyr) sound ultra-fluid,
 * warm, human, and natural.
 */
function getEditorialStyleInstruction(
  voiceName: string,
  language: 'fr' | 'en',
  voiceId?: string
): string {
  if (language === 'en' || voiceId === 'emma') {
    return 'Warm, fluid, natural studio audiobook narrator. Smooth connected phrasing, gentle human breathing, calm editorial cadence, and expressive natural intonation with zero robotic stiffness.';
  }

  if (voiceName === 'Charon' || voiceId === 'thomas') {
    return "Narrateur francophone de livre audio haut de gamme, à la voix grave, posée, chaleureuse et enveloppante. Lecture extrêmement fluide et continue, liaisons françaises naturelles, souffle calme, rythme régulier et diction humaine très douce sans aucune rigidité robotique.";
  }

  // Default French studio voice (Clara / Kore)
  return "Narratrice éditoriale francophone de studio à la voix chaleureuse, limpide, posée et très fluide. Intonation humaine naturelle, liaisons françaises parfaites, prosodie douce et continue digne d'un livre audio littéraire, sans aucune saccade ni tonalité robotique.";
}

/**
 * Ensures the returned base64 audio buffer has a valid 44-byte RIFF WAV header
 * (24kHz, 16-bit, mono) so Web Audio API and HTMLAudioElement decode it seamlessly.
 */
function ensureWavBuffer(rawBuffer: Buffer, sampleRate = 24000): Buffer {
  if (
    rawBuffer.length >= 4 &&
    rawBuffer.toString('ascii', 0, 4) === 'RIFF'
  ) {
    return rawBuffer;
  }

  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = rawBuffer.length;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size (PCM)
  header.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, rawBuffer]);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawText = (body.text || '').trim();
    const language: 'fr' | 'en' =
      body.language === 'en' || body.voiceId === 'emma' ? 'en' : 'fr';
    const requestedVoice = body.voiceName || 'Kore';
    const voiceName = ALLOWED_VOICES.has(requestedVoice)
      ? requestedVoice
      : language === 'en'
        ? 'Zephyr'
        : 'Kore';

    if (!rawText) {
      return NextResponse.json(
        {error: 'Le texte à synthétiser est vide.'},
        {status: 400}
      );
    }

    const normalizedText = normalizeTextForTts(rawText, language);
    const cacheKey = `${voiceName}::${language}::${normalizedText}`;

    const cachedWavBase64 = SERVER_TTS_CACHE.get(cacheKey);
    if (cachedWavBase64) {
      return NextResponse.json({
        audioBase64: cachedWavBase64,
        audioDataUrl: `data:audio/wav;base64,${cachedWavBase64}`,
        voiceName,
        sampleRate: 24000,
        cached: true,
      });
    }

    const styleInstruction = getEditorialStyleInstruction(
      voiceName,
      language,
      body.voiceId
    );

    const ai = getGenAIClient();

    let base64Audio: string | undefined;
    const modelsToTry = ['gemini-3.8-flash-lite-tts', 'gemini-3.8-flash-tts'];

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: normalizedText,
                  speechMetadata: {
                    style: styleInstruction,
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName,
                },
              },
            },
          },
        });

        const inlineData =
          response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
        if (inlineData?.data) {
          base64Audio = inlineData.data;
          break;
        }
      } catch {
        // Try fallback neural TTS model if the first encounters a transient error
      }
    }

    if (!base64Audio) {
      return NextResponse.json(
        {error: 'Aucune donnée audio générée par le modèle neuronal.'},
        {status: 502}
      );
    }

    const rawBytes = Buffer.from(base64Audio, 'base64');
    const wavBytes = ensureWavBuffer(rawBytes, 24000);
    const wavBase64 = wavBytes.toString('base64');

    if (SERVER_TTS_CACHE.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = SERVER_TTS_CACHE.keys().next().value;
      if (oldestKey) SERVER_TTS_CACHE.delete(oldestKey);
    }
    SERVER_TTS_CACHE.set(cacheKey, wavBase64);

    return NextResponse.json({
      audioBase64: wavBase64,
      audioDataUrl: `data:audio/wav;base64,${wavBase64}`,
      voiceName,
      sampleRate: 24000,
      cached: false,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erreur lors de la synthèse vocale neuronale.';
    return NextResponse.json({error: message}, {status: 500});
  }
}
