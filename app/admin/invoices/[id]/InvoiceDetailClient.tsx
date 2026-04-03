'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Printer, FileSpreadsheet, CheckCircle, Clock, XCircle, AlertCircle, Calendar } from 'lucide-react';
import { formatVND } from '@/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import Swal from 'sweetalert2';

interface InvoiceDetailClientProps {
  initialInvoice: any;
}

const statusOptions = [
  { value: 'pending', label: 'Chưa thanh toán', icon: Clock, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { value: 'paid', label: 'Đã thanh toán', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { value: 'cancelled', label: 'Đã hủy', icon: XCircle, color: 'text-slate-600 bg-slate-50 border-slate-200' },
];

export default function InvoiceDetailClient({ initialInvoice }: InvoiceDetailClientProps) {
  const [invoice, setInvoice] = useState(initialInvoice);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateStatus = async (newStatus: string) => {
    if (newStatus === invoice.status) return;

    setIsUpdating(true);
    try {
      const resp = await fetch(`/api/invoices/${invoice._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (resp.ok) {
        const updated = await resp.json();
        setInvoice(updated);
        Swal.fire({
          icon: 'success',
          title: 'Đã cập nhật!',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
        });
      } else {
        throw new Error('Lỗi cập nhật');
      }
    } catch (e) {
      Swal.fire('Lỗi', 'Không thể cập nhật trạng thái.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/invoices"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Quay lại danh sách</span>
        </Link>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm overflow-hidden p-6 space-y-8">
        {/* Header Info */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Hóa đơn #{invoice.invoiceNumber}</h1>
            <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Calendar size={14} />
                <span>Ngày lập: {format(new Date(invoice.invoiceDate), 'dd/MM/yyyy', { locale: vi })}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
             <div className="text-xs font-semibold text-slate-500 uppercase">Cập nhật trạng thái</div>
             <div className="flex flex-wrap gap-2">
                {statusOptions.map((opt) => {
                   const Icon = opt.icon;
                   const isActive = invoice.status === opt.value;
                   return (
                     <button
                       key={opt.value}
                       onClick={() => handleUpdateStatus(opt.value)}
                       disabled={isUpdating}
                       className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-sm ${
                         isActive 
                           ? opt.color + ' ring-2 ring-offset-1 ring-emerald-500 scale-105 z-10' 
                           : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                       }`}
                     >
                       <Icon size={14} />
                       {opt.label}
                     </button>
                   );
                })}
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 border-y border-slate-100">
            <div className="space-y-4">
                <div className="text-xs font-black uppercase text-emerald-600 tracking-wider">Thông tin khách hàng</div>
                <div>
                    <div className="text-lg font-bold text-slate-900">{invoice.customerName}</div>
                    {invoice.customerPhone && <div className="text-slate-500">SĐT: {invoice.customerPhone}</div>}
                </div>
            </div>
            <div className="space-y-4">
                <div className="text-xs font-black uppercase text-emerald-600 tracking-wider">Thông tin nhận hàng</div>
                <div>
                     <div className="text-lg font-bold text-slate-900">{invoice.recipientName || invoice.customerName}</div>
                </div>
            </div>
        </div>

        {/* Table items */}
        <div className="space-y-4">
            <div className="text-xs font-black uppercase text-emerald-600 tracking-wider">Danh sách sản phẩm</div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-200">
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">STT</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Tên sản phẩm / Quy cách</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">SL</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">ĐVT</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Đơn giá</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {invoice.items.map((item: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                                <td className="px-4 py-3 text-sm text-slate-500">{idx + 1}</td>
                                <td className="px-4 py-3 text-sm">
                                    <div className="font-bold text-slate-900">{item.name}</div>
                                    {item.specName && <div className="text-[10px] font-bold text-emerald-600 uppercase">{item.specName}</div>}
                                </td>
                                <td className="px-4 py-3 text-sm font-bold text-slate-900 text-center">{item.quantity}</td>
                                <td className="px-4 py-3 text-sm text-slate-500 text-center">{item.unit}</td>
                                <td className="px-4 py-3 text-sm text-slate-500 text-right">{formatVND(item.price)}</td>
                                <td className="px-4 py-3 text-sm font-bold text-emerald-700 text-right">{formatVND(item.total)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="bg-emerald-50/50">
                            <td colSpan={4} className="px-4 py-4 text-center text-sm font-black text-slate-700 uppercase tracking-wider">Tổng cộng</td>
                            <td colSpan={2} className="px-4 py-4 text-right text-2xl font-black text-emerald-700 tabular-nums">{formatVND(invoice.totalAmount)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-6">
            <button className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-all active:scale-95 opacity-50 cursor-not-allowed">
                <Printer size={18} />
                In hóa đơn (Sớm ra mắt)
            </button>
            <button className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-all shadow-md active:scale-95 shadow-emerald-200 opacity-50 cursor-not-allowed">
                <FileSpreadsheet size={18} />
                Xuất Excel (Sớm ra mắt)
            </button>
        </div>
      </div>
    </div>
  );
}
