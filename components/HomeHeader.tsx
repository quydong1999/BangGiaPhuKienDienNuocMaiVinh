"use client";

import { useState, useRef, useEffect } from 'react';
import { Search, LogOut, LogIn, UserRound, FolderPlus, PackagePlus, FileSpreadsheet, ShoppingCart, FileText, Bell, ArrowDownLeft, ArrowUpRight, X, Volume2 } from 'lucide-react';
import { signOut } from "next-auth/react"
import { useAdmin } from "@/hooks/useAdmin"
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { openModal } from '@/store/modalSlice';
import { selectCartCount } from '@/store/cartSlice';
import { motion } from 'framer-motion';


interface HomeHeaderProps {
  compact?: boolean;
  showAddCategory?: boolean;
  categoryId?: string;
  categoryLayout?: string;
}

export function HomeHeader({
  compact = false,
  showAddCategory = false,
  categoryId,
  categoryLayout
}: HomeHeaderProps = {}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { isAdmin, isLoading, user } = useAdmin()
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const cartCount = useAppSelector(selectCartCount);

  // State cho thông báo giao dịch
  const [latestTx, setLatestTx] = useState<any>(null);
  const [hasUnreadTx, setHasUnreadTx] = useState(false);
  const [showTxDialog, setShowTxDialog] = useState(false);

  useEffect(() => {
    const handleNewTx = (e: any) => {
      setLatestTx(e.detail);
      setHasUnreadTx(true);
    };
    window.addEventListener('new-transaction', handleNewTx);
    return () => window.removeEventListener('new-transaction', handleNewTx);
  }, []);

  const formatVND = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header className={`sticky top-0 z-30 w-full ${compact ? 'bg-emerald-600 shadow-md text-white' : ''}`}>
        <div className={`mx-auto w-full max-w-6xl flex flex-wrap sm:flex-nowrap items-center justify-between ${compact ? 'px-3 sm:px-4 py-2 sm:h-16 gap-y-2 sm:gap-4' : 'px-4 pt-6 pb-10'}`}>

          {/* Trái: Menu & Logo */}
          <div className="flex items-center gap-2 sm:gap-3 order-1 flex-shrink-0">
            <Link href="/" className="block focus:outline-none">
              <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${compact ? 'text-white' : 'text-emerald-600'}`}>
                MAI VINH
              </h1>
            </Link>
          </div>

          {/* Giữa (Mobile: Row 2, Desktop: Row 1): Search Textbox */}
          <div className="w-full sm:flex-1 order-3 sm:order-2 sm:max-w-2xl sm:mx-4 z-10">
            <button
              onClick={() => dispatch(openModal({ type: 'search' }))}
              className={`w-full flex items-center gap-2 h-10 px-3 sm:px-4 rounded-full transition-all border text-sm focus:outline-none ${compact
                ? 'bg-white/30 hover:bg-white/40 border-white/20 text-white/90 shadow-inner'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-500 shadow-sm'
                }`}
              aria-label="Tìm kiếm sản phẩm"
            >
              <Search size={18} className="flex-shrink-0" />
              <span className="truncate">Tìm kiếm sản phẩm</span>
            </button>
          </div>

          {/* Phải: Cart + Avatar */}
          <div className="flex items-center justify-end gap-2 order-2 sm:order-3 flex-shrink-0 z-20">
            {/* Cart Button */}
            <Link
              id="header-cart-icon"
              href="/cart"
              className={`relative w-8 h-8 flex items-center justify-center rounded-full transition-colors ${compact ? 'text-white/80 hover:text-white hover:bg-white/20' : 'text-slate-500 hover:text-emerald-600 hover:bg-slate-100'}`}
              aria-label="Giỏ hàng"
            >
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <motion.span
                  key={cartCount}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: [1.2, 1], opacity: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 12 }}
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none px-1"
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </motion.span>
              )}
            </Link>

            {/* Notification Bell */}
            {isAdmin && (
              <>
                <button
                  onClick={() => {
                    if (latestTx) {
                      setShowTxDialog(true);
                      setHasUnreadTx(false);
                    }
                  }}
                  className={`relative w-8 h-8 flex items-center justify-center rounded-full transition-colors ${compact ? 'text-white/80 hover:text-white hover:bg-white/20' : 'text-slate-500 hover:text-emerald-600 hover:bg-slate-100'} ${!latestTx ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!latestTx}
                  title={latestTx ? "Xem giao dịch mới" : "Chưa có thông báo"}
                >
                  <Bell size={18} />
                  {hasUnreadTx && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                  )}
                </button>

                {/* Dialog for Transaction */}
                {showTxDialog && latestTx && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          <Bell size={16} className="text-emerald-600" />
                          Giao dịch mới nhất
                        </h3>
                        <button onClick={() => setShowTxDialog(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                          <X size={18} />
                        </button>
                      </div>
                      <div className="p-5">
                        <div className="flex items-start gap-4">
                          <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${latestTx.amountIn > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                            {latestTx.amountIn > 0 ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-500">
                              {latestTx.amountIn > 0 ? 'Nhận tiền từ' : 'Chuyển tiền đến'}
                            </p>
                            <p className="text-base font-black text-slate-800 truncate">
                              {latestTx.gateway}
                            </p>
                            <p className={`text-2xl font-black mt-1 ${latestTx.amountIn > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {latestTx.amountIn > 0 ? '+' : '-'}{formatVND(latestTx.amountIn > 0 ? latestTx.amountIn : latestTx.amountOut)}
                            </p>
                          </div>
                        </div>
                        {latestTx.transactionContent && (
                          <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-700 break-words">
                            <span className="font-bold block mb-1 text-slate-400 text-[10px] tracking-wider uppercase">Nội dung</span>
                            {latestTx.transactionContent}
                          </div>
                        )}
                        {latestTx.code && (
                          <div className="mt-3">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded-md px-2 py-1">
                              Mã: {latestTx.code}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                        <button onClick={() => setShowTxDialog(false)} className="text-sm font-bold text-slate-500 hover:text-slate-700 px-3 py-1.5 transition-colors">
                          Đóng
                        </button>
                        <Link href="/admin/transactions" onClick={() => setShowTxDialog(false)} className="text-sm font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors">
                          Xem tất cả lịch sử
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {!isLoading && (
              <div className="relative" ref={dropdownRef}>

                {/* Avatar */}
                <button
                  onClick={() => setIsDropdownOpen(prev => !prev)}
                  className={`w-8 h-8 rounded-full overflow-hidden transition-all focus:outline-none cursor-pointer border ${compact ? 'border-white/30' : 'border-slate-200'}`}
                >
                  {isAdmin && user?.image ? (
                    <img
                      src={user.image}
                      alt={user.name ?? 'Admin'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                      <UserRound size={16} className="text-slate-400" />
                    </div>
                  )}
                </button>

                {/* Dropdown */}
                {isDropdownOpen && (
                  <div className="absolute right-0 top-10 flex flex-col bg-white rounded-xl shadow-lg border border-slate-100 p-2 min-w-max gap-1">
                    {isAdmin ? (
                      <>
                        <p className="text-xs text-slate-400 px-2 pt-1 pb-0.5 font-medium truncate max-w-[160px]">
                          {user?.name}
                        </p>
                        {showAddCategory && (
                          <button
                            onClick={() => { dispatch(openModal({ type: 'categoryForm' })); setIsDropdownOpen(false); }}
                            className="flex items-center gap-2 text-sm text-slate-600 hover:bg-slate-50 px-2 py-1.5 transition-colors"
                          >
                            <FolderPlus size={14} />
                            Thêm danh mục
                          </button>
                        )}
                        {categoryId && (
                          <button
                            onClick={() => {
                              dispatch(openModal({
                                type: 'productForm',
                                props: { categoryId }
                              }));
                              setIsDropdownOpen(false);
                            }}
                            className="flex items-center gap-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg px-2 py-1.5 transition-colors"
                          >
                            <PackagePlus size={14} />
                            Thêm sản phẩm
                          </button>
                        )}
                        {categoryId && (
                          <button
                            onClick={() => {
                              dispatch(openModal({
                                type: 'bulkImport',
                                props: { categoryId }
                              }));
                              setIsDropdownOpen(false);
                            }}
                            className="hidden sm:flex items-center gap-2 text-sm text-slate-600 hover:bg-slate-50 px-2 py-1.5 transition-colors"
                          >
                            <FileSpreadsheet size={14} />
                            Nhập hàng loạt
                          </button>
                        )}
                        <Link
                          href="/admin/invoices"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-2 text-sm text-slate-600 hover:bg-slate-50 px-2 py-1.5 transition-colors font-medium"
                        >
                          <UserRound size={14} />
                          Hóa đơn
                        </Link>
                        <button
                          onClick={() => { signOut(); setIsDropdownOpen(false); }}
                          className="flex items-center gap-2 text-sm text-red-500 hover:bg-red-50 px-2 py-1.5 transition-colors mt-1 border-t border-slate-50 pt-2"
                        >
                          <LogOut size={14} />
                          Đăng xuất
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => { dispatch(openModal({ type: 'login' })); setIsDropdownOpen(false); }}
                          className="flex items-center gap-2 text-sm text-slate-600 hover:bg-slate-50 px-2 py-1.5 transition-colors"
                        >
                          <LogIn size={14} />
                          Đăng nhập
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </header>
    </>
  );
}