import { phuKienOngNuocDatHoaLoaiDayData } from '@/data/phu-kien-ong-nuoc-dat-hoa-loai-day';
import { phuKienOngNuocDataHoaLoaiMongData } from '@/data/phu-kien-ong-nuoc-dat-hoa-loai-mong';
import { ongNuocVanPhuocData } from '@/data/ong-nuoc-van-phuoc';
import { ongNhuaDeoData } from '@/data/ong-nhua-deo';
import { luoiData } from '@/data/luoi';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import ProductList from './ProductList';
import GalleryProduct from './GalleryProduct';

export default async function TypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;

  const ALLOWED_TYPES = [
    "phu-kien-ong-nuoc-dat-hoa-loai-day",
    "phu-kien-ong-nuoc-dat-hoa-loai-mong",
    "ong-nuoc-van-phuoc",
    "ong-nhua-deo",
    "luoi"
  ] as const;

  type AllowedType = (typeof ALLOWED_TYPES)[number];

  if (!ALLOWED_TYPES.includes(type as AllowedType)) {
    notFound();
  }

  const types = {
    "phu-kien-ong-nuoc-dat-hoa-loai-day": {
      title: "Phụ kiện ống nước Đạt Hòa loại dày",
      themeColor: 'emerald',
      data: phuKienOngNuocDatHoaLoaiDayData,
      filterField: "name",
      visibleFields: ["name", "spec", "priceSell"],
      layout: "table"
    },
    "phu-kien-ong-nuoc-dat-hoa-loai-mong": {
      title: "Phụ kiện ống nước Đạt Hòa loại mỏng",
      themeColor: 'blue',
      data: phuKienOngNuocDataHoaLoaiMongData,
      filterField: "name",
      visibleFields: ["name", "spec", "priceSell"],
      layout: "table"
    },
    "ong-nuoc-van-phuoc": {
      title: "Ống nhựa Vạn Phước",
      themeColor: 'yellow',
      data: ongNuocVanPhuocData,
      filterField: "spec",
      visibleFields: ["name", "spec", "priceSell"],
      layout: "table"
    },
    "ong-nhua-deo": {
      title: "Ống nhựa dẻo các loại",
      themeColor: 'yellow',
      data: ongNhuaDeoData,
      filterField: "name",
      visibleFields: ["name", "spec", "unit", "priceSell"],
      layout: "table"
    },
    "luoi": {
      title: "Lưới các loại",
      themeColor: 'yellow',
      data: luoiData,
      filterField: "name",
      visibleFields: ["name", "unit", "priceSell"],
      layout: "gallery"
    }
  } as const;

  const { title, themeColor, data, filterField, visibleFields, layout } =
    types[type as AllowedType];

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
