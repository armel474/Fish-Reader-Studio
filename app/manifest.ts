import type {MetadataRoute} from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Fish Reader — Lecteur d’écran et bulle flottante',
    short_name: 'FishReader',
    description:
      'Module de lecture vocale avec bulle flottante par-dessus vos applications, choix direct du lecteur (Femme/Homme) et débit en mots par minute.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#F7F2E8',
    theme_color: '#1F5F63',
    orientation: 'portrait',
    icons: [
      {
        src: '/pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
    share_target: {
      action: '/',
      method: 'GET',
      enctype: 'application/x-www-form-urlencoded',
      params: {
        title: 'title',
        text: 'text',
        url: 'url',
      },
    },
  };
}
