
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

  return (
    <AnimatePresence>
      {showLoader && (
        <motion.div
          key="global-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <LeafSVG color="hsl(var(--primary))" size={40} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
