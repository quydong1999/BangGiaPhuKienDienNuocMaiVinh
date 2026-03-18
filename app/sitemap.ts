import { MetadataRoute } from 'next';
import { unstable_cache } from 'next/cache';
import { connectDB } from '@/lib/mongodb';
import Category from '@/models/Category';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

const getCachedCategories = unstable_cache(
    async () => {
        await connectDB();
        const categories = await Category.find({}, { slug: 1, updatedAt: 1 }).lean();
        return JSON.parse(JSON.stringify(categories));
    },
    ['all-categories-sitemap'],
    { tags: ['categories'] }
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const categories = await getCachedCategories();

    const categoryEntries: MetadataRoute.Sitemap = categories.map((cat: any) => ({
        url: `${baseUrl}/${cat.slug}`,
        lastModified: new Date(cat.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    })).flat() as MetadataRoute.Sitemap;

    return [
        {
            url: `${baseUrl}`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        ...categoryEntries,
    ];
}