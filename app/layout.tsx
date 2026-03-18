import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import QueryProvider from '@/components/providers/query-provider';
import { SkeletonProvider } from '@/components/providers/skeleton-provider';
import BusinessSchema from '@/components/providers/BusinessSchema';

const inter = Inter({
  subsets: ['vietnamese'],
  display: 'swap',
  variable: '--font-inter',
});

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

export const metadata: Metadata = {
  title: {
    template: '%s | Điện nước Mai Vinh - Bình Định',
    default: 'Báo giá các thiết bị, phụ kiện điện nước gia dụng chuyên nghiệp | Điện nước Mai Vinh - Bình Định',
  },
  description: 'Chuyên cung cấp sỉ, lẻ tất cả các loại thiết bị, phụ kiện, sản phẩm điện nước gia dụng tại nhà chuyên nghiệp, uy tín, chất lượng.',
  keywords: ['phụ kiện', 'ống nước', 'uPVC', 'Mai Vinh', 'điện nước', 'dây điện', 'báo giá', 'Đồng Lâm', 'Thắng Kiên', 'Cát Khánh', 'Điện nước Mai Vinh'],
  openGraph: {
    title: 'Báo giá điện nước Mai Vinh | Điện nước Mai Vinh - Bình Định',
    description: 'Chuyên cung cấp sỉ, lẻ tất cả các loại thiết bị, phụ kiện, sản phẩm điện nước gia dụng tại nhà chuyên nghiệp, uy tín, chất lượng.',
    url: `${baseUrl}`,
    siteName: 'Báo giá điện nước Mai Vinh - Bình Định',
    images: [
      {
        url: `${baseUrl}/diennuocmaivinh.webp`,
        width: 1200,
        height: 630,
        alt: 'Báo giá điện nước Mai Vinh',
      },
    ],
    locale: 'vi_VN',
    phoneNumbers: ['0982390943', '0976576443'],
    type: 'website',
    countryName: 'Việt Nam',
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: `${baseUrl}`,
  },
  metadataBase: new URL(`${baseUrl}`),
};

export const viewport: Viewport = {
  themeColor: '#059669',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${inter.variable}`}>
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" />
      </head>
      <body className={`bg-slate-50 text-slate-900 antialiased font-sans`} suppressHydrationWarning>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-emerald-600">
          Chuyển đến nội dung chính
        </a>
        <BusinessSchema />
        <QueryProvider>
          <SkeletonProvider>
            {children}
          </SkeletonProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
