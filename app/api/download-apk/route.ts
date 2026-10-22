import {NextResponse} from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const v12Path = path.join(process.cwd(), 'public', 'FishReader-v1.2.apk');
    const fallbackPath = path.join(process.cwd(), 'public', 'FishReader.apk');
    const apkPath = fs.existsSync(v12Path) ? v12Path : fallbackPath;
    const fileBuffer = fs.readFileSync(apkPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': 'attachment; filename="FishReader-v1.2.apk"',
        'Content-Length': String(fileBuffer.length),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch {
    return NextResponse.json(
      {error: 'Fichier FishReader-v1.2.apk introuvable sur le serveur.'},
      {status: 404}
    );
  }
}
