import Link from 'next/link';
import Image from 'next/image';
import { TYPE_SLUGS, TYPE_TO_THEME_COLOR, themeColorClasses, type TypeSlug } from '@/lib/theme';
import SplashScreen from './components/SplashScreen';

const TYPE_TITLES: Record<TypeSlug, string> = {
  'phu-kien-ong-nuoc-dat-hoa-loai-day': 'Phụ kiện Đạt Hòa dày',
  'phu-kien-ong-nuoc-dat-hoa-loai-mong': 'Phụ kiện Đạt Hòa mỏng',
  'ong-nuoc-van-phuoc': 'Ống Vạn Phước',
  'ong-nuoc-dat-hoa': 'Ống Đạt Hòa',
  'ong-nhua-deo': 'Ống nhựa dẻo',
  'luoi': 'Lưới',
  'day-bo': 'Dây bô'
};

const TYPE_IMAGES: Record<TypeSlug, string> = {
  'phu-kien-ong-nuoc-dat-hoa-loai-day': '/categories/phu-kien-ong-nuoc-dat-hoa.jpg',
  'phu-kien-ong-nuoc-dat-hoa-loai-mong': '/categories/phu-kien-ong-nuoc-dat-hoa.jpg',
  'ong-nuoc-van-phuoc': '/categories/ong-nhua-uPvc.jpg',
  'ong-nuoc-dat-hoa': '/categories/ong-nhua-uPvc.jpg',
  'ong-nhua-deo': '/categories/ong-nhua-deo.jpg',
  'luoi': '/categories/luoi.jpg',
  'day-bo': '/categories/day-bo.jpg'
};

export default function HomePage() {
  return (
    <SplashScreen>
      <main className="min-h-screen bg-slate-50 flex flex-col items-center p-4">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center pt-6 pb-2">
            <h1 className="text-3xl font-bold tracking-tight text-emerald-600">
              MAI VINH
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {TYPE_SLUGS.map((slug) => {
              const color = TYPE_TO_THEME_COLOR[slug];
              const classes = themeColorClasses[color];
              return (
                <Link
                  key={slug}
                  href={`/${slug}`}
                  className="group relative flex flex-col overflow-hidden bg-white shadow-lg hover:shadow-xl border border-slate-200 hover:border-slate-300 transition-all active:scale-[0.98]"
                >
                  {/* Square image container */}
                  <div className="relative aspect-square w-full">
                    <Image
                      src={TYPE_IMAGES[slug]}
                      alt={TYPE_TITLES[slug]}
                      fill
                      sizes="(max-width: 640px) 50vw, 256px"
                      className="object-cover"
                    />
                  </div>
                  {/* Title */}
                  <div className="px-2 py-3 bg-white">
                    <p className="text-sm font-medium text-slate-800 text-center leading-tight">
                      {TYPE_TITLES[slug]}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </SplashScreen>
  );
}
