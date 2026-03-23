import { MapPin, Phone, MapPinned } from 'lucide-react';

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-emerald-50 mt-auto border-t border-emerald-700/50">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Brand & Description */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Báo giá điện nước Mai Vinh - Bình Định
            </h2>
            <p className="text-sm text-emerald-100/90 leading-relaxed max-w-md">
              Chuyên cung cấp sỉ, lẻ tất cả các loại thiết bị, phụ kiện, sản phẩm điện nước gia dụng tại nhà chuyên nghiệp, uy tín, chất lượng.
            </p>
          </div>

          {/* Contact Info */}
          <div className="space-y-4 md:justify-self-end w-full sm:w-auto mt-2 md:mt-0">
            <h3 className="text-base font-semibold text-white">Liên hệ</h3>
            <div className="flex flex-row items-center sm:items-start gap-4 sm:gap-8 border-t border-emerald-500/30 pt-4 md:border-0 md:pt-0">
              <ul className="space-y-4 flex-1">
                <li className="flex items-start gap-3 text-sm">
                  <Phone size={18} className="text-white mt-0.5 shrink-0" />
                  <div className="flex flex-col sm:flex-row sm:gap-4 gap-1">
                    <a href="tel:0982390943" className="hover:text-white text-emerald-50 transition-colors font-medium">0982 390 943</a>
                    <span className="hidden sm:inline text-emerald-300/60">|</span>
                    <a href="tel:0976576443" className="hover:text-white text-emerald-50 transition-colors font-medium">0976 576 443</a>
                  </div>
                </li>
                <li className="flex items-start gap-3 text-sm text-emerald-50">
                  <MapPin size={18} className="text-white mt-0.5 shrink-0" />
                  <a href="https://maps.app.goo.gl/pHLNv3rDBr16PTrt5" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    <span className="leading-snug block max-w-[180px] sm:max-w-none">Bình Định, Việt Nam</span>
                  </a>
                </li>
              </ul>

              {/* Minimap Widget */}
              <a 
                href="https://maps.app.goo.gl/pHLNv3rDBr16PTrt5" 
                target="_blank" 
                rel="noopener noreferrer"
                className="relative flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 bg-emerald-900/40 rounded-xl border border-emerald-400/30 hover:border-white/80 transition-all group overflow-hidden shrink-0 shadow-lg hover:shadow-xl hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-emerald-600"
                aria-label="Xem vị trí trên Google Maps"
                title="Cửa hàng điện nước MAI VINH"
              >
                {/* CSS Grid Pattern for Map Vibe */}
                <div className="absolute inset-0 opacity-20 pointer-events-none bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:10px_10px]"></div>
                
                {/* Map Route/Pin background styling */}
                <svg className="absolute inset-0 w-full h-full opacity-30 text-emerald-200 pointer-events-none" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 80 Q 40 40 80 20" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                  <circle cx="20" cy="80" r="4" fill="currentColor" />
                  <circle cx="80" cy="20" r="4" fill="currentColor" />
                </svg>

                <MapPinned size={32} className="text-white group-hover:scale-110 group-hover:text-amber-200 transition-all duration-300 drop-shadow-md z-10 -mt-3" />
                <div className="absolute bottom-0 w-full text-center pb-2 pt-6 bg-gradient-to-t from-emerald-950 to-transparent">
                  <span className="text-[10px] sm:text-xs font-bold text-emerald-50 tracking-wider uppercase">Bản đồ</span>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-emerald-700/30 bg-black/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-emerald-100/80">
          <p>&copy; {currentYear} Báo giá điện nước Mai Vinh. Tất cả các quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  );
}
