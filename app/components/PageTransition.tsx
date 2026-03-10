'use client';

import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, x: 60 }}
        animate={{
          opacity: 1,
          x: 0,
          transition: { duration: 0.35, ease: 'easeOut' },
        }}
        exit={{
          opacity: 0,
          x: -60,
          transition: { duration: 0.25, ease: 'easeIn' },
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
