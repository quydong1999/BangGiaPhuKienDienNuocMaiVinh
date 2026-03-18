import SearchContent from './SearchContent';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q: string }> }) {
  const query = (await searchParams).q || '';

  if (!query) {
    return {
      title: 'Tìm kiếm sản phẩm điện nước | Điện nước Mai Vinh - Đề Gi - Bình Định',
      description: 'Tìm kiếm nhanh chóng các thiết bị, phụ kiện điện nước chính hãng tại hệ thống cửa hàng Điện nước Mai Vinh - Đề Gi - Bình Định. Cung cấp báo giá sỉ lẻ đa dạng mặt hàng.',
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
    title: `Kết quả tìm kiếm sản phẩm: "${query}" | Điện nước Mai Vinh - Đề Gi - Bình Định`,
    description: `Tổng hợp chi tiết kết quả tìm kiếm cho các sản phẩm "${query}" chính hãng tại cửa hàng Điện nước Mai Vinh - Đề Gi - Bình Định. Cam kết giá cả cạnh tranh, chất lượng uy tín.`,
    keywords: [`phụ kiện`, `ống nước`, `uPVC`, `Mai Vinh`, `điện nước`, `dây điện`, `báo giá`, `Đồng Lâm`, `Thắng Kiên`, `Cát Khánh`, `Điện nước Mai Vinh`, `${query}`],
    openGraph: {
      title: `Kết quả tìm kiếm sản phẩm: "${query}" | Điện nước Mai Vinh - Đề Gi - Bình Định`,
      description: `Tổng hợp chi tiết kết quả tìm kiếm cho các sản phẩm "${query}" chính hãng tại cửa hàng Điện nước Mai Vinh - Đề Gi - Bình Định. Cam kết giá cả cạnh tranh, chất lượng uy tín.`,
      url: `${baseUrl}/search?q=${encodeURIComponent(query)}`,
      siteName: 'Báo giá điện nước Mai Vinh - Đề Gi - Bình Định',
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
