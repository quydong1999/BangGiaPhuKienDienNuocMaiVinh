import type {Metadata, Viewport} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Báo giá Phụ kiện Mai Vinh',
  description: 'Báo giá phụ kiện ống nước uPVC Mai Vinh',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Mai Vinh',
  },
};

export const viewport: Viewport = {
  themeColor: '#059669',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="vi">
      <body className="bg-slate-50 text-slate-900 antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
