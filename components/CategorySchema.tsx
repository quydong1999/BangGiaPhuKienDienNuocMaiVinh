import { WithContext, CollectionPage, ListItem } from 'schema-dts';
import type { Category, Product } from '@/types/types';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

interface CategorySchemaProps {
    category: Category;
    products?: Product[];
}

export default function CategorySchema({ category, products = [] }: CategorySchemaProps) {
    const jsonLd: WithContext<CollectionPage> = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `${category.title} | Điện nước Mai Vinh`,
        description: `Báo giá tất cả sản phẩm thuộc danh mục ${category.title} tại cửa hàng Mai Vinh`,
        url: `${baseUrl}/${category.slug}`,
        isPartOf: {
            '@type': 'WebSite',
            name: 'Điện nước Mai Vinh',
            url: `${baseUrl}`,
        },
        provider: {
            '@type': 'LocalBusiness',
            name: 'Điện nước Mai Vinh',
            telephone: ['0982390943', '0976576443'],
            address: {
                '@type': 'PostalAddress',
                addressCountry: 'VN',
            },
        },
        mainEntity: {
            '@type': 'ItemList',
            numberOfItems: products.length,
            itemListElement: products.map((product, index): ListItem => ({
                '@type': 'ListItem',
                position: index + 1,
                name: product.name,
                ...(product.spec && { description: product.spec }),
                ...(product.image?.secure_url && {
                    image: product.image.secure_url,
                }),
            })),
        },
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
                __html: JSON.stringify(jsonLd),
            }}
        />
    );
}