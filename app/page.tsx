import Link from 'next/link';
import Image from 'next/image';
import { connectDB } from '@/lib/mongodb';
import Category from '@/models/Category';
import { AddCategoryButton } from '@/components/AddCategoryButton';

const imgNotFoundUrl = "https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png?_=20210521171500";

export default async function HomePage() {
  await connectDB();
  const categoriesRaw = await Category.find({}).sort({ createdAt: 1 }).lean();
  const categories = JSON.parse(JSON.stringify(categoriesRaw));

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center p-4 relative pb-24">
      <div className="w-full max-w-5xl space-y-6">
        <div className="sticky top-0 z-10 text-center pt-6 pb-10 bg-gradient-to-b from-slate-50 from-80% to-transparent">
          <h1 className="text-3xl font-bold tracking-tight text-emerald-600">
            MAI VINH
          </h1>
        </div>

        {!categories || categories.length === 0 ? (
          <div className="text-center text-slate-500 py-10 font-medium">
            Chưa có danh mục sản phẩm nào.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {categories.map((category: any) => {
              return (
                <Link
                  key={category.slug}
                  href={`/${category.slug}`}
                  className="group relative flex flex-col overflow-hidden bg-white shadow-lg hover:shadow-xl border border-slate-200 hover:border-slate-300 transition-all active:scale-[0.98]"
                >
                  {/* Square image container */}
                  <div className="relative aspect-square w-full">
                    <Image
                      src={category.image?.secure_url || category.image?.url || imgNotFoundUrl}
                      alt={category.shortTitle || category.title}
                      fill
                      sizes="(max-width: 640px) 50vw, 256px"
                      className="object-cover"
                    />
                  </div>
                  {/* Title */}
                  <div className="px-2 py-3 bg-white">
                    <p className="text-sm font-medium text-slate-800 text-center leading-tight">
                      {category.shortTitle || category.title}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <AddCategoryButton />
    </main>
  );
}
