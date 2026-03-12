import { phuKienOngNuocDatHoaLoaiDayData } from '@/data/phu-kien-ong-nuoc-dat-hoa-loai-day';
import { phuKienOngNuocDataHoaLoaiMongData } from '@/data/phu-kien-ong-nuoc-dat-hoa-loai-mong';
import { ongNuocVanPhuocData } from '@/data/ong-nuoc-van-phuoc';
import { ongNuocDatHoaData } from '@/data/ong-nuoc-dat-hoa';
import { ongNhuaDeoData } from '@/data/ong-nhua-deo';
import { luoiData } from '@/data/luoi';
import { dayBoData } from '@/data/day-bo';
import { dayDienDoiVinhThinhData } from '@/data/day-dien-doi-vinh-thinh';
import { dayDienNhomDonVinhThinhData } from '@/data/day-dien-nhom-don-vinh-thinh';
import type { Category } from '@/types/types';

export const categoryData: Category[] = [
    {
        _id: "1",
        slug: "phu-kien-ong-nuoc-dat-hoa-loai-day",
        title: "Phụ kiện ống nước Đạt Hòa loại dày",
        shortTitle: "Phụ kiện Đạt Hòa dày",
        image: {
            public_id: "/categories/phu-kien-ong-nuoc-dat-hoa.jpg",
            url: "/categories/phu-kien-ong-nuoc-dat-hoa.jpg",
            secure_url: "/categories/phu-kien-ong-nuoc-dat-hoa.jpg",
        },
        data: phuKienOngNuocDatHoaLoaiDayData,
        filterField: "name" as const,
        visibleFields: ["name", "spec", "priceSell"] as const,
        layout: "table" as const,
    },
    {
        _id: "3",
        slug: "phu-kien-ong-nuoc-dat-hoa-loai-mong",
        title: "Phụ kiện ống nước Đạt Hòa loại mỏng",
        shortTitle: "Phụ kiện Đạt Hòa mỏng",
        image: {
            public_id: "/categories/phu-kien-ong-nuoc-dat-hoa.jpg",
            url: "/categories/phu-kien-ong-nuoc-dat-hoa.jpg",
            secure_url: "/categories/phu-kien-ong-nuoc-dat-hoa.jpg",
        },
        data: phuKienOngNuocDataHoaLoaiMongData,
        filterField: "name" as const,
        visibleFields: ["name", "spec", "priceSell"] as const,
        layout: "table" as const
    },
    {
        _id: "4",
        slug: "ong-nuoc-dat-hoa",
        title: "Ống nhựa Đạt Hòa",
        shortTitle: "Ống Đạt Hòa",
        image: {
            public_id: "/categories/ong-nhua-uPvc.jpg",
            url: "/categories/ong-nhua-uPvc.jpg",
            secure_url: "/categories/ong-nhua-uPvc.jpg",
        },
        data: ongNuocDatHoaData,
        filterField: null,
        visibleFields: ["name", "spec", "priceSell"] as const,
        layout: "table" as const,
    },
    {
        _id: "5",
        slug: "ong-nuoc-van-phuoc",
        title: "Ống nhựa Vạn Phước",
        shortTitle: "Ống Vạn Phước",
        image: {
            public_id: "/categories/ong-nhua-uPvc.jpg",
            url: "/categories/ong-nhua-uPvc.jpg",
            secure_url: "/categories/ong-nhua-uPvc.jpg",
        },
        data: ongNuocVanPhuocData,
        filterField: null,
        visibleFields: ["name", "spec", "priceSell"] as const,
        layout: "table" as const,
    },
    {
        _id: "6",
        slug: "ong-nhua-deo",
        title: "Ống nhựa dẻo các loại",
        shortTitle: "Ống nhựa dẻo",
        image: {
            public_id: "/categories/ong-nhua-deo.jpg",
            url: "/categories/ong-nhua-deo.jpg",
            secure_url: "/categories/ong-nhua-deo.jpg",
        },
        data: ongNhuaDeoData,
        filterField: null,
        visibleFields: ["name", "spec", "unit", "priceSell"] as const,
        layout: "table" as const,
    },
    {
        _id: "7",
        slug: "luoi-cac-loai",
        title: "Lưới các loại",
        shortTitle: "Lưới",
        image: {
            public_id: "/categories/luoi.jpg",
            url: "/categories/luoi.jpg",
            secure_url: "/categories/luoi.jpg",
        },
        data: luoiData,
        filterField: null,
        visibleFields: [],
        layout: "gallery" as const,
    },
    {
        _id: "8",
        slug: "day-bo",
        title: "Dây bô",
        shortTitle: "Dây bô",
        image: {
            public_id: "/categories/day-bo.jpg",
            url: "/categories/day-bo.jpg",
            secure_url: "/categories/day-bo.jpg",
        },
        data: dayBoData,
        filterField: null,
        visibleFields: [],
        layout: "gallery" as const,
    },
    {
        _id: "9",
        slug: "day-dien-doi-vinh-thinh",
        title: "Dây điện đôi Vĩnh Thịnh",
        shortTitle: "Dây đôi Vĩnh Thịnh",
        image: {
            public_id: "/categories/day-dien-doi-vinh-thinh.jpg",
            url: "/categories/day-dien-doi-vinh-thinh.jpg",
            secure_url: "/categories/day-dien-doi-vinh-thinh.jpg",
        },
        data: dayDienDoiVinhThinhData,
        filterField: null,
        visibleFields: ["name", "spec", "unit", "priceSell"] as const,
        layout: "table" as const,
    },
    {
        _id: "10",
        slug: "day-dien-nhom-don-vinh-thinh",
        title: "Dây điện đơn nhôm Vĩnh Thịnh",
        shortTitle: "Dây nhôm đơn Vĩnh Thịnh",
        image: {
            public_id: "/categories/day-dien-nhom-don-vinh-thinh.jpg",
            url: "/categories/day-dien-nhom-don-vinh-thinh.jpg",
            secure_url: "/categories/day-dien-nhom-don-vinh-thinh.jpg",
        },
        data: dayDienNhomDonVinhThinhData,
        filterField: null,
        visibleFields: [],
        layout: "gallery" as const,
    }
]
