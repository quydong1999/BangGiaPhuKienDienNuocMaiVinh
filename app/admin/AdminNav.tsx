'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  FileText,
  Home,
  LogOut,
  Settings,
  Users,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminNavProps {
  user: {
    name?: string | null;
    image?: string | null;
  };
}

const navItems = [
  // { label: 'Doanh thu', href: '/admin', icon: LayoutDashboard },
  { label: 'Hóa đơn', href: '/admin/invoices', icon: FileText },
];

export default function AdminNav({ user }: AdminNavProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Close menu when pathname changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const NavLinks = ({ className = "" }: { className?: string }) => (
    <nav className={`flex-1 space-y-1 ${className}`}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.href === '/admin'
          ? pathname === '/admin'
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setIsOpen(false)}
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
  );

  const UserSection = () => (
    <div className="p-4 border-t border-slate-100 space-y-2 bg-white">
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
  );

  return (
    <>
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-50 md:hidden">
        <Link href="/admin" className="flex items-center gap-2 focus:outline-none">
          <span className="text-2xl font-black text-emerald-600 uppercase tracking-tight">MAI VINH</span>
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[55] md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl z-[60] flex flex-col md:hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <span className="text-2xl font-black text-emerald-600 uppercase tracking-tight">ADMIN</span>
                <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <NavLinks />
              </div>
              <UserSection />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 hidden md:flex flex-col z-40">
        <div className="p-8 border-b border-slate-100">
          <Link href="/admin" className="flex items-center gap-2 group focus:outline-none">
            <span className="text-3xl font-black text-emerald-600 uppercase tracking-tight">MAI VINH</span>
          </Link>
        </div>

        <div className="flex-1 p-4">
          <NavLinks />
        </div>

        <UserSection />
      </aside>
    </>
  );
}

