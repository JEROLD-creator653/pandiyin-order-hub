
import React from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';

// --- 1. Global / Page Loader ---
interface LoaderProps {
    className?: string;
    text?: string;
    size?: 'sm' | 'md' | 'lg';
    delay?: number; // Delay in ms before showing
}

export const Loader = ({ className, text, size = 'md', delay = 200 }: LoaderProps) => {
    const [show, setShow] = React.useState(delay === 0);

    React.useEffect(() => {
        if (delay > 0) {
            const timer = setTimeout(() => setShow(true), delay);
            return () => clearTimeout(timer);
        }
    }, [delay]);

    if (!show) return null;

    const orbitSize = { sm: 44, md: 58, lg: 70 }[size];
    const emojiSize = { sm: 'text-xl', md: 'text-3xl', lg: 'text-4xl' }[size];

    return (
        <div className={cn("flex flex-col items-center justify-center min-h-[50vh] w-full", className)}>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center gap-6"
            >
                <div className="relative flex items-center justify-center" style={{ width: orbitSize + 28, height: orbitSize + 28, perspective: '500px' }}>
                    <motion.div
                        className="absolute"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
                        style={{ width: orbitSize, height: orbitSize }}
                    >
                        <motion.div
                            className="absolute -top-3 left-1/2 -translate-x-1/2"
                            animate={{ y: [0, 6, 1, 10, 3, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <motion.div
                                animate={{ x: [0, 5, -3, 6, -4, 0] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <motion.div
                                    animate={{
                                        rotateX: [0, 12, -8, 16, -4, 0],
                                        rotateY: [0, 180, 360],
                                        rotateZ: [0, -6, 4, -10, 6, 0],
                                    }}
                                    transition={{
                                        rotateY: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                                        rotateX: { duration: 4.5, repeat: Infinity, ease: "easeInOut" },
                                        rotateZ: { duration: 5.5, repeat: Infinity, ease: "easeInOut" },
                                    }}
                                    style={{ transformStyle: 'preserve-3d' }}
                                >
                                    <span className={cn(emojiSize, "drop-shadow-xl select-none block")}>🍃</span>
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </div>
                {text && (
                    <p className="text-muted-foreground/70 text-sm font-medium tracking-wide animate-pulse">
                        {text}
                    </p>
                )}
            </motion.div>
        </div>
    );
};


// --- 2. Button Loader ---
interface ButtonLoaderProps {
    className?: string;
    text?: string;
}

export const ButtonLoader = ({ className, text = "Processing..." }: ButtonLoaderProps) => {
    return (
        <motion.span 
            className={cn("flex items-center gap-2", className)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
        >
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{text}</span>
        </motion.span>
    );
};


// --- 3. Skeleton Card (Product) Skeleton ---
interface SkeletonCardProps {
    className?: string;
    count?: number;
}

export const SkeletonCard = ({ className, count = 1 }: SkeletonCardProps) => {
    return (
        <div className={cn("grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6", className)}>
            {Array.from({ length: count }).map((_, i) => (
                <motion.div 
                    key={i} 
                    className="flex flex-col gap-4 p-4 border rounded-xl bg-card/50 h-full"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.2 }}
                >
                    {/* Image Skeleton */}
                    <Skeleton className="w-full aspect-square rounded-lg" />

                    {/* Content Skeleton */}
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>

                    {/* Price & Action Skeleton */}
                    <div className="mt-auto flex items-center justify-between pt-2">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                </motion.div>
            ))}
        </div>
    );
};


// --- 4. Table Skeleton (Admin) ---
interface TableSkeletonProps {
    rows?: number;
    columns?: number;
    className?: string;
}

export const TableSkeleton = ({ rows = 5, columns = 4, className }: TableSkeletonProps) => {
    return (
        <motion.div 
            className={cn("w-full overflow-hidden rounded-md border bg-card", className)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
        >
            {/* Header */}
            <div className="flex items-center gap-4 border-b bg-muted/50 p-4">
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={`header-${i}`} className="h-5 w-full" />
                ))}
            </div>

            {/* Rows */}
            <div className="divide-y">
                {Array.from({ length: rows }).map((_, r) => (
                    <motion.div 
                        key={`row-${r}`} 
                        className="flex items-center gap-4 p-4"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: r * 0.05, duration: 0.2 }}
                    >
                        {Array.from({ length: columns }).map((_, c) => (
                            <Skeleton key={`cell-${r}-${c}`} className="h-4 w-full" />
                        ))}
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};
