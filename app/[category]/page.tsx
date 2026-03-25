import { Suspense, cache } from 'react';
import { notFound } from 'next/navigation';
import { HomeHeader } from '@/components/HomeHeader';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import ProductContainer from './ProductContainer';
import CategorySchema from '@/components/CategorySchema';
import { connectDB } from '@/lib/mongodb';
import Category from '@/models/Category';
import Product from '@/models/Product';
import { unstable_cache } from 'next/cache';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

const getCategoryData = cache(async (slug: string) => {
  return await getCachedCategory(slug);
});

const getCachedCategory = (slug: string) => unstable_cache(
  async () => {
    await connectDB();
    const data = await Category.findOne({ slug }).lean();
    return data ? JSON.parse(JSON.stringify(data)) : null;
  },
  [`category-${slug}`],
  { tags: [`category-${slug}`, 'categories'] }
)();

const getCachedProducts = (categoryId: string) => unstable_cache(
  async () => {
    await connectDB();
    const data = await Product.find({ categoryId }).lean();
    return JSON.parse(JSON.stringify(data));
  },
  [`products-${categoryId}`],
  { tags: [`products-${categoryId}`, 'products'] }
)();

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category: categorySlug } = await params;
  const categoryData = await getCategoryData(categorySlug);

  if (!categoryData) return { title: 'Không tìm thấy danh mục' };

  return {
    title: `${categoryData.title} chính hãng | Điện nước Mai Vinh`,
    description: `Báo giá sản phẩm ${categoryData.title} tại Điện nước Mai Vinh - Bình Định.`,
    openGraph: {
      title: categoryData.title,
      url: `${baseUrl}/${categoryData.slug}`,
      images: [{ url: `${baseUrl}/diennuocmaivinh.webp` }],
    },
    alternates: { canonical: `${baseUrl}/${categoryData.slug}` },
    metadataBase: new URL(`${baseUrl || ''}`),
  };
}

export async function generateStaticParams() {
  await connectDB();
  const categories = await Category.find({}, { slug: 1 }).lean();
  return categories.map((cat: any) => ({
    category: cat.slug,
  }));
}

export default async function TypePage({ params }: { params: Promise<{ category: string }> }) {
  const { category: categorySlug } = await params;

  // Gọi đồng thời cả Category và Products để tiết kiệm thời gian (Parallel Fetching)
  const categoryData = await getCategoryData(categorySlug);

  if (!categoryData) {
    notFound();
  }

  const { _id, title, filterField = null, visibleFields = [], layout } = categoryData;
  const categoryId = _id.toString();

  // Fetch products ngay tại đây để truyền vào ProductContainer
  const products = await getCachedProducts(categoryId);

  return (
    <main id="main-content" className="min-h-screen bg-light-grey flex flex-col">
      <CategorySchema category={categoryData} products={products} />

      <HomeHeader compact categoryId={categoryId} categoryLayout={layout} />

      <div className="w-full max-w-6xl mx-auto px-4 mt-1 mb-2">
        <Breadcrumbs
          items={[
            { label: 'Trang chủ', href: '/' },
            { label: title }
          ]}
        />
      </div>

      <section aria-label="Danh sách sản phẩm" className="flex-1 w-full max-w-6xl mx-auto p-4">
        {/* Suspense ở đây chỉ có tác dụng nếu ProductContainer là một component async hoặc render nặng */}
        <Suspense fallback={<div className="h-96 flex items-center justify-center">Đang tải sản phẩm...</div>}>
          <ProductContainer
            categoryId={categoryId}
            categorySlug={categorySlug}
            layout={layout}
            filterField={filterField}
            visibleFields={visibleFields}
            initialProducts={products}
            categoryImageUrl={categoryData.image?.secure_url}
          />
        </Suspense>
      </section>
    </main>
  );
}