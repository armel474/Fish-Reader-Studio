import type {Metadata, Viewport} from 'next';
import {Literata, Source_Sans_3, JetBrains_Mono} from 'next/font/google';
import './globals.css';

const literata = Literata({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
});

const sourceSans3 = Source_Sans_3({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
});

export const viewport: Viewport = {
  themeColor: '#1F5F63',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'FishReader Studio — Android Overlay & Local Neural TTS',
  description:
    'Simulateur interactif Android et architecture Kotlin complète pour FishReader : widget flottant escamotable Jetpack Compose, extraction AccessibilityService, fallback OCR ML Kit et synthèse vocale hors ligne Sherpa-ONNX / Piper TTS.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FishReader',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'FishReader Studio — Android Overlay & Local Neural TTS',
    description:
      'Simulateur interactif Android et architecture Kotlin complète pour FishReader : widget flottant escamotable Jetpack Compose, extraction AccessibilityService, fallback OCR ML Kit et synthèse vocale hors ligne Sherpa-ONNX / Piper TTS.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FishReader Studio — Android Overlay & Local Neural TTS',
    description:
      'Simulateur interactif Android et architecture Kotlin complète pour FishReader : widget flottant escamotable Jetpack Compose, extraction AccessibilityService, fallback OCR ML Kit et synthèse vocale hors ligne Sherpa-ONNX / Piper TTS.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html
      lang="fr-CA"
      suppressHydrationWarning
      className={`${literata.variable} ${sourceSans3.variable} ${jetbrainsMono.variable}`}
    >
      <body
        suppressHydrationWarning
        className="bg-[#F7F2E8] text-[#2A241D] font-sans antialiased selection:bg-[#F3DC9A] selection:text-[#2A241D]"
      >
        {children}
      </body>
    </html>
  );
}
