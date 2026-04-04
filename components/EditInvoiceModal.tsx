"use client";

import { useState, useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { FormModal } from "./FormModal";
import { Save, User, Calendar, CheckCircle2, DollarSign } from "lucide-react";
import { Combobox } from "./Combobox";
import Swal from "sweetalert2";
import { formatVND } from "@/lib/utils";

interface EditInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  onSuccess?: (updatedInvoice: any) => void;
  onOptimisticUpdate?: (optimisticInvoice: any) => void;
  onRollback?: () => void;
}

export function EditInvoiceModal({ isOpen, onClose, invoice, onSuccess, onOptimisticUpdate, onRollback }: EditInvoiceModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isRecipientManual, setIsRecipientManual] = useState(false);
  
  const [formData, setFormData] = useState({
    customerName: "",
    recipientName: "",
    invoiceDate: "",
    status: "",
    paidAt: ""
  });

  useEffect(() => {
    if (isOpen && invoice) {
      setFormData({
        customerName: invoice.customerName || "",
        recipientName: invoice.recipientName || "",
        invoiceDate: invoice.invoiceDate ? new Date(invoice.invoiceDate).toISOString().split('T')[0] : "",
        status: invoice.status || "pending",
        paidAt: invoice.paidAt ? new Date(invoice.paidAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      });
      // If names are different, mark as manual to avoid accidental sync
      setIsRecipientManual(invoice.customerName !== invoice.recipientName);

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
  }, [isOpen, invoice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Optimistic update
      if (onOptimisticUpdate) {
        onOptimisticUpdate({ ...invoice, ...formData });
      }

      const response = await fetch(`/api/invoices/${invoice._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const updatedInvoice = await response.json();
        if (onSuccess) onSuccess(updatedInvoice);
        
        Swal.fire({
          icon: 'success',
          title: 'Đã cập nhật!',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000
        });
        onClose();
      } else {
        throw new Error('Cập nhật thất bại');
      }
    } catch (error) {
      if (onRollback) onRollback();
      Swal.fire('Lỗi', 'Không thể cập nhật thông tin hóa đơn. Vui lòng thử lại.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} isPending={isSubmitting}>
      <FormModal.Header 
        title={`Sửa Hóa Đơn: ${invoice?.invoiceNumber}`} 
        onClose={onClose} 
        disabled={isSubmitting} 
      />
      
      <FormModal.Body onSubmit={handleSubmit}>
        <div className="space-y-4 py-2">
          {/* Customer Name */}
          <Combobox
            label="Tên khách hàng (Chủ nhà)"
            options={customers.map(c => c.name)}
            value={formData.customerName}
            onChange={(val: string) => {
              setFormData(prev => ({
                ...prev,
                customerName: val,
                recipientName: isRecipientManual ? prev.recipientName : val
              }));
            }}
            placeholder="Nhập tên khách hàng..."
            required
          />

          {/* Recipient Name */}
          <Combobox
            label="Người lấy hàng (Thợ)"
            options={customers.map(c => c.name)}
            value={formData.recipientName}
            onChange={(val: string) => {
              setIsRecipientManual(true);
              setFormData({ ...formData, recipientName: val });
            }}
            placeholder="Nhập tên người lấy hàng..."
            required
          />

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
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
          </div>

          {/* Paid At - Conditional */}
          {formData.status === 'paid' && (
            <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
              <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest px-1 flex items-center gap-1.5">
                <DollarSign size={12} />
                Ngày thanh toán
              </label>
              <input
                type="date"
                className="w-full px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold text-emerald-700"
                value={formData.paidAt}
                onChange={(e) => setFormData({ ...formData, paidAt: e.target.value })}
                required
              />
            </div>
          )}

          <div className="mt-4 p-4 bg-slate-100/50 rounded-xl border border-slate-200 dashed">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Giá trị hóa đơn</span>
              <span className="text-base font-black text-slate-800">
                {formatVND(invoice?.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
          >
            Đóng
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
            Lưu thay đổi
          </button>
        </div>
      </FormModal.Body>
    </FormModal>
  );
}
