'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Printer, FileSpreadsheet, Save,
  User, Calendar, CheckCircle2, DollarSign,
  ChevronRight, ShoppingBag
} from 'lucide-react';
import { Combobox } from '@/components/Combobox';
import { formatVND } from '@/lib/utils';
import * as XLSX from 'xlsx-js-style';
import Swal from 'sweetalert2';

interface InvoiceDetailClientProps {
  initialInvoice: any;
}

export default function InvoiceDetailClient({ initialInvoice }: InvoiceDetailClientProps) {
  const router = useRouter();
  const [invoice, setInvoice] = useState(initialInvoice);
  const [isUpdating, setIsUpdating] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isRecipientManual, setIsRecipientManual] = useState(false);

  const [formData, setFormData] = useState({
    customerName: initialInvoice.customerName || '',
    recipientName: initialInvoice.recipientName || '',
    invoiceDate: initialInvoice.invoiceDate ? new Date(initialInvoice.invoiceDate).toISOString().split('T')[0] : '',
    status: initialInvoice.status || 'pending',
    paidAt: initialInvoice.paidAt ? new Date(initialInvoice.paidAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  });

  // Check if anything has changed
  const isDirty = useMemo(() => {
    const originalDate = initialInvoice.invoiceDate ? new Date(initialInvoice.invoiceDate).toISOString().split('T')[0] : '';
    const originalPaidAt = initialInvoice.paidAt ? new Date(initialInvoice.paidAt).toISOString().split('T')[0] : '';

    return (
      formData.customerName !== initialInvoice.customerName ||
      formData.recipientName !== initialInvoice.recipientName ||
      formData.invoiceDate !== originalDate ||
      formData.status !== initialInvoice.status ||
      (formData.status === 'paid' && formData.paidAt !== originalPaidAt)
    );
  }, [formData, initialInvoice]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const resp = await fetch('/api/customers');
        if (resp.ok) {
          const data = await resp.json();
          setCustomers(data);
        }
      } catch (e) {
        console.error('Lỗi lấy danh sách khách hàng:', e);
      }
    };
    fetchCustomers();
    // Set initial manual state
    setIsRecipientManual(initialInvoice.customerName !== initialInvoice.recipientName);
  }, [initialInvoice]);

  const handleSave = async () => {
    if (!isDirty) return;
    setIsUpdating(true);
    try {
      const resp = await fetch(`/api/invoices/${invoice._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (resp.ok) {
        const updated = await resp.json();
        setInvoice(updated);
        // Reset manual state based on new data
        setIsRecipientManual(updated.customerName !== updated.recipientName);

        Swal.fire({
          icon: 'success',
          title: 'Đã lưu thay đổi!',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000,
        });
        router.refresh();
      } else {
        throw new Error('Lỗi cập nhật');
      }
    } catch (e) {
      Swal.fire('Lỗi', 'Không thể cập nhật hóa đơn.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExportExcel = () => {
    const exportData: any[] = invoice.items.map((item: any, index: number) => ({
      'STT': index + 1,
      'Tên sản phẩm': item.specName && item.specName !== 'Mặc định' ? `${item.name} (${item.specName})` : item.name,
      'Số lượng': item.quantity,
      'Đơn vị tính': item.unit,
      'Đơn giá': item.price,
      'Thành tiền': item.total
    }));

    exportData.push({
      'STT': '',
      'Tên sản phẩm': 'TỔNG CỘNG',
      'Số lượng': null,
      'Đơn vị tính': '',
      'Đơn giá': null,
      'Thành tiền': invoice.totalAmount
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    worksheet['!cols'] = [{ wch: 5 }, { wch: 40 }, { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 15 }];

    const range = XLSX.utils.decode_range(worksheet['!ref']!);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell = worksheet[XLSX.utils.encode_cell({ c: C, r: R })];
        if (!cell) continue;
        cell.s = { font: { name: 'Arial', sz: 10 }, border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } } };
        if (R === 0 || R === exportData.length) cell.s.font.bold = true;
        if (C === 4 || C === 5) cell.z = '#,##0';
      }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'HoaDon');
    XLSX.writeFile(workbook, `HoaDon_${invoice.invoiceNumber}.xlsx`);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rowsHtml = invoice.items.map((item: any, index: number) => `
      <tr>
        <td style="text-align:center">${index + 1}</td>
        <td>${item.name} ${item.specName && item.specName !== 'Mặc định' ? `(${item.specName})` : ''}</td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:center">${item.unit}</td>
        <td style="text-align:right">${formatVND(item.price)}</td>
        <td style="text-align:right">${formatVND(item.total)}</td>
      </tr>
    `).join('');

    const html = `
      <html>
        <head>
          <title>In hóa đơn ${invoice.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #000; padding: 8px; font-size: 14px; }
            th { background: #f2f2f2; }
            .header { text-align: center; margin-bottom: 30px; }
            .meta { margin-bottom: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>HÓA ĐƠN BÁN HÀNG</h1>
            <p>Số: ${invoice.invoiceNumber}</p>
          </div>
          <div class="meta">
            <div>
              <p><strong>Khách hàng:</strong> ${formData.customerName}</p>
              <p><strong>Người lấy:</strong> ${formData.recipientName}</p>
            </div>
            <div style="text-align: right">
              <p><strong>Ngày lập:</strong> ${new Date(formData.invoiceDate).toLocaleDateString('vi-VN')}</p>
              <p><strong>Trạng thái:</strong> ${formData.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>STT</th>
                <th>Sản phẩm</th>
                <th>SL</th>
                <th>ĐVT</th>
                <th>Đơn giá</th>
                <th>Thành tiền</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
            <tfoot>
              <tr>
                <td colspan="5" style="text-align:center; font-weight:bold">TỔNG CỘNG</td>
                <td style="text-align:right; font-weight:bold">${formatVND(invoice.totalAmount)}</td>
              </tr>
            </tfoot>
          </table>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen pb-24 bg-white">
      <div className="w-full">
        {/* Metadata Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-slate-200">
          <div className="p-4 border-r border-slate-100 space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100 mb-2">
              <User size={14} className="text-emerald-600" />
              <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Khách hàng</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
              <Combobox
                label="Chủ nhà"
                options={customers.map(c => c.name)}
                value={formData.customerName}
                onChange={(val: string) => {
                  setFormData(prev => ({
                    ...prev,
                    customerName: val,
                    recipientName: isRecipientManual ? prev.recipientName : val
                  }));
                }}
                placeholder="Chọn chủ nhà..."
              />

              <Combobox
                label="Người lấy (Thợ)"
                options={customers.map(c => c.name)}
                value={formData.recipientName}
                onChange={(val: string) => {
                  setIsRecipientManual(true);
                  setFormData({ ...formData, recipientName: val });
                }}
                placeholder="Chọn người lấy..."
              />
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100 mb-2">
              <Calendar size={14} className="text-emerald-600" />
              <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Giao dịch</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Ngày lập</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:ring-1 focus:ring-emerald-500 outline-none text-sm font-bold"
                  value={formData.invoiceDate}
                  onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Trạng thái</label>
                <select
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:ring-1 focus:ring-emerald-500 outline-none text-sm font-bold appearance-none"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="pending">Chờ thanh toán</option>
                  <option value="paid">Đã thanh toán</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </div>

              <div className={`space-y-1 transition-all duration-300 ${formData.status === 'paid' ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                <label className="text-[9px] font-bold text-emerald-600 uppercase flex items-center gap-1">
                  <DollarSign size={10} /> Thanh toán
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-emerald-50 border border-emerald-100 focus:ring-1 focus:ring-emerald-500 outline-none text-sm font-bold text-emerald-700"
                  value={formData.paidAt}
                  onChange={(e) => setFormData({ ...formData, paidAt: e.target.value })}
                  disabled={formData.status !== 'paid'}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-2 text-left text-[9px] font-black uppercase text-slate-400 tracking-wider w-12">STT</th>
                <th className="px-4 py-2 text-left text-[9px] font-black uppercase text-slate-400 tracking-wider">Sản phẩm / Quy cách</th>
                <th className="px-4 py-2 text-center text-[9px] font-black uppercase text-slate-400 tracking-wider">Số lượng</th>
                <th className="px-4 py-2 text-center text-[9px] font-black uppercase text-slate-400 tracking-wider">ĐVT</th>
                <th className="px-4 py-2 text-right text-[9px] font-black uppercase text-slate-400 tracking-wider">Đơn giá</th>
                <th className="px-4 py-2 text-right text-[9px] font-black uppercase text-slate-400 tracking-wider">Thành tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items.map((item: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-4 py-2 text-xs text-slate-400 font-medium tabular-nums">{idx + 1}</td>
                  <td className="px-4 py-2">
                    <div className="text-xs font-bold text-slate-900">{item.name}</div>
                    {item.specName && item.specName !== 'Mặc định' && (
                      <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-tighter mt-0.5">{item.specName}</div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span className="text-xs font-black tabular-nums">{item.quantity}</span>
                  </td>
                  <td className="px-4 py-2 text-center text-xs font-bold text-slate-500">{item.unit}</td>
                  <td className="px-4 py-2 text-right text-xs text-slate-500 tabular-nums">{formatVND(item.price)}</td>
                  <td className="px-4 py-2 text-right text-xs font-black text-slate-900 tabular-nums group-hover:text-emerald-700 transition-colors">
                    {formatVND(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-emerald-600">
                <td colSpan={4} className="px-4 py-4 text-center text-[10px] font-black text-emerald-50 uppercase tracking-widest border-r border-emerald-500/30">
                  Tổng cộng giá trị hóa đơn
                </td>
                <td colSpan={2} className="px-4 py-4 text-right text-2xl font-black text-white tabular-nums">
                  {formatVND(invoice.totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* STICKY FOOTER */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-4 py-2 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-between gap-4">
          <div className="hidden sm:flex items-center gap-4 text-slate-400">
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Invoice</span>
              <span className="text-xs font-bold text-slate-900">#{invoice.invoiceNumber}</span>
            </div>
            <div className="w-px h-6 bg-slate-200" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total</span>
              <span className="text-xs font-black text-emerald-700">{formatVND(invoice.totalAmount)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-all active:scale-95 rounded"
            >
              <Printer size={16} />
              In
            </button>
            <button
              onClick={handleExportExcel}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold text-xs hover:bg-emerald-100 transition-all active:scale-95 rounded"
            >
              <FileSpreadsheet size={16} />
              Excel
            </button>
            <button
              onClick={handleSave}
              disabled={!isDirty || isUpdating}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-8 py-2 font-bold text-xs transition-all rounded shadow-sm active:scale-95 
                ${isDirty && !isUpdating
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}
              `}
            >
              {isUpdating ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Lưu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
