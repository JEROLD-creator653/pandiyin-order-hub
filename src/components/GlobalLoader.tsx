
import React, { useEffect, useState } from 'react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';

const LeafSVG = ({ color, size = 24 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20c4 0 8.68-3.93 9-12z"
      fill={color}
      opacity={0.85}
    />
    <path
      d="M17 8c.59-1.36.94-2.87 1-4.5C12.26 3.5 8.5 6.48 6 10c-.26.41-.5.81-.73 1.22C7.37 8.1 11.29 6.5 17 8z"
      fill={color}
      opacity={0.6}
    />
  </svg>
);

const MiniLeaf = ({ delay, x }: { delay: number; x: number }) => (
  <motion.div
    className="absolute pointer-events-none"
    style={{ left: `${x}%`, top: -20 }}
    animate={{
      y: ['-2vh', '108vh'],
      x: [0, Math.sin(x) * 30, -Math.sin(x) * 20],
      rotate: [0, 180, 360],
      opacity: [0, 0.7, 0.7, 0],
    }}
    transition={{ duration: 3 + Math.random() * 2, delay, repeat: Infinity, ease: 'easeIn' }}
  >
    <LeafSVG color="hsl(var(--primary) / 0.5)" size={14 + Math.random() * 8} />
  </motion.div>
);

export const GlobalLoader = () => {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isFetching > 0 || isMutating > 0) {
      timeout = setTimeout(() => setShowLoader(true), 200);
    } else {
      setShowLoader(false);
    }
    return () => clearTimeout(timeout);
  }, [isFetching, isMutating]);

  const miniLeaves = React.useMemo(() =>
    Array.from({ length: 6 }).map((_, i) => ({ id: i, delay: i * 0.4, x: 10 + Math.random() * 80 })),
  []);

  return (
    <AnimatePresence>
      {showLoader && (
        <motion.div
          key="global-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/85 backdrop-blur-sm overflow-hidden"
        >
          {miniLeaves.map((l) => <MiniLeaf key={l.id} delay={l.delay} x={l.x} />)}
          <motion.div
            className="relative z-10"
            animate={{ rotate: [0, 12, -12, 8, -8, 0], y: [0, -5, 0, -3, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <LeafSVG color="hsl(var(--primary))" size={40} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
