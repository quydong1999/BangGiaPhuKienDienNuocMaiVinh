import { phuKienOngNuocDatHoaLoaiDayData } from '@/data/phu-kien-ong-nuoc-dat-hoa-loai-day';
import { phuKienOngNuocDataHoaLoaiMongData } from '@/data/phu-kien-ong-nuoc-dat-hoa-loai-mong';
import { ongNuocVanPhuocData } from '@/data/ong-nuoc-van-phuoc';
import { ongNuocDatHoaData } from '@/data/ong-nuoc-dat-hoa';
import { ongNhuaDeoData } from '@/data/ong-nhua-deo';
import { luoiData } from '@/data/luoi';
import { dayBoData } from '@/data/day-bo';
import { dayDienDoiVinhThinhData } from '@/data/day-dien-doi-vinh-thinh';
import { dayDienNhomDonVinhThinhData } from '@/data/day-dien-nhom-don-vinh-thinh';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { TYPE_SLUGS, TYPE_TO_THEME_COLOR, type TypeSlug } from '@/lib/theme';
import ProductList from './ProductList';
import GalleryProduct from './GalleryProduct';

export default async function TypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;

  if (!TYPE_SLUGS.includes(type as TypeSlug)) {
    notFound();
  }

  const types = {
    "phu-kien-ong-nuoc-dat-hoa-loai-day": {
      title: "Phụ kiện ống nước Đạt Hòa loại dày",
      data: phuKienOngNuocDatHoaLoaiDayData,
      filterField: "name" as const,
      visibleFields: ["name", "spec", "priceSell"] as const,
      layout: "table" as const,
    },
    "phu-kien-ong-nuoc-dat-hoa-loai-mong": {
      title: "Phụ kiện ống nước Đạt Hòa loại mỏng",
      data: phuKienOngNuocDataHoaLoaiMongData,
      filterField: "name" as const,
      visibleFields: ["name", "spec", "priceSell"] as const,
      layout: "table" as const,
    },
    "ong-nuoc-dat-hoa": {
      title: "Ống nhựa Đạt Hòa",
      data: ongNuocDatHoaData,
      filterField: null,
      visibleFields: ["name", "spec", "priceSell"] as const,
      layout: "table" as const,
    },
    "ong-nuoc-van-phuoc": {
      title: "Ống nhựa Vạn Phước",
      data: ongNuocVanPhuocData,
      filterField: null,
      visibleFields: ["name", "spec", "priceSell"] as const,
      layout: "table" as const,
    },
    "ong-nhua-deo": {
      title: "Ống nhựa dẻo các loại",
      data: ongNhuaDeoData,
      filterField: null,
      visibleFields: ["name", "spec", "unit", "priceSell"] as const,
      layout: "table" as const,
    },
    "luoi": {
      title: "Lưới các loại",
      data: luoiData,
      filterField: null,
      visibleFields: [],
      layout: "gallery" as const,
    },
    "day-bo": {
      title: "Dây bô",
      data: dayBoData,
      filterField: null,
      visibleFields: [],
      layout: "gallery" as const,
    },
    "day-dien-doi-vinh-thinh": {
      title: "Dây điện đôi Vĩnh Thịnh",
      data: dayDienDoiVinhThinhData,
      filterField: null,
      visibleFields: ["name", "spec", "unit", "priceSell"] as const,
      layout: "table" as const,
    },
    "day-dien-nhom-don-vinh-thinh": {
      title: "Dây điện đơn nhôm Vĩnh Thịnh",
      data: dayDienNhomDonVinhThinhData,
      filterField: null,
      visibleFields: [],
      layout: "gallery" as const,
    }
  } as const;

  const config = types[type as TypeSlug];
  const { title, data, filterField, visibleFields, layout } = config;
  const themeColor = TYPE_TO_THEME_COLOR[type as TypeSlug];

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center h-14 px-4 max-w-3xl mx-auto w-full">
          <Link
            href="/"
            className="p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-lg font-semibold text-slate-900 ml-2">
            {title}
          </h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 w-full max-w-3xl mx-auto p-4">
        {layout === 'table' ? (
          <ProductList
            data={data}
            themeColor={themeColor}
            filterField={filterField}
            visibleFields={visibleFields}
          />
        ) : (
          <GalleryProduct data={data as any} themeColor={themeColor} />
        )}
      </div>
    </main>
  );
}
