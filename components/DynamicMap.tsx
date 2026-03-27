'use client';

import dynamic from 'next/dynamic';

const GoogleMap = dynamic(() => import('./GoogleMap'), {
  ssr: false,
  loading: () => <div className="w-full h-44 bg-emerald-800/20 animate-pulse" />
});

export function DynamicMap() {
  return <GoogleMap />;
}
