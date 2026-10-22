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
 * Strips HTML tags, scripts, styles, and navigation boilerplate from raw HTML
 * to extract clean readable paragraphs from any URL.
 */
function extractReadableTextFromHtml(html: string): {
  title: string;
  content: string;
} {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const rawTitle = titleMatch
    ? titleMatch[1].replace(/\s+/g, ' ').trim()
    : 'Page Web importée';

  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ');

  // Extract paragraphs and headings
  const blocks: string[] = [];
  const blockRegex = /<(p|h1|h2|h3|li|blockquote)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(withoutScripts)) !== null) {
    const text = match[2]
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&rsquo;/gi, '’')
      .replace(/&laquo;/gi, '«')
      .replace(/&raquo;/gi, '»')
      .replace(/\s+/g, ' ')
      .trim();

    if (text.length >= 25) {
      blocks.push(text);
    }
  }

  if (blocks.length === 0) {
    const fallback = withoutScripts
      .replace(/<[^>]+>/g, '\n')
      .split('\n')
      .map((l) => l.replace(/\s+/g, ' ').trim())
      .filter((l) => l.length > 30)
      .slice(0, 40)
      .join('\n\n');
    return {title: rawTitle, content: fallback};
  }

  return {
    title: rawTitle,
    content: blocks.slice(0, 60).join('\n\n'),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Mode 1: Extract readable text from a URL
    if (body.url && typeof body.url === 'string') {
      let targetUrl = body.url.trim();
      if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = 'https://' + targetUrl;
      }

      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
        },
      });

      if (!response.ok) {
        return NextResponse.json(
          {error: `Impossible d’ouvrir cette adresse (${response.status}).`},
          {status: 400}
        );
      }

      const html = await response.text();
      const extracted = extractReadableTextFromHtml(html);

      if (!extracted.content.trim()) {
        return NextResponse.json(
          {error: 'Aucun texte lisible détecté sur cette page.'},
          {status: 422}
        );
      }

      return NextResponse.json({
        title: extracted.title,
        text: extracted.content,
        source: new URL(targetUrl).hostname.replace(/^www\./, ''),
      });
    }

    // Mode 2: Extract visible text from a phone screenshot, photo, or PDF using Gemini
    if (body.fileBase64 && body.mimeType) {
      const ai = getGenAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            {
              inlineData: {
                data: body.fileBase64,
                mimeType: body.mimeType,
              },
            },
            {
              text: "Extrais uniquement le texte principal lisible qui apparaît sur cet écran ou ce document, dans l'ordre naturel de lecture. Ignore les icônes de barre d'état (heure, batterie, réseau), les boutons de navigation système et les publicités. Renvoie directement les paragraphes propres, séparés par une ligne vide, sans aucun commentaire d'introduction ni balise markdown.",
            },
          ],
        },
      });

      const extractedText = (response.text || '').trim();
      if (!extractedText) {
        return NextResponse.json(
          {error: 'Aucun texte lisible n’a été détecté sur cette image.'},
          {status: 422}
        );
      }

      const firstLine = extractedText.split('\n')[0]?.trim() || 'Écran capturé';
      const title =
        firstLine.length > 52 ? firstLine.slice(0, 50) + '…' : firstLine;

      return NextResponse.json({
        title,
        text: extractedText,
        source: 'Capture d’écran',
      });
    }

    return NextResponse.json(
      {error: 'Veuillez fournir une URL ou une capture d’écran.'},
      {status: 400}
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erreur lors de l’extraction du texte.';
    return NextResponse.json({error: message}, {status: 500});
  }
}
