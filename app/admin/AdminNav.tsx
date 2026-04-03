'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  FileText,
  Home,
  LogOut,
  Settings,
  Users,
  ChevronRight
} from 'lucide-react';
import { signOut } from 'next-auth/react';

interface AdminNavProps {
  user: {
    name?: string | null;
    image?: string | null;
  };
}

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Hóa đơn', href: '/admin/invoices', icon: FileText },
  { label: 'Khách hàng', href: '/admin/customers', icon: Users },
  { label: 'Cấu hình', href: '/admin/settings', icon: Settings },
];

export default function AdminNav({ user }: AdminNavProps) {
  const pathname = usePathname();

  const getPageTitle = (path: string) => {
    if (path === '/admin') return 'Dashboard';
    if (path.startsWith('/admin/invoices')) return 'Quản lý hóa đơn';
    if (path.startsWith('/admin/customers')) return 'Danh sách khách hàng';
    if (path.startsWith('/admin/settings')) return 'Cài đặt hệ thống';
    return 'Quản trị viên';
  };

  return (
    <>
      {/* Sidebar - Desktop Only */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 hidden md:flex flex-col z-40">
        <div className="p-8 border-b border-slate-100">
          <Link href="/admin" className="flex items-center gap-2 group focus:outline-none">
            <span className="text-3xl font-black text-emerald-600 uppercase tracking-tight">MAI VINH</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === '/admin' 
              ? pathname === '/admin' 
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between group px-3 py-2.5 rounded-lg text-sm font-bold transition-all border ${isActive
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-100'
                  : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 border-transparent hover:border-emerald-100'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-600 transition-colors'} />
                  <span>{item.label}</span>
                </div>
                <ChevronRight size={14} className={`transition-all ${isActive ? 'text-white' : 'opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 text-emerald-400'}`} />
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
          >
            <Home size={18} />
            Quay về cửa hàng
          </Link>
          <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              {user.image ? (
                <img src={user.image} alt="User" className="w-7 h-7 rounded-full border border-white shadow-sm" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs uppercase">
                  {user.name?.charAt(0) || 'A'}
                </div>
              )}
              <div className="text-[10px] font-bold text-slate-700 truncate">{user.name}</div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-slate-400 hover:text-red-500 transition-colors"
              title="Đăng xuất"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
