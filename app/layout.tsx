import { SessionProvider } from "next-auth/react"
import OneTapProvider from "@/components/providers/OneTapProvider";
import type { Metadata, Viewport } from 'next';
import { Roboto } from 'next/font/google';
import './globals.css';
import { SiteFooter } from '@/components/SiteFooter';
import QueryProvider from '@/components/providers/query-provider';
import { SkeletonProvider } from '@/components/providers/skeleton-provider';
import BusinessSchema from '@/components/providers/BusinessSchema';
import { ReduxProvider } from '@/components/ReduxProvider';
import { ModalProvider } from '@/components/ModalProvider';
import { CartHydration } from '@/components/CartHydration';


const roboto = Roboto({
  weight: ['300', '400', '500', '700', '900'],
  subsets: ['vietnamese'],
  display: 'swap',
  variable: '--font-roboto',
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
    <html lang="vi" className={`${roboto.variable}`}>
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" />
      </head>
      <body className={`bg-light-grey text-slate-900 antialiased font-sans`} suppressHydrationWarning>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-emerald-600">
          Chuyển đến nội dung chính
        </a>
        <BusinessSchema />
        <ReduxProvider>
          <QueryProvider>
            <SessionProvider>
              <SkeletonProvider>
                  <OneTapProvider />
                  <div className="flex flex-col min-h-screen">
                    {children}
                    <SiteFooter />
                  </div>
                  <ModalProvider />
                  <CartHydration />
              </SkeletonProvider>
            </SessionProvider>
          </QueryProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
