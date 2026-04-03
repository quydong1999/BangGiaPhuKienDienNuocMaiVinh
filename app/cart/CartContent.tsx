'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Minus, Plus, Trash2, ShoppingBag, FileSpreadsheet, Printer, Save } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import { getBlurPlaceholder, getOptimizedImageUrl } from '@/lib/image-blur';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectCartItems, removeFromCart, updateQuantity, clearCart } from '@/store/cartSlice';
import { openModal } from '@/store/modalSlice';
import Swal from 'sweetalert2';

const imgNotFoundUrl = "https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png?_=20210521171500";

import { formatVND } from '@/lib/utils';

const cleanSpecName = (spec: string) => {
  if (!spec) return spec;
  // Strip quotes if both start and end exist
  if (spec.startsWith('"') && spec.endsWith('"')) {
    return spec.substring(1, spec.length - 1);
  }
  return spec;
};

export default function CartContent() {
  const { data: session } = useSession();
  const items = useAppSelector(selectCartItems);
  const dispatch = useAppDispatch();

  // Local state to track the raw text while user is typing
  const [editingQty, setEditingQty] = useState<Record<string, string>>({});

  const getDisplayQty = (cartId: string, quantity: number) =>
    editingQty[cartId] ?? String(quantity);

  const commitQuantity = (cartId: string, raw: string, fallback: number) => {
    const parsed = parseFloat(raw.replace(',', '.'));
    if (!isNaN(parsed) && parsed >= 0.01) {
      const rounded = Math.round(parsed * 100) / 100; // max 2 decimals
      dispatch(updateQuantity({ cartId, quantity: rounded }));
    }
    // Always clear local editing state — will fall back to Redux value
    setEditingQty(prev => {
      const next = { ...prev };
      delete next[cartId];
      return next;
    });
  };

  const hasInvalidQty = Object.values(editingQty).some(val => {
    const parsed = parseFloat(val.replace(',', '.'));
    return isNaN(parsed) || parsed < 0.01;
  });

  const grandTotal = items.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);

  const handleSaveInvoice = () => {
    if (!session?.user?.isAdmin) {
      Swal.fire('Quyền truy cập', 'Chỉ Admin mới có thể thực hiện tính năng này.', 'warning');
      return;
    }

    dispatch(openModal({
      type: 'saveInvoice',
      props: {
        items,
        grandTotal
      }
    }));
  };

  const handleExportExcel = () => {
    const exportData: any[] = items.map((item, index) => {
      const cleanedSpec = cleanSpecName(item.specName);
      const isVisibleSpec = cleanedSpec && cleanedSpec !== '-' && cleanedSpec !== 'Mặc định';
      const productName = isVisibleSpec
        ? `${item.product.name} (${cleanedSpec})`
        : item.product.name;

      return {
        'STT': index + 1,
        'Tên sản phẩm': productName,
        'Số lượng': item.quantity,
        'Đơn vị tính': item.unit,
        'Đơn giá': item.price,
        'Thành tiền': item.price * item.quantity
      };
    });

    // Add Total Row
    exportData.push({
      'STT': '',
      'Tên sản phẩm': 'TỔNG CỘNG',
      'Số lượng': null,
      'Đơn vị tính': '',
      'Đơn giá': null,
      'Thành tiền': grandTotal
    } as Record<string, any>);

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 5 },  // STT
      { wch: 40 }, // Tên sản phẩm
      { wch: 10 }, // Số lượng
      { wch: 15 }, // Đơn vị tính
      { wch: 15 }, // Đơn giá
      { wch: 15 }, // Thành tiền
    ];

    // Hàng cuối sẽ có index là items.length + 1 vì header ở index 0
    const lastRowIndex = items.length + 1;

    // Thiết lập định dạng cho toàn bộ các ô (cell) trong sheet
    const range = XLSX.utils.decode_range(worksheet['!ref'] as string);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = { c: C, r: R };
        const cellRef = XLSX.utils.encode_cell(cellAddress);

        if (!worksheet[cellRef]) continue;
        if (!worksheet[cellRef].s) worksheet[cellRef].s = {};

        // 1. Toàn bộ font Arial cỡ 10
        worksheet[cellRef].s.font = { name: 'Arial', sz: 10 };

        // 2. Border và Background
        const isHeaderOrFooter = (R === 0) || (R === lastRowIndex);
        worksheet[cellRef].s.border = {
          top: { style: 'thin', color: { rgb: "000000" } },
          bottom: { style: 'thin', color: { rgb: "000000" } },
          left: { style: (isHeaderOrFooter || C === 0) ? 'thin' : 'dotted', color: { rgb: "000000" } },
          right: { style: (isHeaderOrFooter || C === 5) ? 'thin' : 'dotted', color: { rgb: "000000" } }
        };

        if (isHeaderOrFooter) {
          worksheet[cellRef].s.fill = { fgColor: { rgb: "EAEAEA" } };
        }

        // 3. Row 1 (Header) in đậm, căn giữa
        if (R === 0) {
          worksheet[cellRef].s.font.bold = true;
          worksheet[cellRef].s.alignment = { horizontal: 'center', vertical: 'center' };
        }

        // 4. Row cuối (Tổng cộng) in đậm
        if (R === lastRowIndex) {
          worksheet[cellRef].s.font.bold = true;
        }

        // 5. Cột D (index 3) căn giữa
        if ((C === 0 || C === 2 || C === 3) && !isHeaderOrFooter) {
          worksheet[cellRef].s.alignment = { horizontal: 'center', vertical: 'center' };
        }

        // 6. Cột Đơn giá (Cột E - index 4) và Thành tiền (Cột F - index 5) format số không thập phân
        if ((C === 4 || C === 5) && R !== 0) {
          worksheet[cellRef].z = '#,##0';
        }
      }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'HoaDon');

    // Mẹo trick để merge cell cho hàng cuối (TỔNG CỘNG)
    if (!worksheet['!merges']) worksheet['!merges'] = [];
    worksheet['!merges'].push({ s: { r: lastRowIndex, c: 1 }, e: { r: lastRowIndex, c: 4 } });

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const fileName = `HoaDonBanHang_MaiVinh_${day}${month}${year}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Vui lòng cho phép trình duyệt hiển thị popup để in hóa đơn.');
      return;
    }

    const rowsHtml = items.map((item, index) => {
      const cleanedSpec = cleanSpecName(item.specName);
      const isVisibleSpec = cleanedSpec && cleanedSpec !== '-' && cleanedSpec !== 'Mặc định';
      const productName = isVisibleSpec
        ? `${item.product.name} (${cleanedSpec})`
        : item.product.name;

      return `
        <tr>
          <td class="text-center">${index + 1}</td>
          <td>${productName}</td>
          <td class="text-center">${item.quantity}</td>
          <td class="text-center">${item.unit}</td>
          <td class="text-right">${formatVND(item.price)}</td>
          <td class="text-right">${formatVND(item.price * item.quantity)}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Hóa đơn Cửa hàng Mai Vinh</title>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #000; }
          .header { text-align: center; margin-bottom: 20px; }
          .header h2 { margin: 0; font-size: 22px; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #000; padding: 8px; font-size: 14px; }
          th { background-color: #EAEAEA; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .footer-row { background-color: #EAEAEA; font-weight: bold; }
          @media print {
            body { padding: 0; }
            @page { margin: 1.5cm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Hóa Đơn Bán Hàng</h2>
          <p>Ngày xuất hóa đơn: ${new Date().toLocaleDateString('vi-VN')}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th width="5%">STT</th>
              <th width="35%">Tên sản phẩm</th>
              <th width="10%">Số lượng</th>
              <th width="15%">Đơn vị tính</th>
              <th width="15%">Đơn giá</th>
              <th width="20%">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
          <tfoot>
            <tr class="footer-row">
              <td colspan="5" class="text-center">TỔNG CỘNG</td>
              <td class="text-right">${formatVND(grandTotal)}</td>
            </tr>
          </tfoot>
        </table>
        <script>
          window.onload = () => {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <ShoppingBag size={32} className="text-slate-400" />
        </div>
        <h2 className="text-lg font-semibold text-slate-700 mb-2">Giỏ hàng trống</h2>
        <p className="text-sm text-slate-500 mb-6">Bạn chưa thêm sản phẩm nào vào giỏ hàng.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
        >
          Tiếp tục mua hàng
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cart Items */}
      <div className="bg-white border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        {items.map((item) => {
          const imageUrl = item.product.images?.[0]?.secure_url || imgNotFoundUrl;
          const lineTotal = item.price * item.quantity;

          return (
            <div
              key={item.cartId}
              className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4"
            >
              {/* Image */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 bg-slate-50 rounded overflow-hidden">
                <Image
                  src={getOptimizedImageUrl(imageUrl, 160)}
                  alt={item.product.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                  quality={50}
                  {...getBlurPlaceholder(imageUrl)}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">
                      {item.product.name}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {item.specName && item.specName !== '-' && cleanSpecName(item.specName) !== 'Mặc định' && (
                        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {cleanSpecName(item.specName)}
                        </span>
                      )}
                      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600">
                        ĐVT: {item.unit}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => dispatch(removeFromCart(item.cartId))}
                    className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    aria-label={`Xóa ${item.product.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => commitQuantity(item.cartId, String(item.quantity - 1), item.quantity)}
                      disabled={item.quantity <= 0.01}
                      className="w-7 h-7 flex items-center justify-center border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      aria-label="Giảm số lượng"
                    >
                      <Minus size={12} />
                    </button>
                    <input
                      type="text"
                      value={getDisplayQty(item.cartId, item.quantity)}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^[0-9]*[.,]?[0-9]*$/.test(val)) {
                          setEditingQty(prev => ({ ...prev, [item.cartId]: val }));
                        }
                      }}
                      onBlur={(e) => commitQuantity(item.cartId, e.target.value, item.quantity)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          commitQuantity(item.cartId, (e.target as HTMLInputElement).value, item.quantity);
                        }
                      }}
                      className={`w-12 text-center text-sm font-semibold tabular-nums border py-1 focus:outline-none focus:ring-1 ${editingQty[item.cartId] !== undefined && (isNaN(parseFloat(editingQty[item.cartId].replace(',', '.'))) || parseFloat(editingQty[item.cartId].replace(',', '.')) < 0.01)
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500'
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => commitQuantity(item.cartId, String(item.quantity + 1), item.quantity)}
                      className="w-7 h-7 flex items-center justify-center border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors"
                      aria-label="Tăng số lượng"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500">{formatVND(item.price)} × {item.quantity}</span>
                    <div className="text-sm font-bold text-emerald-700">{formatVND(lineTotal)}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary & Actions */}
      <div className="bg-white border border-slate-200 shadow-sm p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Tổng ({items.length} mặt hàng)</span>
          <span className="text-lg font-bold text-emerald-700">{formatVND(grandTotal)}</span>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleExportExcel}
              className="w-full flex items-center justify-center gap-2 py-3 border border-emerald-600 text-emerald-600 font-semibold hover:bg-emerald-50 active:scale-[0.98] transition-all"
            >
              <FileSpreadsheet size={18} />
              <span className="hidden sm:inline">Xuất Excel</span>
              <span className="sm:hidden">Excel</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="w-full flex items-center justify-center gap-2 py-3 border border-emerald-600 text-emerald-600 font-semibold hover:bg-emerald-50 active:scale-[0.98] transition-all"
            >
              <Printer size={18} />
              <span className="hidden sm:inline">In hóa đơn</span>
              <span className="sm:hidden">In</span>
            </button>
          </div>
          {session?.user?.isAdmin && (
            <button
              type="button"
              onClick={handleSaveInvoice}
              disabled={hasInvalidQty}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
            >
              <Save size={18} />
              Lưu Hóa Đơn
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
