"use client";

import { useState, useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { clearCart } from "@/store/cartSlice";
import { FormModal } from "./FormModal";
import { Save, User, Calendar, CheckCircle2 } from "lucide-react";
import Swal from "sweetalert2";

interface SaveInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: any[];
  grandTotal: number;
}

export function SaveInvoiceModal({ isOpen, onClose, items, grandTotal }: SaveInvoiceModalProps) {
  const dispatch = useAppDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isRecipientManual, setIsRecipientManual] = useState(false);

  const [formData, setFormData] = useState({
    customerName: "Khách vãng lai",
    recipientName: "Khách vãng lai",
    invoiceDate: new Date().toISOString().split('T')[0],
    status: "paid"
  });

  useEffect(() => {
    if (isOpen) {
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
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const invoiceData = {
        ...formData,
        items: items.map(item => ({
          productId: item.product._id,
          name: item.product.name,
          specName: item.specName,
          unit: item.unit,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        })),
        totalAmount: grandTotal
      };

      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData)
      });

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Đã lưu hóa đơn!',
          text: 'Hóa đơn đã được lưu vào hệ thống.',
          confirmButtonColor: '#059669',
        }).then(() => {
          dispatch(clearCart());
          onClose();
        });
      } else {
        throw new Error('Lỗi khi lưu hóa đơn');
      }
    } catch (error) {
      Swal.fire('Lỗi', 'Không thể lưu hóa đơn. Vui lòng thử lại.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} isPending={isSubmitting}>
      <FormModal.Header
        title="Lưu Hóa Đơn Mới"
        onClose={onClose}
        disabled={isSubmitting}
      />

      <FormModal.Body onSubmit={handleSubmit}>
        <div className="space-y-4 py-2">
          {/* Customer Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1.5">
              <User size={12} />
              Tên khách hàng (Chủ nhà)
            </label>
            <input
              type="text"
              list="customer-list-save"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
              value={formData.customerName}
              onChange={(e) => {
                const val = e.target.value;
                setFormData(prev => ({
                  ...prev,
                  customerName: val,
                  recipientName: isRecipientManual ? prev.recipientName : val
                }));
              }}
              required
            />
            <datalist id="customer-list-save">
              {customers.map(c => (
                <option key={c._id} value={c.name} />
              ))}
            </datalist>
          </div>

          {/* Recipient Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1.5">
              <User size={12} />
              Người lấy hàng (Thợ)
            </label>
            <input
              type="text"
              list="customer-list-save"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
              value={formData.recipientName}
              onChange={(e) => {
                setIsRecipientManual(true);
                setFormData({ ...formData, recipientName: e.target.value });
              }}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Invoice Date */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1.5">
                <Calendar size={12} />
                Ngày lập
              </label>
              <input
                type="date"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                value={formData.invoiceDate}
                onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                required
              />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1.5">
                <CheckCircle2 size={12} />
                Trạng thái
              </label>
              <select
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none transition-all font-medium"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="pending">Chưa thanh toán</option>
                <option value="paid">Đã thanh toán</option>
              </select>
            </div>
          </div>

          <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-tight">Tổng số tiền</span>
              <span className="text-lg font-black text-emerald-700">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(grandTotal)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={18} />
            )}
            Lưu hóa đơn
          </button>
        </div>
      </FormModal.Body>
    </FormModal>
  );
}
