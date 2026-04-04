'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Eye, Search, FileText, Calendar, Filter, RotateCcw, Pencil, Trash2, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { formatVND } from '@/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

import { useAppDispatch } from '@/store/hooks';
import { openModal } from '@/store/modalSlice';

import Swal from 'sweetalert2';

interface InvoicesListClientProps {
}

const statusMap: any = {
  'pending': { label: 'Chưa thanh toán', color: 'bg-amber-100 text-amber-700' },
  'paid': { label: 'Đã thanh toán', color: 'bg-emerald-100 text-emerald-700' },
  'cancelled': { label: 'Đã hủy', color: 'bg-slate-100 text-slate-700' },
};

export default function InvoicesListClient({ }: InvoicesListClientProps) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Get current filter values from URL
  const querySearch = searchParams.get('search') || '';
  const queryStatus = searchParams.get('status') || '';
  const queryStart = searchParams.get('start') || '';
  const queryEnd = searchParams.get('end') || '';
  const sortBy = searchParams.get('sortBy') || 'date';
  const sortOrder = searchParams.get('order') || 'desc';

  // Local state for inputs (not applied until Filter button is clicked)
  const [localSearch, setLocalSearch] = useState(querySearch);
  const [localStatus, setLocalStatus] = useState(queryStatus);
  const [localStart, setLocalStart] = useState(queryStart);
  const [localEnd, setLocalEnd] = useState(queryEnd);

  // Sync local state when URL params change (e.g. on page load or browser back/forward)
  useEffect(() => {
    setLocalSearch(querySearch);
    setLocalStatus(queryStatus);
    setLocalStart(queryStart);
    setLocalEnd(queryEnd);
  }, [querySearch, queryStatus, queryStart, queryEnd]);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Count active filters for indicator
  const activeFilterCount = [
    querySearch,
    queryStatus,
    queryStart,
    queryEnd
  ].filter(Boolean).length;

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/invoices');
        if (response.ok) {
          const data = await response.json();
          setInvoices(data);
        }
      } catch (error) {
        console.error('Failed to fetch invoices:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const filteredInvoices = invoices.filter(inv => {
    const invDate = new Date(inv.invoiceDate);
    invDate.setHours(0, 0, 0, 0);

    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(querySearch.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(querySearch.toLowerCase()) ||
      inv.recipientName.toLowerCase().includes(querySearch.toLowerCase());

    const matchesStatus = queryStatus === '' || inv.status === queryStatus;

    let matchesDate = true;
    if (queryStart) {
      const start = new Date(queryStart);
      start.setHours(0, 0, 0, 0);
      matchesDate = matchesDate && invDate >= start;
    }
    if (queryEnd) {
      const end = new Date(queryEnd);
      end.setHours(0, 0, 0, 0);
      matchesDate = matchesDate && invDate <= end;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    let valA, valB;
    if (sortBy === 'date') {
      valA = new Date(a.invoiceDate).getTime();
      valB = new Date(b.invoiceDate).getTime();
    } else if (sortBy === 'amount') {
      valA = a.totalAmount;
      valB = b.totalAmount;
    } else {
      return 0;
    }

    if (sortOrder === 'asc') return valA - valB;
    return valB - valA;
  });

  const toggleSort = (field: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentSort = params.get('sortBy');
    const currentOrder = params.get('order');

    if (currentSort === field) {
      params.set('order', currentOrder === 'asc' ? 'desc' : 'asc');
    } else {
      params.set('sortBy', field);
      params.set('order', 'desc');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return <ArrowUpDown size={14} className="text-slate-300" />;
    return sortOrder === 'asc' ? <ChevronUp size={14} className="text-emerald-500" /> : <ChevronDown size={14} className="text-emerald-500" />;
  };

  const handleFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (localSearch) params.set('search', localSearch); else params.delete('search');
    if (localStatus) params.set('status', localStatus); else params.delete('status');
    if (localStart) params.set('start', localStart); else params.delete('start');
    if (localEnd) params.set('end', localEnd); else params.delete('end');

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleReset = () => {
    setLocalSearch('');
    setLocalStatus('');
    setLocalStart('');
    setLocalEnd('');
    router.push(pathname);
  };

  const handleEdit = (invoice: any) => {
    let previousInvoices = [...invoices];
    dispatch(openModal({
      type: 'editInvoice',
      props: {
        invoice,
        onOptimisticUpdate: (optimistic: any) => {
          // Keep a snapshot for rollback
          previousInvoices = [...invoices];
          setInvoices(prev => prev.map(i => i._id === optimistic._id ? { ...i, ...optimistic } : i));
        },
        onRollback: () => {
          setInvoices(previousInvoices);
        },
        onSuccess: (updated: any) => {
          setInvoices(prev => prev.map(i => i._id === updated._id ? updated : i));
        }
      }
    }));
  };

  const handleDelete = async (inv: any) => {
    const result = await Swal.fire({
      title: 'XÓA HÓA ĐƠN?',
      text: `Bạn có chắc chắn muốn xóa hóa đơn ${inv.invoiceNumber}? Hành động này sẽ xóa vĩnh viễn và không thể khôi phục!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Có, xóa vĩnh viễn',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      const previousInvoices = [...invoices];
      setInvoices(prev => prev.filter(i => i._id !== inv._id));

      try {
        const resp = await fetch(`/api/invoices/${inv._id}`, { method: 'DELETE' });
        if (resp.ok) {
          Swal.fire({
            icon: 'success',
            title: 'Đã xóa hóa đơn',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000
          });
        } else {
          throw new Error();
        }
      } catch (e) {
        setInvoices(previousInvoices);
        Swal.fire('Lỗi', 'Không thể xóa hóa đơn.', 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters - Expandable on mobile */}
      <div className="space-y-4">
        {/* Toggle Button for Mobile */}
        <div className="xl:hidden flex items-center justify-between gap-4">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <Filter size={16} className={isFilterOpen ? 'text-emerald-600' : 'text-slate-400'} />
            <span>Lọc & Tìm kiếm</span>
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-black">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown size={16} className={`transition-transform duration-300 ${isFilterOpen ? 'rotate-180 text-emerald-600' : 'text-slate-400'}`} />
          </button>

          {/* Quick reset button when filters are active */}
          {activeFilterCount > 0 && (
            <button
              onClick={handleReset}
              className="p-2.5 text-slate-400 hover:text-red-500 transition-colors"
              title="Xóa tất cả lọc"
            >
              <RotateCcw size={16} />
            </button>
          )}
        </div>

        <AnimatePresence initial={false}>
          {(isFilterOpen || (isMounted && typeof window !== 'undefined' && window.innerWidth >= 1280)) && (
            <motion.div
              initial={isMounted && typeof window !== 'undefined' && window.innerWidth < 1280 ? { height: 0, opacity: 0 } : false}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className={`overflow-hidden xl:!h-auto xl:!opacity-100 ${isFilterOpen ? 'block' : 'hidden xl:block'}`}
            >
              <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 py-2 xl:py-0">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 flex-1">
                  {/* Search */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tìm kiếm</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="text"
                        placeholder="Mã HĐ, tên khách hàng..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm shadow-slate-100 placeholder:text-slate-300"
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                      />
                    </div>
                  </div>

                  {/* Status */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Trạng thái</label>
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <select
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none transition-all shadow-sm shadow-slate-100 cursor-pointer"
                        value={localStatus}
                        onChange={(e) => setLocalStatus(e.target.value)}
                      >
                        <option value="">Tất cả</option>
                        <option value="pending">Chưa thanh toán</option>
                        <option value="paid">Đã thanh toán</option>
                        <option value="cancelled">Đã hủy</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* From Date */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Từ ngày</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                      <input
                        type="date"
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm shadow-slate-100"
                        value={localStart}
                        onChange={(e) => setLocalStart(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* To Date */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Đến ngày</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                      <input
                        type="date"
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm shadow-slate-100"
                        value={localEnd}
                        onChange={(e) => setLocalEnd(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2 xl:pt-0">
                  <button
                    onClick={handleFilter}
                    className="flex-1 xl:flex-initial flex items-center justify-center gap-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all uppercase tracking-widest rounded-lg px-6 py-2.5 h-[42px] shadow-sm active:scale-95"
                  >
                    <Search size={14} />
                    Lọc
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex-1 xl:flex-initial flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-all uppercase tracking-widest border border-slate-200 rounded-lg px-4 py-2.5 h-[42px] bg-white shadow-sm active:scale-95"
                  >
                    <RotateCcw size={14} />
                    Đặt lại
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Invoices List */}
      <div className="bg-white border border-slate-200 shadow-sm min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Đang tải dữ liệu...</p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th
                    className="px-4 py-3 text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors group"
                    onClick={() => toggleSort('date')}
                  >
                    <div className="flex items-center gap-1.5">
                      Ngày lập
                      {getSortIcon('date')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700 hidden md:table-cell">Mã HĐ</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700">Khách hàng / Người lấy</th>
                  <th
                    className="px-4 py-3 text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors group"
                    onClick={() => toggleSort('amount')}
                  >
                    <div className="flex items-center gap-1.5">
                      Giá trị
                      {getSortIcon('amount')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700">Trạng thái</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700 whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedInvoices.length > 0 ? (
                  sortedInvoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                        {format(new Date(inv.invoiceDate), 'dd/MM/yyyy', { locale: vi })}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono font-bold text-emerald-700 whitespace-nowrap hidden md:table-cell">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-semibold text-slate-900">{inv.customerName}</div>
                        {inv.recipientName && inv.recipientName !== inv.customerName && (
                          <div className="text-xs text-slate-500">Lấy bởi: {inv.recipientName}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-slate-900 whitespace-nowrap">
                        {formatVND(inv.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className={`inline-flex w-fit px-2 py-1 rounded-full text-[10px] font-bold uppercase ${statusMap[inv.status]?.color}`}>
                            {statusMap[inv.status]?.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/admin/invoices/${inv._id}`}
                            className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-semibold"
                            title="Xem chi tiết"
                          >
                            Chi tiết
                          </Link>
                          <button
                            onClick={() => handleEdit(inv)}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold"
                            title="Chỉnh sửa thông tin"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(inv)}
                            className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-semibold"
                            title="Xóa hóa đơn"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500 italic">
                      Không tìm thấy hóa đơn nào phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
