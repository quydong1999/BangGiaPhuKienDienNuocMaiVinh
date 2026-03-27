'use client';

import { useState, useEffect, useRef } from 'react';

export default function GoogleMap() {
  const [shouldLoad, setShouldLoad] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '200px', // Load before it actually enters for better UX
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="overflow-hidden w-full h-44 border border-emerald-400/30 shadow-lg bg-emerald-800/20 flex items-center justify-center">
      {shouldLoad ? (
         <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3869.537649379725!2d109.18716049999999!3d14.104448999999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x316f37d14647decb%3A0xc99b261b8447a7f8!2zQ-G7rWEgaMOgbmcgxJFp4buHbiBuxrDhu5tjIE1haSBWaW5o!5e0!3m2!1svi!2s!4v1774407991432!5m2!1svi!2s"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="V vị trí cửa hàng điện nước Mai Vinh trên Google Maps"
        />
      ) : (
        <div className="text-emerald-200/50 text-xs animate-pulse">
          Đang tải bản đồ...
        </div>
      )}
    </div>
  );
}
