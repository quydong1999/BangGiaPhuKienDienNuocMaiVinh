import { phuKienOngNuocDatHoaLoaiDayData } from '@/data/phu-kien-ong-nuoc-dat-hoa-loai-day';
import { phuKienOngNuocDataHoaLoaiMongData } from '@/data/phu-kien-ong-nuoc-dat-hoa-loai-mong';
import { ongNuocVanPhuocData } from '@/data/ong-nuoc-van-phuoc';
import { ongNuocDatHoaData } from '@/data/ong-nuoc-dat-hoa';
import { ongNhuaDeoData } from '@/data/ong-nhua-deo';
import { luoiData } from '@/data/luoi';
import { dayBoData } from '@/data/day-bo';
import { dayDienDoiVinhThinhData } from '@/data/day-dien-doi-vinh-thinh';
import { dayDienNhomDonVinhThinhData } from '@/data/day-dien-nhom-don-vinh-thinh';

export const TYPE_CONFIG = {
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
