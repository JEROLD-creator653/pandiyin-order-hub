
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

const LOADER_LEAVES = [
    { size: 36, x: [0, 6, 10, 3, -7, -10, -4, 0], y: [0, -8, -3, 7, 2, -5, 1, 0], rotate: [0, 8, 16, 10, -6, -14, -4, 0], duration: 5.8, delay: 0 },
    { size: 30, x: [0, -7, -4, 6, 9, 3, -3, 0], y: [0, 4, -6, -10, 0, 7, 3, 0], rotate: [0, -10, -18, -8, 5, 12, 6, 0], duration: 6.5, delay: 0.2 },
    { size: 32, x: [0, 4, -3, -8, -5, 4, 7, 0], y: [0, -4, 6, 1, -7, -3, 4, 0], rotate: [0, 12, 6, -8, -16, -4, 10, 0], duration: 5.4, delay: 0.4 },
    { size: 18, x: [0, -5, -9, -3, 6, 8, 3, 0], y: [0, 3, -3, -6, 1, 4, 0, 0], rotate: [0, -6, -12, -20, -10, 3, 8, 0], duration: 7.5, delay: 0.15 },
    { size: 15, x: [0, 8, 4, -3, -7, -4, 1, 0], y: [0, -3, 4, 7, 3, -4, -1, 0], rotate: [0, 14, 22, 12, 3, -6, 4, 0], duration: 8.2, delay: 0.35 },
];

const LOADER_POSITIONS = [
    { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
    { top: '28%', left: '32%', transform: 'translate(-50%, -50%)' },
    { top: '62%', left: '68%', transform: 'translate(-50%, -50%)' },
    { top: '25%', left: '72%', transform: 'translate(-50%, -50%)' },
    { top: '72%', left: '30%', transform: 'translate(-50%, -50%)' },
];

const SmallLeafSVG = ({ size, detailed = true }: { size: number; detailed?: boolean }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
        <path d="M32 4C32 4 8 20 8 40C8 52 18 60 32 60C46 60 56 52 56 40C56 20 32 4 32 4Z" className="fill-primary/85" />
        <path d="M32 14V52" className="stroke-primary-foreground/30" strokeWidth="1.5" strokeLinecap="round" />
        {detailed && (
            <>
                <path d="M32 24L20 32M32 32L18 40M32 40L22 46" className="stroke-primary-foreground/20" strokeWidth="1" strokeLinecap="round" />
                <path d="M32 24L44 32M32 32L46 40M32 40L42 46" className="stroke-primary-foreground/20" strokeWidth="1" strokeLinecap="round" />
            </>
        )}
    </svg>
);

export const Loader = ({ className, text, size = 'md', delay = 200 }: LoaderProps) => {
    const [show, setShow] = React.useState(delay === 0);

    React.useEffect(() => {
        if (delay > 0) {
            const timer = setTimeout(() => setShow(true), delay);
            return () => clearTimeout(timer);
        }
    }, [delay]);

    if (!show) return null;

    const containerSize = { sm: 'w-24 h-24', md: 'w-32 h-32', lg: 'w-40 h-40' }[size];
    const scale = { sm: 0.6, md: 0.8, lg: 1 }[size];

    return (
        <div className={cn("flex flex-col items-center justify-center min-h-[50vh] w-full", className)}>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center gap-6"
            >
                <div className={cn("relative", containerSize)}>
                    {LOADER_LEAVES.map((leaf, i) => (
                        <motion.div
                            key={i}
                            className="absolute"
                            style={{ ...LOADER_POSITIONS[i] }}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: scale, opacity: i < 3 ? 0.9 : 0.45 }}
                            transition={{ duration: 0.4, delay: leaf.delay, ease: "easeOut" }}
                        >
                            <motion.div
                                animate={{ x: leaf.x, y: leaf.y, rotate: leaf.rotate }}
                                transition={{ duration: leaf.duration, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <SmallLeafSVG size={leaf.size} detailed={i < 3} />
                            </motion.div>
                        </motion.div>
                    ))}
                </div>
                {text && (
                    <p className="text-muted-foreground/80 text-sm font-medium tracking-wide animate-pulse">
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
