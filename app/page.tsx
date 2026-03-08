import Link from 'next/link';
import { FileText, Layers } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Báo giá Phụ kiện
          </h1>
          <p className="text-lg font-medium text-emerald-600">Mai Vinh</p>
          <p className="text-sm text-slate-500 mt-2">
            Chọn loại phụ kiện để xem bảng giá chi tiết
          </p>
        </div>

        <div className="grid gap-4 mt-8">
          <Link
            href="/day"
            className="group relative flex items-center justify-between p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <Layers className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-semibold text-slate-900">Loại Dày</h2>
                <p className="text-sm text-slate-500">Phụ kiện uPVC hệ dày</p>
              </div>
            </div>
          </Link>

          <Link
            href="/mong"
            className="group relative flex items-center justify-between p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-colors">
                <FileText className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-semibold text-slate-900">Loại Mỏng</h2>
                <p className="text-sm text-slate-500">Phụ kiện uPVC hệ mỏng</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
