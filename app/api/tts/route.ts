import {GoogleGenAI} from '@google/genai';
import {NextRequest, NextResponse} from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
 * Ensures the returned base64 audio buffer has a valid 44-byte RIFF WAV header
 * (24kHz, 16-bit, mono) so that HTMLAudioElement can play it seamlessly.
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
    const text = (body.text || '').trim();
    const language = body.language === 'en' ? 'en' : 'fr';
    const voiceName = body.voiceName || 'Kore';

    if (!text) {
      return NextResponse.json(
        {error: 'Le texte à synthétiser est vide.'},
        {status: 400}
      );
    }

    const styleInstruction =
      language === 'fr'
        ? 'Narrateur éditorial français chaleureux, fluide, naturel et posé, avec des liaisons naturelles et un rythme de lecture agréable.'
        : 'Warm, fluid, natural editorial narrator with smooth pacing and human intonation.';

    const ai = getGenAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text,
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
    const base64Audio = inlineData?.data;

    if (!base64Audio) {
      return NextResponse.json(
        {error: 'Aucune donnée audio générée par le modèle neuronal.'},
        {status: 502}
      );
    }

    const rawBytes = Buffer.from(base64Audio, 'base64');
    const wavBytes = ensureWavBuffer(rawBytes, 24000);

    return NextResponse.json({
      audioDataUrl: `data:audio/wav;base64,${wavBytes.toString('base64')}`,
      voiceName,
      sampleRate: 24000,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erreur lors de la synthèse vocale neuronale.';
    return NextResponse.json({error: message}, {status: 500});
  }
}
