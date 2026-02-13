
import React, { useEffect, useState } from 'react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader } from '@/components/ui/loader';

export const GlobalLoader = () => {
    const isFetching = useIsFetching();
    const isMutating = useIsMutating();
    const [showLoader, setShowLoader] = useState(false);

    useEffect(() => {
        let timeout: NodeJS.Timeout;

        // Show if fetching/mutating > 0
        if (isFetching > 0 || isMutating > 0) {
            timeout = setTimeout(() => {
                setShowLoader(true);
            }, 200); // 200ms delay to prevent flash
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
                    <Loader text="Loading..." size="lg" className="min-h-0" delay={0} />
                </motion.div>
            )}
        </AnimatePresence>
    );
};
