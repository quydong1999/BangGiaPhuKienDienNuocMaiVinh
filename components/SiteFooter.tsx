import { MapPin, Phone } from 'lucide-react';

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
            <ul className="space-y-4">
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
                <a
                  href="https://maps.app.goo.gl/pHLNv3rDBr16PTrt5"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors leading-snug"
                >
                  Thắng Kiên, Đề Gi, Bình Định, Việt Nam
                </a>
              </li>
              <li>
                <div className="overflow-hidden w-full h-44 border border-emerald-400/30 shadow-lg">
                  <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3869.537649379725!2d109.18716049999999!3d14.104448999999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x316f37d14647decb%3A0xc99b261b8447a7f8!2zQ-G7rWEgaMOgbmcgxJFp4buHbiBuxrDhu5tjIE1haSBWaW5o!5e0!3m2!1svi!2s!4v1774407991432!5m2!1svi!2s" width="100%" height="100%" style={{ border: 0 }} allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Vị trí cửa hàng điện nước Mai Vinh trên Google Maps"></iframe>
                </div>
              </li>
            </ul>
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
