import { Suspense } from 'react';
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

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category: categorySlug } = await params;
  const categoryData = await getCachedCategory(categorySlug);
  if (!categoryData) {
    return {
      title: 'Not Found',
    };
  }
  return {
    title: `${categoryData.title} chính hãng | Điện nước Mai Vinh - Bình Định`,
    description: `Cập nhật báo giá mới nhất cho sản phẩm ${categoryData.title} chính hãng tại cửa hàng Điện nước Mai Vinh - Bình Định. Chuyên cung cấp sỉ, lẻ tất cả các loại thiết bị, phụ kiện, sản phẩm điện nước gia dụng tại nhà chuyên nghiệp, uy tín, chất lượng.`,
    keywords: [`phụ kiện`, `ống nước`, `uPVC`, `Mai Vinh`, `điện nước`, `dây điện`, `báo giá`, `Đồng Lâm`, `Thắng Kiên`, `Cát Khánh`, `Điện nước Mai Vinh`, `${categoryData.title}`],
    openGraph: {
      title: `${categoryData.title} chính hãng | Điện nước Mai Vinh - Bình Định`,
      description: `Cập nhật báo giá mới nhất cho sản phẩm ${categoryData.title} chính hãng tại cửa hàng Điện nước Mai Vinh - Bình Định. Chuyên cung cấp sỉ, lẻ tất cả các loại thiết bị, phụ kiện, sản phẩm điện nước gia dụng tại nhà chuyên nghiệp, uy tín, chất lượng.`,
      url: `${baseUrl}/${categoryData.slug}`,
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
      canonical: `${baseUrl}/${categoryData.slug}`,
    },
    metadataBase: new URL(`${baseUrl}`),
  };
}

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

export async function generateStaticParams() {
  await connectDB();
  const categories = await Category.find({}, { slug: 1 }).lean();
  return categories.map((cat: any) => ({
    category: cat.slug,
  }));
}

export default async function TypePage({ params }: { params: Promise<{ category: string }> }) {
  const { category: categorySlug } = await params;

  const categoryData = await getCachedCategory(categorySlug);

  if (!categoryData) {
    notFound();
  }

  const { _id, title, filterField = null, visibleFields = [], layout } = categoryData;
  const categoryId = _id.toString();

  const products = await getCachedProducts(categoryId);

  return (
    <main id="main-content" className="min-h-screen bg-light-grey flex flex-col">
      <CategorySchema category={categoryData} products={products} />
      {/* Header & Breadcrumb */}
      <HomeHeader compact categoryId={categoryId} categoryLayout={layout} />
      <div className="w-full max-w-6xl mx-auto px-4 mt-1 mb-2">
        <Breadcrumbs
          items={[
            { label: 'Trang chủ', href: '/' },
            { label: title }
          ]}
        />
      </div>

      {/* Content */}
      <section aria-label="Danh sách sản phẩm" className="flex-1 w-full max-w-6xl mx-auto p-4">
        <Suspense fallback={null}>
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

