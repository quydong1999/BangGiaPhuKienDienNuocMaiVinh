import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Báo giá Phụ kiện Mai Vinh',
    short_name: 'Mai Vinh',
    description: 'Báo giá phụ kiện ống nước uPVC Mai Vinh',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#059669',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      }
    ],
  };
}
