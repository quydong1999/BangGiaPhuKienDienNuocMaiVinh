'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SPLASH_DURATION = 2500; // ms

export default function SplashScreen({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window !== 'undefined') {
      return !sessionStorage.getItem('splashSeen');
    }
    return true;
  });

  useEffect(() => {
    if (!showSplash) return;

    const timer = setTimeout(() => {
      setShowSplash(false);
      sessionStorage.setItem('splashSeen', 'true');
    }, SPLASH_DURATION);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash"
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-emerald-600"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            {/* Decorative circles */}
            <motion.div
              className="absolute w-[500px] h-[500px] rounded-full bg-emerald-500/30"
              initial={{ scale: 0 }}
              animate={{ scale: 1.2 }}
              transition={{ duration: 2, ease: 'easeOut' }}
            />
            <motion.div
              className="absolute w-[300px] h-[300px] rounded-full bg-emerald-400/20"
              initial={{ scale: 0 }}
              animate={{ scale: 1.5 }}
              transition={{ duration: 2.2, ease: 'easeOut', delay: 0.1 }}
            />

            {/* Logo / Brand */}
            <motion.div
              className="relative z-10 flex flex-col items-center gap-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            >
              {/* Icon */}
              <motion.div
                className="w-20 h-20 bg-white/20 backdrop-blur-sm flex items-center justify-center"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
              >
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"
                  />
                </svg>
              </motion.div>

              {/* Brand name */}
              <motion.h1
                className="text-4xl font-bold text-white tracking-wider"
                initial={{ opacity: 0, letterSpacing: '0.5em' }}
                animate={{ opacity: 1, letterSpacing: '0.1em' }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
              >
                MAI VINH
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                className="text-emerald-100 text-sm tracking-wide"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1 }}
              >
                Bảng giá phụ kiện điện nước
              </motion.p>

              {/* Loading indicator */}
              <motion.div
                className="mt-8 flex gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-white/60 rounded-full"
                    animate={{
                      scale: [1, 1.4, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {children}
    </>
  );
}