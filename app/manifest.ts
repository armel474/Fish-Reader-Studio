import type {MetadataRoute} from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FishReader — Lecteur Vocal Mobile',
    short_name: 'FishReader',
    description:
      'Application mobile de lecture vocale naturelle avec bulle flottante et contrôle de vitesse en temps réel.',
    start_url: '/?mobile=1',
    display: 'standalone',
    background_color: '#090D16',
    theme_color: '#090D16',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}
