import Link from 'next/link';
import Image from 'next/image';
import { TYPE_SLUGS } from '@/types/types';
import { TYPE_CONFIG } from '@/app/[type]/config';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="sticky top-0 z-10 text-center pt-6 pb-10 bg-gradient-to-b from-slate-50 from-80% to-transparent">
          <h1 className="text-3xl font-bold tracking-tight text-emerald-600">
            MAI VINH
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {TYPE_SLUGS.map((slug) => {
            const config = TYPE_CONFIG[slug];
            return (
              <Link
                key={slug}
                href={`/${slug}`}
                className="group relative flex flex-col overflow-hidden bg-white shadow-lg hover:shadow-xl border border-slate-200 hover:border-slate-300 transition-all active:scale-[0.98]"
              >
                {/* Square image container */}
                <div className="relative aspect-square w-full">
                  <Image
                    src={config.image}
                    alt={config.shortTitle}
                    fill
                    sizes="(max-width: 640px) 50vw, 256px"
                    className="object-cover"
                  />
                </div>
                {/* Title */}
                <div className="px-2 py-3 bg-white">
                  <p className="text-sm font-medium text-slate-800 text-center leading-tight">
                    {config.shortTitle}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
