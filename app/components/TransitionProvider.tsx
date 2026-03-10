'use client';

import { createContext, useContext, useCallback, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface TransitionContextType {
  navigateTo: (href: string) => void;
  isTransitioning: boolean;
}

const TransitionContext = createContext<TransitionContextType>({
  navigateTo: () => {},
  isTransitioning: false,
});

export const useTransition = () => useContext(TransitionContext);

const EXPAND_DURATION = 400; // ms - circle expands
const SHRINK_DURATION = 400; // ms - circle shrinks

export default function TransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [phase, setPhase] = useState<'idle' | 'expanding' | 'shrinking'>('idle');
  const overlayRef = useRef<HTMLDivElement>(null);

  const navigateTo = useCallback(
    (href: string) => {
      if (phase !== 'idle') return;

      // Phase 1: Expand circle to cover screen
      setPhase('expanding');

      setTimeout(() => {
        // Navigate while screen is covered
        router.push(href);

        // Phase 2: Shrink circle to reveal new page
        // Small delay to let the new page render
        setTimeout(() => {
          setPhase('shrinking');

          setTimeout(() => {
            setPhase('idle');
          }, SHRINK_DURATION);
        }, 100);
      }, EXPAND_DURATION);
    },
    [phase, router]
  );

  return (
    <TransitionContext.Provider value={{ navigateTo, isTransitioning: phase !== 'idle' }}>
      {children}

      {/* Circle wipe overlay */}
      {phase !== 'idle' && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-[9999] pointer-events-none"
          style={{ isolation: 'isolate' }}
        >
          <div
            className={`absolute inset-0 bg-emerald-600 ${
              phase === 'expanding' ? 'circle-wipe-expand' : 'circle-wipe-shrink'
            }`}
          />
        </div>
      )}
    </TransitionContext.Provider>
  );
}
