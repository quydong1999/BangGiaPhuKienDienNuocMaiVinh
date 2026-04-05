"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { HomeHeader } from '@/components/HomeHeader';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Landmark, CreditCard, Copy,
  CheckCircle2, QrCode, Smartphone, Search,
  X, ChevronRight, Info
} from 'lucide-react';
import Link from 'next/link';

interface BankApp {
  appId: string;
  appName: string;
  bankName: string;
  appLogo: string;
  deeplink: string;
}

const PaymentPage = () => {
  const [copied, setCopied] = useState<string | null>(null);
  const [userOS, setUserOS] = useState<'iOS' | 'Android' | 'Desktop'>('Desktop');
  const [bankApps, setBankApps] = useState<BankApp[]>([]);
  const [selectedApp, setSelectedApp] = useState<BankApp | null>(null);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const DESTINATION_BANK_NAME = "Agribank";
  const ACCOUNT_NO = "4305205241021";
  const ACCOUNT_NAME = "MAI THI VINH";
  const AMOUNT = 10000;
  const DESCRIPTION = "chuyen khoan thanh toan nuoc sach thang 03 2026";

  // OS Detection
  useEffect(() => {
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) {
      setUserOS('iOS');
    } else if (/android/i.test(ua)) {
      setUserOS('Android');
    } else {
      setUserOS('Desktop');
    }
  }, []);

  // Fetch Bank Apps based on OS
  useEffect(() => {
    const fetchBanks = async () => {
      if (userOS === 'Desktop') {
        setIsLoading(false);
        return;
      }

      const apiUrl = userOS === 'iOS'
        ? 'https://api.vietqr.io/v2/ios-app-deeplinks'
        : 'https://api.vietqr.io/v2/android-app-deeplinks';

      try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        if (data.apps) {
          setBankApps(data.apps);

          // Try to restore previous selection or set default
          const savedAppId = localStorage.getItem('preferred_bank_app');
          const preferred = data.apps.find((a: BankApp) => a.appId === savedAppId) || data.apps[0];
          setSelectedApp(preferred);
        }
      } catch (error) {
        console.error("Failed to fetch bank apps", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanks();
  }, [userOS]);

  const handlePayment = () => {
    const appId = selectedApp?.appId || "timo";
    const vietQrLink = `https://dl.vietqr.io/pay?app=${appId}&ba=${ACCOUNT_NO}@VBA&am=${AMOUNT}&tn=${encodeURIComponent(DESCRIPTION)}`;
    window.location.href = vietQrLink;
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const filteredBanks = useMemo(() => {
    return bankApps.filter(app =>
      app.appName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.bankName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [bankApps, searchTerm]);

  const selectBank = (app: BankApp) => {
    setSelectedApp(app);
    localStorage.setItem('preferred_bank_app', app.appId);
    setIsSelectorOpen(false);
  };

  // VietQR Image URL
  const qrUrl = useMemo(() => {
    const appId = "agribank"; // Always show destiny bank QR for generic scanning
    return `https://img.vietqr.io/image/${appId}-${ACCOUNT_NO}-compact2.jpg?amount=${AMOUNT}&addInfo=${encodeURIComponent(DESCRIPTION)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;
  }, [ACCOUNT_NO, AMOUNT, DESCRIPTION, ACCOUNT_NAME]);

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
            {userOS === 'Desktop'
              ? "Quét mã QR bằng ứng dụng ngân hàng trên điện thoại"
              : "Chọn ứng dụng ngân hàng của bạn để thanh toán nhanh"}
          </motion.p>
        </div>

        {/* Main Content Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden relative"
        >
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
                {userOS === 'Desktop' ? "Mở app trên điện thoại quét mã" : "Nhấn nút bên dưới để mở app"}
              </div>
            </div>

            {/* Payment Details */}
            <div className="grid grid-cols-1 gap-4">
              {/* Destination Bank Display */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
                    <Landmark size={24} />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-medium">Ngân hàng thụ hưởng</div>
                    <div className="font-bold text-slate-800">{DESTINATION_BANK_NAME}</div>
                  </div>
                </div>
                <div className="hidden sm:block text-right">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Napas 247</div>
                  <div className="text-[10px] text-emerald-600 font-medium">Chuyển tiền nhanh</div>
                </div>
              </div>

              {/* Account Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-1 relative group">
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
                  <div className="font-bold text-slate-800 uppercase line-clamp-1">{ACCOUNT_NAME}</div>
                </div>
              </div>

              {/* Amount & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-1">
                  <div className="text-xs text-emerald-600 font-medium uppercase tracking-tight">Số tiền</div>
                  <div className="font-bold text-emerald-700 text-2xl">
                    {AMOUNT.toLocaleString('vi-VN')} <span className="text-sm font-normal">VNĐ</span>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-1">
                  <div className="text-xs text-slate-400 font-medium">Nội dung</div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-slate-600 text-xs leading-tight line-clamp-2">{DESCRIPTION}</span>
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

            {/* Bank Selector (Only for Mobile) */}
            {userOS !== 'Desktop' && (
              <div className="space-y-3">
                <div className="text-sm font-bold text-slate-800 px-1">Chuyển bằng app ngân hàng của bạn</div>
                <button
                  onClick={() => setIsSelectorOpen(true)}
                  className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 transition-all shadow-sm group"
                >
                  <div className="flex items-center gap-3">
                    {selectedApp ? (
                      <>
                        <img src={selectedApp.appLogo} alt="" className="w-10 h-10 rounded-xl object-contain border border-slate-100" />
                        <div className="text-left">
                          <div className="text-xs text-slate-400">Đang chọn app</div>
                          <div className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">{selectedApp.appName}</div>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                          <Landmark size={20} />
                        </div>
                        <span className="text-slate-500 font-medium">Chọn ngân hàng của bạn...</span>
                      </div>
                    )}
                  </div>
                  <ChevronRight size={20} className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            )}

            {/* Action Button */}
            <div className="pt-2">
              {userOS !== 'Desktop' ? (
                <button
                  onClick={handlePayment}
                  disabled={!selectedApp}
                  className="group relative w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-emerald-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <Smartphone size={22} className="group-hover:rotate-12 transition-transform" />
                  Mở App {selectedApp?.appName || "Ngân hàng"}
                </button>
              ) : (
                <div className="bg-slate-50 rounded-2xl p-6 text-center border-2 border-dashed border-slate-200">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-slate-400">
                    <Info size={24} />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-1">Thanh toán trên máy tính</h3>
                  <p className="text-sm text-slate-500 max-w-xs mx-auto">
                    Vui lòng sử dụng điện thoại để quét mã QR phía trên để thực hiện giao dịch nhanh chóng.
                  </p>
                </div>
              )}
              <p className="text-center text-[10px] text-slate-400 mt-4 uppercase tracking-[0.2em] font-medium">
                Dịch vụ Quick Link cung cấp bởi VietQR
              </p>
            </div>
          </div>
        </motion.div>

        {/* Note Section */}
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex gap-3">
          <div className="mt-0.5 text-amber-600 flex-shrink-0">
            <Landmark size={20} />
          </div>
          <div className="text-xs text-amber-800 leading-relaxed">
            <strong>Quan trọng:</strong> Hệ thống sử dụng mạng lưới Napas 24/7. Bạn có thể dùng **bất kỳ app ngân hàng nào** để thanh toán. Vui lòng giữ nguyên nội dung chuyển khoản để chúng tôi đối soát nhanh nhất.
          </div>
        </div>
      </div>

      {/* Bank Selector Modal */}
      <AnimatePresence>
        {isSelectorOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSelectorOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Chọn ứng dụng thanh toán</h2>
                  <p className="text-xs text-slate-500">Tìm ngân hàng bạn đang sử dụng trên {userOS}</p>
                </div>
                <button
                  onClick={() => setIsSelectorOpen(false)}
                  className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Search Bar */}
              <div className="px-6 py-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Tìm tên ngân hàng..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all outline-none"
                    autoFocus
                  />
                </div>
              </div>

              {/* Bank List */}
              <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-1 min-h-[300px]">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-10 h-10 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin" />
                    <p className="text-sm text-slate-400">Đang tải danh sách...</p>
                  </div>
                ) : filteredBanks.length > 0 ? (
                  <div className="grid grid-cols-1 gap-1">
                    {filteredBanks.map((app) => (
                      <button
                        key={app.appId}
                        onClick={() => selectBank(app)}
                        className={`flex items-center gap-4 p-3 rounded-2xl transition-all ${selectedApp?.appId === app.appId
                          ? 'bg-emerald-50 border-emerald-100'
                          : 'hover:bg-slate-50 border-transparent'
                          } border-2 group`}
                      >
                        <div className="relative">
                          <img
                            src={app.appLogo}
                            alt=""
                            className="w-12 h-12 rounded-xl object-contain bg-white border border-slate-100 shadow-sm"
                          />
                          {selectedApp?.appId === app.appId && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center text-white">
                              <CheckCircle2 size={12} />
                            </div>
                          )}
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <div className="font-bold text-slate-800 text-sm truncate">{app.appName}</div>
                          <div className="text-[10px] text-slate-400 truncate uppercase tracking-tight">{app.bankName}</div>
                        </div>
                        <ChevronRight size={16} className={`text-slate-300 ${selectedApp?.appId === app.appId ? 'text-emerald-500' : 'opacity-0 group-hover:opacity-100'} transition-all`} />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 text-slate-400">
                    <p>Không tìm thấy ngân hàng phù hợp</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default PaymentPage;
