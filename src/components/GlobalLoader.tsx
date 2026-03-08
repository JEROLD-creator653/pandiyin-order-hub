import { useEffect, useState } from 'react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';

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
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm overflow-hidden"
        >
          <motion.div
            className="w-10 h-10 rounded-full border-2 border-transparent"
            style={{
              borderTopColor: 'hsl(var(--primary))',
              borderRightColor: 'hsl(var(--primary) / 0.3)',
              boxShadow: '0 0 20px hsl(var(--primary) / 0.3)',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
