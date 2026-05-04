import { HomeHeader } from '@/components/HomeHeader';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import CartContent from './CartContent'
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Giỏ hàng',
};

export default function CartPage() {
  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-light-grey">
      <div className="flex-none z-50">
        <HomeHeader compact />
      </div>
      <main id="main-content" className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="w-full max-w-6xl mx-auto px-4 mt-1 mb-2">
          <Breadcrumbs
            items={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Giỏ hàng' }
            ]}
          />
        </div>
        <section aria-label="Giỏ hàng" className="w-full max-w-6xl mx-auto p-4">
          <CartContent />
        </section>
      </main>
    </div>
  );
}
