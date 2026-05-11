"use client";

import { useState } from 'react';
import { FormModal } from './FormModal';
import { FileSpreadsheet, Printer, Receipt, FileText, FileDown } from 'lucide-react';
import { exportDocumentToExcel, printSalesReceiptHTML, printQuotationHTML, exportDocumentToPDF } from '@/lib/document-service';
import type { CartItem } from '@/store/cartSlice';

interface ShareDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  grandTotal: number;
}

export function ShareDocumentModal({ isOpen, onClose, items, grandTotal }: ShareDocumentModalProps) {
  const [documentType, setDocumentType] = useState<'receipt' | 'quotation'>('receipt');
  const [includeVAT, setIncludeVAT] = useState(false);

  const handleExportExcel = () => {
    exportDocumentToExcel(items, grandTotal, documentType, documentType === 'quotation' && includeVAT);
    onClose();
  };

  const handleExportPDF = () => {
    exportDocumentToPDF(items, grandTotal, documentType, documentType === 'quotation' && includeVAT);
    onClose();
  };

  const handlePrint = () => {
    if (documentType === 'receipt') {
      printSalesReceiptHTML(items, grandTotal);
    } else {
      printQuotationHTML(items, grandTotal, includeVAT);
    }
    onClose();
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} isPending={false}>
      <FormModal.Header title="Chia sẻ tài liệu" onClose={onClose} disabled={false} />
      <FormModal.Body onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700">Loại tài liệu</label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`
                flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors
                ${documentType === 'receipt' ? 'bg-teal-50 border-teal-600 ring-1 ring-teal-600' : 'bg-white border-slate-200 hover:bg-slate-50'}
              `}>
                <input
                  type="radio"
                  name="documentType"
                  value="receipt"
                  checked={documentType === 'receipt'}
                  onChange={(e) => {
                    setDocumentType(e.target.value as 'receipt');
                    setIncludeVAT(false); // Reset VAT when switching
                  }}
                  className="w-4 h-4 text-teal-600 focus:ring-teal-600"
                />
                <div className="flex items-center gap-2">
                  <Receipt size={18} className={documentType === 'receipt' ? 'text-teal-600' : 'text-slate-500'} />
                  <span className="font-medium text-slate-900">Phiếu bán hàng</span>
                </div>
              </label>

              <label className={`
                flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors
                ${documentType === 'quotation' ? 'bg-teal-50 border-teal-600 ring-1 ring-teal-600' : 'bg-white border-slate-200 hover:bg-slate-50'}
              `}>
                <input
                  type="radio"
                  name="documentType"
                  value="quotation"
                  checked={documentType === 'quotation'}
                  onChange={(e) => setDocumentType(e.target.value as 'quotation')}
                  className="w-4 h-4 text-teal-600 focus:ring-teal-600"
                />
                <div className="flex items-center gap-2">
                  <FileText size={18} className={documentType === 'quotation' ? 'text-teal-600' : 'text-slate-500'} />
                  <span className="font-medium text-slate-900">Bảng báo giá</span>
                </div>
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700">Tùy chọn hiển thị</label>
            <label className={`flex items-center gap-3 p-3 border rounded-lg transition-colors ${documentType === 'quotation' ? 'cursor-pointer bg-white border-slate-200 hover:bg-slate-50' : 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200'}`}>
              <input
                type="checkbox"
                checked={includeVAT}
                disabled={documentType !== 'quotation'}
                onChange={(e) => setIncludeVAT(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-600 disabled:opacity-50"
              />
              <span className="font-medium text-slate-900">Cộng VAT (8%)</span>
            </label>
          </div>

          <div className="pt-4 flex gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-teal-600 text-teal-600 font-semibold rounded-lg hover:bg-teal-50 active:scale-[0.98] transition-all"
            >
              <FileSpreadsheet size={18} />
              <span>Excel</span>
            </button>
            <button
              type="button"
              onClick={handleExportPDF}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-teal-600 text-teal-600 font-semibold rounded-lg hover:bg-teal-50 active:scale-[0.98] transition-all"
            >
              <FileDown size={18} />
              <span>PDF</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 active:scale-[0.98] transition-all shadow-sm"
            >
              <Printer size={18} />
              <span>In tài liệu</span>
            </button>
          </div>
        </div>
      </FormModal.Body>
    </FormModal>
  );
}
