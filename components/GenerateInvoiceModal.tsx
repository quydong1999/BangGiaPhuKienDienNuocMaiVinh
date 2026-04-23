"use client";

import { useState, useEffect, useCallback } from "react";
import { FormModal } from "./FormModal";
import { Combobox } from "./Combobox";
import {
  Zap,
  RefreshCw,
  Save,
  Calendar,
  CheckCircle2,
  Package,
  TrendingUp,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { formatVND } from "@/lib/utils";
import Swal from "sweetalert2";

interface GeneratedItem {
  productId: string;
  name: string;
  specName: string;
  unit: string;
  quantity: number;
  price: number;
  total: number;
}

interface GenerateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (invoice: any) => void;
}

type Step = "config" | "preview";

export function GenerateInvoiceModal({
  isOpen,
  onClose,
  onSuccess,
}: GenerateInvoiceModalProps) {
  const [step, setStep] = useState<Step>("config");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isRecipientManual, setIsRecipientManual] = useState(false);

  // Config form
  const [minTotal, setMinTotal] = useState("");
  const [maxTotal, setMaxTotal] = useState("");
  const [formData, setFormData] = useState({
    customerName: "Khách tự động",
    recipientName: "Khách tự động",
    invoiceDate: new Date().toISOString().split("T")[0],
    status: "paid",
  });

  // Preview data
  const [generatedItems, setGeneratedItems] = useState<GeneratedItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);

  // Fetch customers for combobox
  useEffect(() => {
    if (isOpen) {
      const fetchCustomers = async () => {
        try {
          const resp = await fetch("/api/customers");
          if (resp.ok) {
            const data = await resp.json();
            setCustomers(data);
          }
        } catch (e) {
          console.error("Lỗi lấy danh sách khách hàng:", e);
        }
      };
      fetchCustomers();
    }
  }, [isOpen]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep("config");
      setError(null);
      setGeneratedItems([]);
      setTotalAmount(0);
      setMinTotal("");
      setMaxTotal("");
      setIsRecipientManual(false);
      setFormData({
        customerName: "Khách tự động",
        recipientName: "Khách tự động",
        invoiceDate: new Date().toISOString().split("T")[0],
        status: "paid",
      });
    }
  }, [isOpen]);

  const handleGenerate = useCallback(async () => {
    const min = Number(minTotal);
    const max = Number(maxTotal);

    if (!min || !max || min <= 0 || max <= 0) {
      setError("Vui lòng nhập giá trị hợp lệ (lớn hơn 0)");
      return;
    }
    if (min > max) {
      setError("Giá trị A phải nhỏ hơn hoặc bằng B");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const resp = await fetch("/api/invoices/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minTotal: min, maxTotal: max }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        setError(data.error || "Có lỗi xảy ra khi tạo hóa đơn");
        return;
      }

      setGeneratedItems(data.items);
      setTotalAmount(data.totalAmount);
      setStep("preview");
    } catch (e) {
      setError("Không thể kết nối tới server");
    } finally {
      setIsGenerating(false);
    }
  }, [minTotal, maxTotal]);

  const handleRegenerate = useCallback(async () => {
    // Go back to re-generate with same params
    setIsGenerating(true);
    setError(null);

    try {
      const resp = await fetch("/api/invoices/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minTotal: Number(minTotal),
          maxTotal: Number(maxTotal),
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        setError(data.error || "Có lỗi xảy ra khi tạo lại");
        return;
      }

      setGeneratedItems(data.items);
      setTotalAmount(data.totalAmount);
    } catch (e) {
      setError("Không thể kết nối tới server");
    } finally {
      setIsGenerating(false);
    }
  }, [minTotal, maxTotal]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);

    try {
      const invoiceData = {
        ...formData,
        items: generatedItems.map((item) => ({
          productId: item.productId,
          name: item.name,
          specName: item.specName,
          unit: item.unit,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        })),
        totalAmount,
      };

      const resp = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoiceData),
      });

      if (resp.ok) {
        const savedInvoice = await resp.json();
        Swal.fire({
          icon: "success",
          title: "Đã tạo hóa đơn!",
          text: `Hóa đơn ${formatVND(totalAmount)} đã được lưu thành công.`,
          confirmButtonColor: "#059669",
        });
        onSuccess?.(savedInvoice);
        onClose();
      } else {
        throw new Error("Lỗi khi lưu hóa đơn");
      }
    } catch (e) {
      Swal.fire("Lỗi", "Không thể lưu hóa đơn. Vui lòng thử lại.", "error");
    } finally {
      setIsSaving(false);
    }
  }, [formData, generatedItems, totalAmount, onSuccess, onClose]);

  const isPending = isGenerating || isSaving;

  return (
    <FormModal isOpen={isOpen} onClose={onClose} isPending={isPending}>
      <FormModal.Header
        title={
          step === "config"
            ? "Tạo Hóa Đơn Ngẫu Nhiên"
            : "Xem Trước Hóa Đơn"
        }
        onClose={onClose}
        disabled={isPending}
      />

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {step === "config" ? (
          /* ─── STEP 1: CONFIG FORM ─── */
          <div className="space-y-4">
            {/* Decorative header */}
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-violet-50 to-fuchsia-50 rounded-xl border border-violet-100">
              <div className="p-2 bg-violet-100 rounded-lg">
                <Sparkles size={18} className="text-violet-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-violet-800">
                  Tạo tự động
                </p>
                <p className="text-[10px] text-violet-500">
                  Hệ thống sẽ chọn ngẫu nhiên sản phẩm và số lượng
                </p>
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1.5">
                <TrendingUp size={12} />
                Khoảng giá trị hóa đơn (VND)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 px-1">
                    Từ (A)
                  </span>
                  <input
                    type="number"
                    placeholder="500,000"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all font-semibold tabular-nums"
                    value={minTotal}
                    onChange={(e) => {
                      setMinTotal(e.target.value);
                      setError(null);
                    }}
                    min={0}
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 px-1">
                    Đến (B)
                  </span>
                  <input
                    type="number"
                    placeholder="2,000,000"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all font-semibold tabular-nums"
                    value={maxTotal}
                    onChange={(e) => {
                      setMaxTotal(e.target.value);
                      setError(null);
                    }}
                    min={0}
                  />
                </div>
              </div>
            </div>

            {/* Customer Name */}
            <Combobox
              label="Tên khách hàng (Chủ nhà)"
              options={customers.map((c) => c.name)}
              value={formData.customerName}
              onChange={(val: string) => {
                setFormData((prev) => ({
                  ...prev,
                  customerName: val,
                  recipientName: isRecipientManual ? prev.recipientName : val,
                }));
              }}
              placeholder="Nhập tên khách hàng..."
              required
            />

            {/* Recipient Name */}
            <Combobox
              label="Người lấy hàng (Thợ)"
              options={customers.map((c) => c.name)}
              value={formData.recipientName}
              onChange={(val: string) => {
                setIsRecipientManual(true);
                setFormData({ ...formData, recipientName: val });
              }}
              placeholder="Nhập tên người lấy hàng..."
              required
            />

            <div className="grid grid-cols-2 gap-3">
              {/* Invoice Date */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1.5">
                  <Calendar size={12} />
                  Ngày lập
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all font-medium"
                  value={formData.invoiceDate}
                  onChange={(e) =>
                    setFormData({ ...formData, invoiceDate: e.target.value })
                  }
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
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none transition-all font-medium"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                >
                  <option value="pending">Chưa thanh toán</option>
                  <option value="paid">Đã thanh toán</option>
                </select>
              </div>
            </div>

            {/* Error display */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                <AlertCircle
                  size={16}
                  className="text-red-500 mt-0.5 flex-shrink-0"
                />
                <p className="text-xs text-red-600 font-medium">{error}</p>
              </div>
            )}
          </div>
        ) : (
          /* ─── STEP 2: PREVIEW ─── */
          <div className="space-y-4">
            {/* Summary banner */}
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                  Tổng giá trị
                </span>
                <span className="text-[10px] font-bold text-emerald-500">
                  {generatedItems.length} sản phẩm
                </span>
              </div>
              <p className="text-2xl font-black text-emerald-800 tabular-nums tracking-tight">
                {formatVND(totalAmount)}
              </p>
              <p className="text-[10px] text-emerald-500 mt-1">
                Khoảng: {formatVND(Number(minTotal))} –{" "}
                {formatVND(Number(maxTotal))}
              </p>
            </div>

            {/* Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Khách hàng
                </p>
                <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                  {formData.customerName}
                </p>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Người lấy
                </p>
                <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                  {formData.recipientName}
                </p>
              </div>
            </div>

            {/* Items table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Package size={12} />
                  Danh sách sản phẩm
                </p>
              </div>
              <div className="divide-y divide-slate-50 max-h-[250px] overflow-y-auto">
                {generatedItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-2.5 flex items-center justify-between gap-2 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {item.specName} · {item.unit}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-black text-slate-700 tabular-nums">
                        {formatVND(item.total)}
                      </p>
                      <p className="text-[10px] text-slate-400 tabular-nums">
                        {item.quantity} × {formatVND(item.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Error on preview */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                <AlertCircle
                  size={16}
                  className="text-red-500 mt-0.5 flex-shrink-0"
                />
                <p className="text-xs text-red-600 font-medium">{error}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── FOOTER BUTTONS ─── */}
      <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50">
        {step === "config" ? (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-white transition-all active:scale-95 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isPending || !minTotal || !maxTotal}
              className="flex-[2] px-4 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm rounded-xl hover:from-violet-700 hover:to-fuchsia-700 shadow-lg shadow-violet-200 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Zap size={18} />
              )}
              Tạo hóa đơn
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep("config")}
              disabled={isPending}
              className="px-4 py-3 border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-white transition-all active:scale-95 disabled:opacity-50"
            >
              Quay lại
            </button>
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={isPending}
              className="flex-1 px-4 py-3 border-2 border-violet-200 text-violet-700 font-bold text-sm rounded-xl hover:bg-violet-50 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isGenerating ? (
                <div className="w-4 h-4 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
              ) : (
                <RefreshCw size={16} />
              )}
              Tạo lại
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="flex-1 px-4 py-3 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Lưu
            </button>
          </div>
        )}
      </div>
    </FormModal>
  );
}
