import type {Metadata} from 'next';
import {Plus_Jakarta_Sans, DM_Sans, JetBrains_Mono} from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'FishReader Studio — Android Overlay & Local Neural TTS',
  description:
    'Simulateur interactif Android et architecture Kotlin complète pour FishReader : widget flottant escamotable Jetpack Compose, extraction AccessibilityService, fallback OCR ML Kit et synthèse vocale hors ligne Sherpa-ONNX / Piper TTS.',
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
      lang="fr"
      suppressHydrationWarning
      className={`${plusJakarta.variable} ${dmSans.variable} ${jetbrainsMono.variable} dark`}
    >
      <body
        suppressHydrationWarning
        className="bg-[#0B0F17] text-slate-100 font-sans antialiased selection:bg-cyan-500/30 selection:text-cyan-200"
      >
        {children}
      </body>
    </html>
  );
}
