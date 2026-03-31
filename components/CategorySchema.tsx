import { WithContext, CollectionPage } from 'schema-dts';
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
        name: `${category.title} chính hãng | Điện nước Mai Vinh`,
        description: `Báo giá tất cả sản phẩm thuộc danh mục ${category.title} tại cửa hàng Mai Vinh. Sản phẩm đa dạng quy cách, giá sỉ tốt nhất.`,
        url: `${baseUrl}/${category.slug}`,
        isPartOf: {
            '@type': 'WebSite',
            name: 'Điện nước Mai Vinh',
            url: `${baseUrl}`,
        },
        mainEntity: {
            '@type': 'ItemList',
            numberOfItems: products.length,
            itemListElement: products.map((product, index) => {
                // Lấy tất cả các mức giá để tính dải giá cho Schema
                const specs = product.specs || [];
                const allPrices = specs.flatMap(s => s.prices?.map(p => p.price) || []);
                const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
                const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 0;
                
                // Chuỗi mô tả các quy cách có sẵn
                const specNames = specs.map(s => s.name).filter(n => n && n !== '-').join(', ');
                const description = specNames ? `Có sẵn các quy cách: ${specNames}` : `Sản phẩm ${product.name} chất lượng cao`;

                return {
                    '@type': 'ListItem',
                    position: index + 1,
                    item: {
                        '@type': 'Product',
                        name: product.name,
                        description: description,
                        ...(product.image?.secure_url && {
                            image: product.image.secure_url,
                        }),
                        offers: {
                            '@type': 'AggregateOffer',
                            priceCurrency: 'VND',
                            lowPrice: minPrice,
                            highPrice: maxPrice,
                            offerCount: allPrices.length,
                            availability: 'https://schema.org/InStock'
                        }
                    }
                };
            }),
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