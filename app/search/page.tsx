import SearchContent from './SearchContent';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q: string }> }) {
  const query = (await searchParams).q || '';

  if (!query) {
    return {
      title: 'Tìm kiếm | Điện nước Mai Vinh',
      description: 'Tìm kiếm sản phẩm',
      robots: {
        index: false,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": "-1",
        "max-video-preview": "-1",
      }
    }
  }

  return {
    title: `Kết quả tìm kiếm: "${query}" | Điện nước Mai Vinh`,
    description: `Kết quả tìm kiếm: "${query}"`,
    keywords: [`phụ kiện`, `ống nước`, `uPVC`, `Mai Vinh`, `điện nước`, `dây điện`, `báo giá`, `Đồng Lâm`, `Thắng Kiên`, `Cát Khánh`, `Điện nước Mai Vinh`, `${query}`],
    openGraph: {
      title: `Kết quả tìm kiếm: "${query}" | Điện nước Mai Vinh`,
      description: `Kết quả tìm kiếm: "${query}"`,
      url: `${baseUrl}/search?q=${encodeURIComponent(query)}`,
      siteName: 'Báo giá điện nước Mai Vinh',
      images: [
        {
          url: `${baseUrl}/diennuocmaivinh.png`,
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
    manifest: '/manifest.json',
    alternates: {
      canonical: `${baseUrl}/search?q=${encodeURIComponent(query)}`,
    },
    robots: {
      index: false,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": "-1",
      "max-video-preview": "-1",
    },
    metadataBase: new URL(`${baseUrl}`),
  };
}

export default function SearchResultPage() {
  return <SearchContent />;
}
