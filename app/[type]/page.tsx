import { dayData, mongData } from '@/lib/data';
import { notFound } from 'next/navigation';
import { ChevronLeft, Search } from 'lucide-react';
import Link from 'next/link';
import ProductList from './ProductList';

export default async function TypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  
  if (type !== 'day' && type !== 'mong') {
    notFound();
  }

  const isDay = type === 'day';
  const data = isDay ? dayData : mongData;
  const title = isDay ? 'Loại Dày' : 'Loại Mỏng';
  const themeColor = isDay ? 'emerald' : 'blue';

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center h-14 px-4 max-w-3xl mx-auto w-full">
          <Link 
            href="/" 
            className="p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Quay lại"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-lg font-semibold text-slate-900 ml-2">
            Phụ kiện {title}
          </h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 w-full max-w-3xl mx-auto p-4">
        <ProductList data={data} themeColor={themeColor} />
      </div>
    </main>
  );
}
