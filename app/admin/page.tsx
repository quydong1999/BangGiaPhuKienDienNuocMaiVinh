import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { invoiceService } from '@/services';
import { 
  ShoppingBag, 
  Users, 
  FileCheck, 
  AlertCircle,
  TrendingUp,
  Clock
} from 'lucide-react';
import { formatVND } from '@/lib/utils';
import Link from 'next/link';

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/');
  }

  // Fetch some basic stats
  const allInvoices = await invoiceService.findAll();
  const totalAmount = allInvoices.reduce((sum, inv: any) => sum + (inv.totalAmount || 0), 0);
  const pendingInvoices = allInvoices.filter((inv: any) => inv.status === 'pending');
  const paidInvoices = allInvoices.filter((inv: any) => inv.status === 'paid');

  const stats = [
    { label: 'Tổng doanh thu', value: formatVND(totalAmount), icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Tổng hóa đơn', value: allInvoices.length, icon: FileCheck, color: 'text-blue-600 bg-blue-50' },
    { label: 'Chờ thanh toán', value: pendingInvoices.length, icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: 'Đã hoàn tất', value: paidInvoices.length, icon: ShoppingBag, color: 'text-slate-600 bg-slate-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight italic uppercase">Dashboard</h1>
        <p className="text-sm text-slate-500 font-medium tracking-wide">Tổng quan hoạt động kinh doanh cửa hàng Mai Vinh</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 border border-slate-200 shadow-sm flex items-start justify-between group hover:border-emerald-200 transition-all cursor-default">
            <div className="space-y-1">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-tight">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
            </div>
            <div className={`p-2 rounded-lg ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon size={20} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Invoices */}
        <div className="lg:col-span-2 bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider italic">Hóa đơn gần đây</h2>
                <Link href="/admin/invoices" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline underline-offset-4 decoration-2">Xem tất cả</Link>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã HĐ</th>
                            <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Khách hàng</th>
                            <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Tổng tiền</th>
                            <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 italic">
                        {allInvoices.slice(0, 5).map((inv: any) => (
                            <tr key={inv._id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 text-xs font-black text-emerald-700 font-mono tracking-tighter">{inv.invoiceNumber}</td>
                                <td className="px-6 py-4">
                                    <div className="text-xs font-bold text-slate-800">{inv.customerName}</div>
                                </td>
                                <td className="px-6 py-4 text-xs font-black text-slate-900 text-right tabular-nums">{formatVND(inv.totalAmount)}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`inline-block w-2 h-2 rounded-full ${inv.status === 'paid' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'}`} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Quick Actions / Shortcuts */}
        <div className="space-y-6">
            <div className="bg-emerald-600 p-6 shadow-xl shadow-emerald-200 group">
                <h3 className="text-white font-black text-lg mb-2 italic uppercase">Khuyến nghị</h3>
                <p className="text-emerald-100 text-xs font-medium leading-relaxed mb-4">Bạn có <span className="text-white font-black">{pendingInvoices.length}</span> hóa đơn đang chờ thanh toán. Hãy kiểm tra và cập nhật trạng thái ngay!</p>
                <Link href="/admin/invoices?status=pending" className="inline-flex items-center gap-2 bg-white text-emerald-700 px-4 py-2 text-xs font-black uppercase tracking-widest hover:bg-emerald-50 transition-all active:scale-95">
                    Xử lý ngay
                    <AlertCircle size={14} />
                </Link>
            </div>

            <div className="bg-white border border-slate-200 p-6 space-y-4">
                <h3 className="text-slate-800 font-black text-sm uppercase italic">Liên kết nhanh</h3>
                <div className="grid grid-cols-2 gap-2">
                    <button className="p-3 border border-slate-100 rounded-lg text-left hover:border-emerald-200 transition-all hover:bg-emerald-50/30">
                        <div className="text-[10px] font-black text-slate-400 tracking-widest mb-1">DATA</div>
                        <div className="text-xs font-bold text-slate-800 tracking-tight">Xuất báo cáo</div>
                    </button>
                    <button className="p-3 border border-slate-100 rounded-lg text-left hover:border-emerald-200 transition-all hover:bg-emerald-50/30">
                        <div className="text-[10px] font-black text-slate-400 tracking-widest mb-1">SYSTEM</div>
                        <div className="text-xs font-bold text-slate-800 tracking-tight">Cài đặt</div>
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
