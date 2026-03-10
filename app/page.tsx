import Link from 'next/link';
import { TYPE_SLUGS, TYPE_TO_THEME_COLOR, themeColorClasses, type TypeSlug } from '@/lib/theme';

const TYPE_TITLES: Record<TypeSlug, string> = {
  'phu-kien-ong-nuoc-dat-hoa-loai-day': 'Phụ kiện ống nước Đạt Hòa loại dày',
  'phu-kien-ong-nuoc-dat-hoa-loai-mong': 'Phụ kiện ống nước Đạt Hòa loại mỏng',
  'ong-nuoc-van-phuoc': 'Ống nhựa Vạn Phước',
  'ong-nhua-deo': 'Ống nhựa dẻo các loại',
  'luoi': 'Lưới các loại',
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-emerald-600">
            MAI VINH
          </h1>
        </div>

        <div className="grid gap-4 mt-8">
          {TYPE_SLUGS.map((slug) => {
            const color = TYPE_TO_THEME_COLOR[slug];
            const classes = themeColorClasses[color].linkCard;
            return (
              <Link
                key={slug}
                href={`/${slug}`}
                className={`group relative flex items-center justify-between p-6 shadow-md border ${classes} hover:shadow-lg transition-all active:scale-[0.98]`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-left">
                    <p className="text-xl text-slate-900">{TYPE_TITLES[slug]}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
