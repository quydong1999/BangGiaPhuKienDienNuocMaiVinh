import Link from 'next/link';
import { FileText, Layers, Circle } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-emerald-600">
            MAI VINH
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Chọn loại sản phẩm để xem bảng giá chi tiết
          </p>
        </div>

        <div className="grid gap-4 mt-8">
          <Link
            href="/phu-kien-ong-nuoc-dat-hoa-loai-day"
            className="group relative flex items-center justify-between p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="text-left">
                <h2 className="text-xl font-semibold text-slate-900">Phụ kiện ống nước Đạt Hòa loại dày</h2>
              </div>
            </div>
          </Link>

          <Link
            href="/phu-kien-ong-nuoc-dat-hoa-loai-mong"
            className="group relative flex items-center justify-between p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="text-left">
                <h2 className="text-xl font-semibold text-slate-900">Phụ kiện ống nước Đạt Hòa loại mỏng</h2>
              </div>
            </div>
          </Link>

          <Link
            href="/ong-nuoc-van-phuoc"
            className="group relative flex items-center justify-between p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="text-left">
                <h2 className="text-xl font-semibold text-slate-900">Ống nước Vạn Phước</h2>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
