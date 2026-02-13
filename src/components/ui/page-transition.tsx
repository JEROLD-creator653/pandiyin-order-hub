import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
    children: React.ReactNode;
    className?: string;
    isLoading?: boolean;
}

const pageVariants = {
    initial: {
        opacity: 0,
        y: 10,
    },
    in: {
        opacity: 1,
        y: 0,
    },
    out: {
        opacity: 0,
        y: -10,
    },
};

const pageTransition = {
    type: 'tween' as const,
    ease: 'anticipate' as const,
    duration: 0.3,
};

export const PageTransition: React.FC<PageTransitionProps> = ({ 
    children, 
    className,
    isLoading = false 
}) => {
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={window.location.pathname}
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                className={cn("w-full", className)}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
};

export default PageTransition;
