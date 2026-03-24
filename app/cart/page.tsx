import { HomeHeader } from '@/components/HomeHeader';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import CartContent from './CartContent'
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Giỏ hàng',
};

export default function CartPage() {
  return (
    <main id="main-content" className="min-h-screen bg-light-grey flex flex-col">
      <HomeHeader compact />
      <div className="w-full max-w-6xl mx-auto px-4 mt-1 mb-2">
        <Breadcrumbs
          items={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Giỏ hàng' }
          ]}
        />
      </div>
      <section aria-label="Giỏ hàng" className="flex-1 w-full max-w-6xl mx-auto p-4">
        <CartContent />
      </section>
    </main>
  );
}
