'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  RefreshCw, 
  Search, 
  Calendar,
  Banknote,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Hash,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Transaction {
  _id: string;
  gateway: string;
  transactionDate: string;
  accountNumber: string | null;
  subAccount: string | null;
  amountIn: number;
  amountOut: number;
  accumulated: number;
  code: string | null;
  transactionContent: string | null;
  referenceNumber: string | null;
  createdAt: string;
}

interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function formatDate(dateStr: string): string {
  try {
    return format(new Date(dateStr), 'HH:mm - dd/MM/yyyy', { locale: vi });
  } catch {
    return dateStr;
  }
}

function formatDateShort(dateStr: string): string {
  try {
    return format(new Date(dateStr), 'dd/MM/yy HH:mm', { locale: vi });
  } catch {
    return dateStr;
  }
}

export default function TransactionsClient() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [stats, setStats] = useState({ totalIn: 0, totalOut: 0, count: 0 });
  const [showFilters, setShowFilters] = useState(false);
  const limit = 20;

  // Ref for SSE-triggered refetch
  const refetchRef = useRef<(() => void) | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      
      const data: TransactionsResponse = await res.json();
      setTransactions(data.transactions);
      setTotal(data.total);
      setTotalPages(data.totalPages);

      // Tính stats từ data hiện tại (tổng cộng tất cả)
      const totalIn = data.transactions.reduce((sum, t) => sum + t.amountIn, 0);
      const totalOut = data.transactions.reduce((sum, t) => sum + t.amountOut, 0);
      setStats({ totalIn, totalOut, count: data.total });
    } catch (err) {
      console.error('Fetch transactions error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, startDate, endDate]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Store refetch function for SSE handler
  useEffect(() => {
    refetchRef.current = fetchTransactions;
  }, [fetchTransactions]);

  // Listen for SSE events to auto-refresh
  useEffect(() => {
    const handleSSERefresh = () => {
      refetchRef.current?.();
    };

    window.addEventListener('new-transaction', handleSSERefresh);
    return () => window.removeEventListener('new-transaction', handleSSERefresh);
  }, []);

  const handleFilter = () => {
    setPage(1);
    // fetchTransactions will be triggered by useEffect
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-slate-800 flex items-center gap-2">
            <Banknote className="text-emerald-600" size={24} />
            Lịch sử giao dịch
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dữ liệu từ SePay Webhook • {total} giao dịch
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden flex items-center gap-1.5 px-3 py-2 text-sm font-bold rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Search size={14} />
            Bộ lọc
          </button>
          <button
            onClick={fetchTransactions}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-3 lg:p-4">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <ArrowDownLeft size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Tiền vào</span>
          </div>
          <p className="text-lg lg:text-xl font-black text-emerald-700">{formatVND(stats.totalIn)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 lg:p-4">
          <div className="flex items-center gap-2 text-red-500 mb-1">
            <ArrowUpRight size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Tiền ra</span>
          </div>
          <p className="text-lg lg:text-xl font-black text-red-600">{formatVND(stats.totalOut)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 lg:p-4 col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 text-blue-500 mb-1">
            <TrendingUp size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Tổng GD</span>
          </div>
          <p className="text-lg lg:text-xl font-black text-blue-700">{stats.count}</p>
        </div>
      </div>

      {/* Filters */}
      <div className={`bg-white rounded-xl border border-slate-200 p-3 lg:p-4 ${showFilters ? '' : 'hidden md:block'}`}>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          <div className="flex-1 min-w-0">
            <label className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
              <Calendar size={12} /> Từ ngày
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <div className="flex-1 min-w-0">
            <label className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
              <Calendar size={12} /> Đến ngày
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleFilter}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Lọc
            </button>
            {(startDate || endDate) && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm font-bold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col min-h-0">
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="text-left px-3 lg:px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider whitespace-nowrap">
                  Thời gian
                </th>
                <th className="text-left px-3 lg:px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider whitespace-nowrap">
                  Ngân hàng
                </th>
                <th className="text-right px-3 lg:px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider whitespace-nowrap">
                  Số tiền
                </th>
                <th className="text-left px-3 lg:px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider hidden lg:table-cell">
                  Nội dung
                </th>
                <th className="text-left px-3 lg:px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider hidden md:table-cell whitespace-nowrap">
                  <span className="flex items-center gap-1"><Hash size={12} /> Mã GD</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-3 lg:px-4 py-3"><div className="h-4 bg-slate-200 rounded-md animate-pulse w-28" /></td>
                    <td className="px-3 lg:px-4 py-3"><div className="h-4 bg-slate-200 rounded-md animate-pulse w-24" /></td>
                    <td className="px-3 lg:px-4 py-3"><div className="h-4 bg-slate-200 rounded-md animate-pulse w-20 ml-auto" /></td>
                    <td className="px-3 lg:px-4 py-3 hidden lg:table-cell"><div className="h-4 bg-slate-200 rounded-md animate-pulse w-40" /></td>
                    <td className="px-3 lg:px-4 py-3 hidden md:table-cell"><div className="h-4 bg-slate-200 rounded-md animate-pulse w-24" /></td>
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-slate-400">
                    <Banknote size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-bold">Chưa có giao dịch nào</p>
                    <p className="text-xs mt-1">Dữ liệu sẽ tự động cập nhật khi có chuyển khoản</p>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr 
                    key={tx._id} 
                    className="hover:bg-emerald-50/50 transition-colors group"
                  >
                    {/* Thời gian */}
                    <td className="px-3 lg:px-4 py-3 whitespace-nowrap">
                      <span className="hidden lg:inline text-slate-700 font-medium">{formatDate(tx.transactionDate)}</span>
                      <span className="lg:hidden text-slate-700 font-medium text-xs">{formatDateShort(tx.transactionDate)}</span>
                    </td>
                    {/* Ngân hàng */}
                    <td className="px-3 lg:px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-xs lg:text-sm">{tx.gateway}</span>
                        {tx.accountNumber && (
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            {tx.accountNumber}
                          </span>
                        )}
                        {/* Show content on mobile (hidden on desktop) */}
                        <span className="lg:hidden text-[10px] text-slate-500 mt-1 line-clamp-1">
                          {tx.transactionContent}
                        </span>
                      </div>
                    </td>
                    {/* Số tiền */}
                    <td className="px-3 lg:px-4 py-3 text-right whitespace-nowrap">
                      {tx.amountIn > 0 ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-black text-xs lg:text-sm">
                          <ArrowDownLeft size={12} className="text-emerald-500" />
                          +{formatVND(tx.amountIn)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 font-black text-xs lg:text-sm">
                          <ArrowUpRight size={12} className="text-red-400" />
                          -{formatVND(tx.amountOut)}
                        </span>
                      )}
                    </td>
                    {/* Nội dung */}
                    <td className="px-3 lg:px-4 py-3 hidden lg:table-cell max-w-[300px]">
                      <div className="flex flex-col gap-0.5">
                        <p className="text-slate-700 text-xs line-clamp-2">{tx.transactionContent || '—'}</p>
                        {tx.code && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 font-bold bg-blue-50 rounded px-1.5 py-0.5 w-fit">
                            Mã: {tx.code}
                          </span>
                        )}
                      </div>
                    </td>
                    {/* Mã GD */}
                    <td className="px-3 lg:px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-slate-400 font-mono">
                        {tx.referenceNumber || '—'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-slate-200 px-4 py-3 flex items-center justify-between bg-slate-50">
            <p className="text-xs text-slate-500">
              Trang {page}/{totalPages} • {total} giao dịch
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
