"use client";

import React from 'react';
import { HomeHeader } from '@/components/HomeHeader';
import { motion } from 'framer-motion';
import { ChevronLeft, Landmark, CreditCard, Copy, CheckCircle2, QrCode, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const PaymentPage = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const BANK_ID = "timo";
  const ACCOUNT_NO = "4305205241021";
  const ACCOUNT_NAME = "MAI THI VINH";
  const AMOUNT = 10000;
  const DESCRIPTION = "chuyen khoan thanh toan nuoc sach thang 03 2026";

  const handlePayment = () => {
    const vietQrLink = `https://dl.vietqr.io/pay?app=${BANK_ID}&va=${ACCOUNT_NO}&am=${AMOUNT}&addInfo=${encodeURIComponent(DESCRIPTION)}`;
    window.location.href = vietQrLink;
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  // VietQR Image URL (using vietqr.io API)
  const qrUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.jpg?amount=${AMOUNT}&addInfo=${encodeURIComponent(DESCRIPTION)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col pb-12">
      <HomeHeader compact />

      <div className="w-full max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors group mb-2"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Quay lại trang chủ</span>
        </Link>

        {/* Header Section */}
        <div className="text-center space-y-2">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-slate-800"
          >
            Thanh toán trực tuyến
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-slate-500"
          >
            Quét mã QR hoặc nhấn vào nút bên dưới để thanh toán nhanh chóng
          </motion.p>
        </div>

        {/* Main Content Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden"
        >
          {/* Top Banner (Optional Gradient) */}
          <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500 w-full" />

          <div className="p-6 sm:p-8 space-y-8">

            {/* QR Code Section */}
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative group p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                <img
                  src={qrUrl}
                  alt="VietQR Code"
                  className="w-64 h-64 sm:w-72 sm:h-72 object-contain rounded-lg"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <QrCode size={40} className="text-emerald-600/20" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <Smartphone size={14} />
                Mở app ngân hàng để quét mã
              </div>
            </div>

            {/* Payment Details */}
            <div className="grid grid-cols-1 gap-4">
              {/* Bank Selection Display */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
                  <Landmark size={24} />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">Ngân hàng thụ hưởng</div>
                  <div className="font-bold text-slate-800">Agribank</div>
                </div>
              </div>

              {/* Account Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-1 relative overflow-hidden">
                  <div className="text-xs text-slate-400 font-medium">Số tài khoản</div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-lg tracking-wide">{ACCOUNT_NO}</span>
                    <button
                      onClick={() => copyToClipboard(ACCOUNT_NO, 'acc')}
                      className="text-slate-400 hover:text-emerald-600 transition-colors p-1"
                    >
                      {copied === 'acc' ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-1">
                  <div className="text-xs text-slate-400 font-medium">Chủ tài khoản</div>
                  <div className="font-bold text-slate-800 uppercase">{ACCOUNT_NAME}</div>
                </div>
              </div>

              {/* Amount & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-1">
                  <div className="text-xs text-emerald-600 font-medium uppercase tracking-tight">Số tiền thanh toán</div>
                  <div className="font-bold text-emerald-700 text-2xl">
                    {AMOUNT.toLocaleString('vi-VN')} <span className="text-sm font-normal">VNĐ</span>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-1">
                  <div className="text-xs text-slate-400 font-medium">Nội dung</div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-slate-600 text-sm leading-tight line-clamp-2">{DESCRIPTION}</span>
                    <button
                      onClick={() => copyToClipboard(DESCRIPTION, 'desc')}
                      className="text-slate-400 hover:text-emerald-600 transition-colors p-1 flex-shrink-0"
                    >
                      {copied === 'desc' ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <button
                onClick={handlePayment}
                className="group relative w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-emerald-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <Smartphone size={22} className="group-hover:rotate-12 transition-transform" />
                Mở App Ngân hàng Thanh toán
              </button>
              <p className="text-center text-[10px] text-slate-400 mt-4 uppercase tracking-[0.2em] font-medium">
                Kết nối an toàn qua VietQR DeepLink
              </p>
            </div>

          </div>
        </motion.div>

        {/* Troubleshooting / Note */}
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex gap-3">
          <div className="mt-0.5 text-amber-600 flex-shrink-0">
            <Landmark size={20} />
          </div>
          <div className="text-sm text-amber-800 leading-relaxed">
            <strong>Lưu ý:</strong> Vui lòng giữ nguyên nội dung chuyển khoản để hệ thống có thể đối soát tự động. Nếu gặp sự cố, hãy chụp ảnh màn hình giao dịch và gửi cho hỗ trợ.
          </div>
        </div>
      </div>
    </main>
  );
};

export default PaymentPage;
