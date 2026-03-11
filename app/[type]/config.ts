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
    shortTitle: "Phụ kiện Đạt Hòa dày",
    image: "/categories/phu-kien-ong-nuoc-dat-hoa.jpg",
    data: phuKienOngNuocDatHoaLoaiDayData,
    filterField: "name" as const,
    visibleFields: ["name", "spec", "priceSell"] as const,
    layout: "table" as const,
  },
  "phu-kien-ong-nuoc-dat-hoa-loai-mong": {
    title: "Phụ kiện ống nước Đạt Hòa loại mỏng",
    shortTitle: "Phụ kiện Đạt Hòa mỏng",
    image: "/categories/phu-kien-ong-nuoc-dat-hoa.jpg",
    data: phuKienOngNuocDataHoaLoaiMongData,
    filterField: "name" as const,
    visibleFields: ["name", "spec", "priceSell"] as const,
    layout: "table" as const,
  },
  "ong-nuoc-dat-hoa": {
    title: "Ống nhựa Đạt Hòa",
    shortTitle: "Ống Đạt Hòa",
    image: "/categories/ong-nhua-uPvc.jpg",
    data: ongNuocDatHoaData,
    filterField: null,
    visibleFields: ["name", "spec", "priceSell"] as const,
    layout: "table" as const,
  },
  "ong-nuoc-van-phuoc": {
    title: "Ống nhựa Vạn Phước",
    shortTitle: "Ống Vạn Phước",
    image: "/categories/ong-nhua-uPvc.jpg",
    data: ongNuocVanPhuocData,
    filterField: null,
    visibleFields: ["name", "spec", "priceSell"] as const,
    layout: "table" as const,
  },
  "ong-nhua-deo": {
    title: "Ống nhựa dẻo các loại",
    shortTitle: "Ống nhựa dẻo",
    image: "/categories/ong-nhua-deo.jpg",
    data: ongNhuaDeoData,
    filterField: null,
    visibleFields: ["name", "spec", "unit", "priceSell"] as const,
    layout: "table" as const,
  },
  "luoi": {
    title: "Lưới các loại",
    shortTitle: "Lưới",
    image: "/categories/luoi.jpg",
    data: luoiData,
    filterField: null,
    visibleFields: [],
    layout: "gallery" as const,
  },
  "day-bo": {
    title: "Dây bô",
    shortTitle: "Dây bô",
    image: "/categories/day-bo.jpg",
    data: dayBoData,
    filterField: null,
    visibleFields: [],
    layout: "gallery" as const,
  },
  "day-dien-doi-vinh-thinh": {
    title: "Dây điện đôi Vĩnh Thịnh",
    shortTitle: "Dây đôi Vĩnh Thịnh",
    image: "/categories/day-dien-doi-vinh-thinh.jpg",
    data: dayDienDoiVinhThinhData,
    filterField: null,
    visibleFields: ["name", "spec", "unit", "priceSell"] as const,
    layout: "table" as const,
  },
  "day-dien-nhom-don-vinh-thinh": {
    title: "Dây điện đơn nhôm Vĩnh Thịnh",
    shortTitle: "Dây nhôm đơn Vĩnh Thịnh",
    image: "/categories/day-dien-nhom-don-vinh-thinh.jpg",
    data: dayDienNhomDonVinhThinhData,
    filterField: null,
    visibleFields: [],
    layout: "gallery" as const,
  }
} as const;
